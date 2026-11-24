import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DriveStatus } from '@prisma/client';
import { EligibilityService } from '../eligibility/eligibility.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { DrivesService } from './drives.service';

describe('DrivesService - Status Transitions & Security Rules', () => {
  let service: DrivesService;

  const mockPrismaService = {
    drive: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    studentProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockEligibilityService = {
    checkEligibility: jest.fn(),
  };

  const mockNotificationsService = {
    createManyFor: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrivesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EligibilityService,
          useValue: mockEligibilityService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<DrivesService>(DrivesService);
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if drive does not exist', async () => {
      mockPrismaService.drive.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, { status: 'OPEN' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if drive is already COMPLETED', async () => {
      mockPrismaService.drive.findUnique.mockResolvedValue({
        id: 1,
        companyName: 'Acme Corp',
        status: DriveStatus.COMPLETED,
      });

      await expect(service.updateStatus(1, { status: 'OPEN' })).rejects.toThrow(
        new BadRequestException('Results are already published; the status cannot be changed'),
      );
    });

    it('should throw BadRequestException if target status is COMPLETED', async () => {
      mockPrismaService.drive.findUnique.mockResolvedValue({
        id: 1,
        companyName: 'Acme Corp',
        status: DriveStatus.OPEN,
      });

      await expect(service.updateStatus(1, { status: 'COMPLETED' })).rejects.toThrow(
        new BadRequestException('A drive becomes completed only when results are published'),
      );
    });

    it('should successfully update status from OPEN to CLOSED', async () => {
      mockPrismaService.drive.findUnique.mockResolvedValue({
        id: 1,
        companyName: 'Acme Corp',
        status: DriveStatus.OPEN,
      });
      mockPrismaService.drive.update.mockResolvedValue({
        id: 1,
        companyName: 'Acme Corp',
        status: DriveStatus.CLOSED,
        createdBy: { id: 2, name: 'Placement Officer' },
      });

      const result = await service.updateStatus(1, { status: 'CLOSED' });
      expect(result.status).toBe(DriveStatus.CLOSED);
      expect(mockPrismaService.drive.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: DriveStatus.CLOSED },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });

    it('should successfully update status from CLOSED to OPEN', async () => {
      mockPrismaService.drive.findUnique.mockResolvedValue({
        id: 1,
        companyName: 'Acme Corp',
        status: DriveStatus.CLOSED,
      });
      mockPrismaService.drive.update.mockResolvedValue({
        id: 1,
        companyName: 'Acme Corp',
        status: DriveStatus.OPEN,
        createdBy: { id: 2, name: 'Placement Officer' },
      });

      const result = await service.updateStatus(1, { status: 'OPEN' });
      expect(result.status).toBe(DriveStatus.OPEN);
      expect(mockPrismaService.drive.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: DriveStatus.OPEN },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    });
  });

  describe('update (details)', () => {
    it('should throw BadRequestException when attempting to edit a COMPLETED drive', async () => {
      mockPrismaService.drive.findUnique.mockResolvedValue({
        id: 1,
        companyName: 'Acme Corp',
        status: DriveStatus.COMPLETED,
      });

      await expect(
        service.update(1, {
          companyName: 'New Name',
        } as any),
      ).rejects.toThrow(
        new BadRequestException('Cannot edit a drive that is already COMPLETED'),
      );
    });
  });
});
