import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStatus, DriveStatus, Prisma } from '@prisma/client';
import { EligibilityService } from '../eligibility/eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  // Mock transaction context
  const mockTx = {
    drive: {
      findUnique: jest.fn(),
    },
    studentProfile: {
      findUnique: jest.fn(),
    },
    application: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn((callback) => callback(mockTx)),
    application: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockEligibilityService = {
    checkEligibility: jest.fn(),
  };

  const sampleDrive = {
    id: 10,
    companyName: 'Acme Corp',
    role: 'SDE 1',
    status: DriveStatus.OPEN,
    deadline: new Date(Date.now() + 86400000), // Tomorrow
  };

  const sampleProfile = {
    userId: 1,
    rollNo: '2024CSE001',
    branch: 'CSE',
    cgpa: 8.5,
    activeBacklogs: 0,
    graduationYear: 2026,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EligibilityService, useValue: mockEligibilityService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('apply', () => {
    it('should successfully apply when student is eligible', async () => {
      mockTx.drive.findUnique.mockResolvedValue(sampleDrive);
      mockTx.studentProfile.findUnique.mockResolvedValue(sampleProfile);
      mockEligibilityService.checkEligibility.mockReturnValue({
        eligible: true,
        reasons: [],
      });

      const createdApplication = {
        id: 100,
        status: ApplicationStatus.APPLIED,
        appliedAt: new Date(),
        drive: {
          id: sampleDrive.id,
          companyName: sampleDrive.companyName,
          role: sampleDrive.role,
          deadline: sampleDrive.deadline,
        },
      };
      mockTx.application.create.mockResolvedValue(createdApplication);

      const result = await service.apply(1, 10);

      expect(mockTx.drive.findUnique).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(mockTx.studentProfile.findUnique).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(mockEligibilityService.checkEligibility).toHaveBeenCalledWith(sampleProfile, sampleDrive);
      expect(mockTx.application.create).toHaveBeenCalledWith({
        data: {
          studentId: 1,
          driveId: 10,
          status: ApplicationStatus.APPLIED,
          matchScore: null,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(createdApplication);
    });

    it('should throw NotFoundException if drive does not exist', async () => {
      mockTx.drive.findUnique.mockResolvedValue(null);

      await expect(service.apply(1, 999)).rejects.toThrow(
        new NotFoundException('Drive not found'),
      );
      expect(mockTx.application.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException with reasons when student is not eligible', async () => {
      mockTx.drive.findUnique.mockResolvedValue(sampleDrive);
      mockTx.studentProfile.findUnique.mockResolvedValue(sampleProfile);
      mockEligibilityService.checkEligibility.mockReturnValue({
        eligible: false,
        reasons: ['Minimum CGPA required is 8.0, yours is 7.2'],
      });

      try {
        await service.apply(1, 10);
        fail('Expected ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toEqual({
          message: 'You are not eligible for this drive',
          reasons: ['Minimum CGPA required is 8.0, yours is 7.2'],
        });
      }

      expect(mockTx.application.create).not.toHaveBeenCalled();
    });

    it('should map Prisma P2002 duplicate constraint error to 409 ConflictException', async () => {
      mockTx.drive.findUnique.mockResolvedValue(sampleDrive);
      mockTx.studentProfile.findUnique.mockResolvedValue(sampleProfile);
      mockEligibilityService.checkEligibility.mockReturnValue({
        eligible: true,
        reasons: [],
      });

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`studentId`,`driveId`)',
        {
          code: 'P2002',
          clientVersion: '5.22.0',
        },
      );
      mockTx.application.create.mockRejectedValue(p2002Error);

      await expect(service.apply(1, 10)).rejects.toThrow(
        new ConflictException('You have already applied to this drive'),
      );
    });
  });

  describe('withdraw', () => {
    it('should successfully withdraw if status is APPLIED and drive is open with future deadline', async () => {
      const activeApplication = {
        id: 50,
        studentId: 1,
        status: ApplicationStatus.APPLIED,
        drive: {
          status: DriveStatus.OPEN,
          deadline: new Date(Date.now() + 86400000), // Tomorrow
        },
      };

      mockPrismaService.application.findFirst.mockResolvedValue(activeApplication);
      mockPrismaService.application.delete.mockResolvedValue(activeApplication);

      const result = await service.withdraw(1, 50);

      expect(mockPrismaService.application.delete).toHaveBeenCalledWith({ where: { id: 50 } });
      expect(result).toEqual({ message: 'Application withdrawn successfully' });
    });

    it('should throw NotFoundException if application does not exist or belongs to another user', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      await expect(service.withdraw(1, 50)).rejects.toThrow(
        new NotFoundException('Application not found'),
      );
      expect(mockPrismaService.application.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if application status has changed from APPLIED', async () => {
      const shortlistedApplication = {
        id: 50,
        studentId: 1,
        status: ApplicationStatus.SHORTLISTED,
        drive: {
          status: DriveStatus.OPEN,
          deadline: new Date(Date.now() + 86400000),
        },
      };

      mockPrismaService.application.findFirst.mockResolvedValue(shortlistedApplication);

      await expect(service.withdraw(1, 50)).rejects.toThrow(
        new BadRequestException(
          'You can only withdraw before the deadline while your application is still in APPLIED status',
        ),
      );
      expect(mockPrismaService.application.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if drive deadline has already passed', async () => {
      const pastDeadlineApplication = {
        id: 50,
        studentId: 1,
        status: ApplicationStatus.APPLIED,
        drive: {
          status: DriveStatus.OPEN,
          deadline: new Date(Date.now() - 10000), // 10 seconds ago
        },
      };

      mockPrismaService.application.findFirst.mockResolvedValue(pastDeadlineApplication);

      await expect(service.withdraw(1, 50)).rejects.toThrow(
        new BadRequestException(
          'You can only withdraw before the deadline while your application is still in APPLIED status',
        ),
      );
      expect(mockPrismaService.application.delete).not.toHaveBeenCalled();
    });
  });
});
