import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStatus, DriveStatus, Prisma } from '@prisma/client';
import { EligibilityService } from '../eligibility/eligibility.service';
import { NotificationType } from '../notifications/notification-type';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  // Mock transaction context
  const mockTx = {
    drive: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    studentProfile: {
      findUnique: jest.fn(),
    },
    application: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn((callback) => callback(mockTx)),
    drive: {
      findUnique: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockEligibilityService = {
    checkEligibility: jest.fn(),
  };

  const mockNotificationsService = {
    createFor: jest.fn(),
    createManyFor: jest.fn(),
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
    mockTx.application.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EligibilityService, useValue: mockEligibilityService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  // =========================================================================
  // APPLY TESTS
  // =========================================================================
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

  // =========================================================================
  // WITHDRAW TESTS
  // =========================================================================
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
  });

  // =========================================================================
  // STATUS UPDATE TESTS (CELL)
  // =========================================================================
  describe('updateApplicationStatus', () => {
    it('should update status when transition is valid', async () => {
      const existingApp = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        drive: { id: 10, status: DriveStatus.OPEN },
      };
      mockPrismaService.application.findUnique.mockResolvedValue(existingApp);
      mockPrismaService.application.update.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.SHORTLISTED,
        appliedAt: new Date(),
        student: { id: 1, name: 'Alice', email: 'alice@test.com', studentProfile: null },
      });

      const result = await service.updateApplicationStatus(1, {
        status: ApplicationStatus.SHORTLISTED,
      });

      expect(result.status).toBe(ApplicationStatus.SHORTLISTED);
      expect(mockPrismaService.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { status: ApplicationStatus.SHORTLISTED },
        }),
      );
    });

    it('should throw BadRequestException when transition is invalid', async () => {
      const existingApp = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        drive: { id: 10, status: DriveStatus.OPEN },
      };
      mockPrismaService.application.findUnique.mockResolvedValue(existingApp);

      await expect(
        service.updateApplicationStatus(1, { status: ApplicationStatus.SELECTED }),
      ).rejects.toThrow(
        new BadRequestException('Cannot change status from APPLIED to SELECTED'),
      );
      expect(mockPrismaService.application.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if drive is already COMPLETED', async () => {
      const existingApp = {
        id: 1,
        status: ApplicationStatus.APPLIED,
        drive: { id: 10, status: DriveStatus.COMPLETED },
      };
      mockPrismaService.application.findUnique.mockResolvedValue(existingApp);

      await expect(
        service.updateApplicationStatus(1, { status: ApplicationStatus.SHORTLISTED }),
      ).rejects.toThrow(
        new BadRequestException('Results are already published for this drive'),
      );
      expect(mockPrismaService.application.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // BULK UPDATE TESTS (CELL)
  // =========================================================================
  describe('bulkUpdateApplicationsStatus', () => {
    it('should bulk update applications successfully when all transitions are valid', async () => {
      mockTx.drive.findUnique.mockResolvedValue({ id: 10, status: DriveStatus.OPEN });
      mockTx.application.findMany.mockResolvedValue([
        { id: 1, driveId: 10, status: ApplicationStatus.APPLIED },
        { id: 2, driveId: 10, status: ApplicationStatus.APPLIED },
      ]);
      mockTx.application.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkUpdateApplicationsStatus(10, {
        applicationIds: [1, 2],
        status: ApplicationStatus.SHORTLISTED,
      });

      expect(result).toEqual({ updated: 2 });
      expect(mockTx.application.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { status: ApplicationStatus.SHORTLISTED },
      });
    });

    it('should fail all-or-nothing if any application has an invalid transition or belongs to another drive', async () => {
      mockTx.drive.findUnique.mockResolvedValue({ id: 10, status: DriveStatus.OPEN });
      mockTx.application.findMany.mockResolvedValue([
        { id: 1, driveId: 10, status: ApplicationStatus.APPLIED },
        { id: 2, driveId: 99, status: ApplicationStatus.APPLIED }, // different drive
        { id: 3, driveId: 10, status: ApplicationStatus.SELECTED }, // cannot transition
      ]);

      try {
        await service.bulkUpdateApplicationsStatus(10, {
          applicationIds: [1, 2, 3, 4], // 4 does not exist
          status: ApplicationStatus.SHORTLISTED,
        });
        fail('Expected BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = (error as BadRequestException).getResponse() as any;
        expect(res.message).toBe('Bulk status update failed');
        expect(res.failures).toHaveLength(3);
      }

      expect(mockTx.application.updateMany).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // PUBLISH RESULTS TESTS (CELL)
  // =========================================================================
  describe('publishResults', () => {
    it('should block publish results when pending applications exist and autoRejectPending is false', async () => {
      mockTx.drive.findUnique.mockResolvedValue({ id: 10, status: DriveStatus.OPEN });
      mockTx.application.count.mockResolvedValueOnce(3); // 3 pending

      try {
        await service.publishResults(10, { autoRejectPending: false });
        fail('Expected ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        const res = (error as ConflictException).getResponse() as any;
        expect(res.message).toBe('Some applications are still pending');
        expect(res.pendingCount).toBe(3);
      }

      expect(mockTx.drive.update).not.toHaveBeenCalled();
    });

    it('should auto-reject pending applications and complete drive when autoRejectPending is true', async () => {
      mockTx.drive.findUnique.mockResolvedValue({ id: 10, status: DriveStatus.OPEN });
      mockTx.application.count
        .mockResolvedValueOnce(2) // pending count = 2
        .mockResolvedValueOnce(1) // selected count = 1
        .mockResolvedValueOnce(3) // rejected count = 3
        .mockResolvedValueOnce(4); // total count = 4

      mockTx.application.updateMany.mockResolvedValue({ count: 2 });
      mockTx.drive.update.mockResolvedValue({ id: 10, status: DriveStatus.COMPLETED });

      const result = await service.publishResults(10, { autoRejectPending: true });

      expect(mockTx.application.updateMany).toHaveBeenCalledWith({
        where: {
          driveId: 10,
          status: {
            notIn: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED],
          },
        },
        data: { status: ApplicationStatus.REJECTED },
      });
      expect(mockTx.drive.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: DriveStatus.COMPLETED },
      });
      expect(result).toEqual({
        driveId: 10,
        status: DriveStatus.COMPLETED,
        selected: 1,
        rejected: 3,
        total: 4,
      });
    });

    it('should throw 409 ConflictException when publishing an already completed drive', async () => {
      mockTx.drive.findUnique.mockResolvedValue({ id: 10, status: DriveStatus.COMPLETED });

      await expect(service.publishResults(10)).rejects.toThrow(
        new ConflictException('Results are already published'),
      );
      expect(mockTx.drive.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // STUDENT STATUS MASKING TESTS
  // =========================================================================
  describe('Student Status Masking (getMyApplications & getApplicationById)', () => {
    it('should mask SELECTED and REJECTED as UNDER_REVIEW when drive is not COMPLETED', async () => {
      const apps = [
        {
          id: 1,
          status: ApplicationStatus.SELECTED,
          appliedAt: new Date(),
          drive: { id: 10, status: DriveStatus.OPEN },
        },
        {
          id: 2,
          status: ApplicationStatus.REJECTED,
          appliedAt: new Date(),
          drive: { id: 11, status: DriveStatus.CLOSED },
        },
        {
          id: 3,
          status: ApplicationStatus.SELECTED,
          appliedAt: new Date(),
          drive: { id: 12, status: DriveStatus.COMPLETED },
        },
        {
          id: 4,
          status: ApplicationStatus.APPLIED,
          appliedAt: new Date(),
          drive: { id: 10, status: DriveStatus.OPEN },
        },
      ];

      mockPrismaService.application.count.mockResolvedValue(4);
      mockPrismaService.application.findMany.mockResolvedValue(apps);

      const result = await service.getMyApplications(1, {});

      expect(result.data[0].status).toBe('UNDER_REVIEW');
      expect(result.data[1].status).toBe('UNDER_REVIEW');
      expect(result.data[2].status).toBe(ApplicationStatus.SELECTED); // unmasked because drive COMPLETED
      expect(result.data[3].status).toBe(ApplicationStatus.APPLIED);
    });

    it('should mask single application status as UNDER_REVIEW in getApplicationById if drive not completed', async () => {
      const singleApp = {
        id: 1,
        status: ApplicationStatus.SELECTED,
        appliedAt: new Date(),
        drive: { id: 10, status: DriveStatus.OPEN },
      };

      mockPrismaService.application.findFirst.mockResolvedValue(singleApp);

      const result = await service.getApplicationById(1, 1);
      expect(result.status).toBe('UNDER_REVIEW');
    });
  });
});
