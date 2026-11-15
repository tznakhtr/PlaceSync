import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStatus, DriveStatus } from '@prisma/client';
import { ApplicationsService } from '../applications/applications.service';
import { DrivesService } from '../drives/drives.service';
import { EligibilityService } from '../eligibility/eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from './notification-type';
import { NotificationsService } from './notifications.service';

describe('NotificationsService and Business Triggers', () => {
  let notificationsService: NotificationsService;
  let drivesService: DrivesService;
  let applicationsService: ApplicationsService;

  const mockTx = {
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
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
    $transaction: jest.fn((cb) => cb(mockTx)),
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    studentProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    drive: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockEligibilityService = {
    checkEligibility: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        DrivesService,
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EligibilityService, useValue: mockEligibilityService },
      ],
    }).compile();

    notificationsService = module.get<NotificationsService>(NotificationsService);
    drivesService = module.get<DrivesService>(DrivesService);
    applicationsService = module.get<ApplicationsService>(ApplicationsService);
  });

  // =========================================================================
  // 1. NOTIFICATIONS SERVICE CORE METHODS
  // =========================================================================
  describe('NotificationsService core methods', () => {
    it('createFor should insert a single notification with correct fields', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 1,
        userId: 10,
        type: NotificationType.APPLICATION_SUBMITTED,
        message: 'Your application was submitted.',
        driveId: 5,
        isRead: false,
        createdAt: new Date(),
      });

      const res = await notificationsService.createFor(
        10,
        NotificationType.APPLICATION_SUBMITTED,
        'Your application was submitted.',
        5,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 10,
          type: NotificationType.APPLICATION_SUBMITTED,
          message: 'Your application was submitted.',
          driveId: 5,
          isRead: false,
        },
      });
      expect(res.id).toBe(1);
    });

    it('createManyFor with several users should insert batch notifications in one query', async () => {
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 3 });

      const userIds = [101, 102, 103];
      const message = 'New drive posted: Google is hiring.';
      const res = await notificationsService.createManyFor(
        userIds,
        NotificationType.NEW_DRIVE,
        message,
        15,
      );

      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 101,
            type: NotificationType.NEW_DRIVE,
            message,
            driveId: 15,
            isRead: false,
          },
          {
            userId: 102,
            type: NotificationType.NEW_DRIVE,
            message,
            driveId: 15,
            isRead: false,
          },
          {
            userId: 103,
            type: NotificationType.NEW_DRIVE,
            message,
            driveId: 15,
            isRead: false,
          },
        ],
      });
      expect(res).toEqual({ count: 3 });
    });

    it('createManyFor should return { count: 0 } and skip database call if userIds array is empty', async () => {
      const res = await notificationsService.createManyFor(
        [],
        NotificationType.NEW_DRIVE,
        'No users to notify',
      );

      expect(res).toEqual({ count: 0 });
      expect(mockPrismaService.notification.createMany).not.toHaveBeenCalled();
    });

    it('getUserNotifications should return paginated list and metadata', async () => {
      mockPrismaService.notification.count.mockResolvedValue(1);
      mockPrismaService.notification.findMany.mockResolvedValue([
        {
          id: 1,
          type: NotificationType.NEW_DRIVE,
          message: 'New drive posted',
          driveId: 5,
          isRead: false,
          createdAt: new Date(),
        },
      ]);

      const res = await notificationsService.getUserNotifications(10, {
        page: 1,
        limit: 20,
        unreadOnly: true,
      });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 10, isRead: false },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          message: true,
          driveId: true,
          isRead: true,
          createdAt: true,
        },
      });
      expect(res.data).toHaveLength(1);
      expect(res.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('getUnreadCount should return unread notification count for user', async () => {
      mockPrismaService.notification.count.mockResolvedValue(4);

      const res = await notificationsService.getUnreadCount(10);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 10, isRead: false },
      });
      expect(res).toEqual({ count: 4 });
    });

    it('mark-read should update notification as read when it belongs to user', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue({
        id: 7,
        userId: 10,
        isRead: false,
      });
      mockPrismaService.notification.update.mockResolvedValue({
        id: 7,
        type: NotificationType.STATUS_UPDATE,
        message: 'Status update',
        driveId: 1,
        isRead: true,
        createdAt: new Date(),
      });

      const res = await notificationsService.markAsRead(10, 7);

      expect(mockPrismaService.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 7, userId: 10 },
      });
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { isRead: true },
        select: {
          id: true,
          type: true,
          message: true,
          driveId: true,
          isRead: true,
          createdAt: true,
        },
      });
      expect(res.isRead).toBe(true);
    });

    it('mark-read returns 404 for another user\'s notification or non-existent notification', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(notificationsService.markAsRead(10, 999)).rejects.toThrow(
        new NotFoundException('Notification not found'),
      );
      expect(mockPrismaService.notification.update).not.toHaveBeenCalled();
    });

    it('markAllAsRead should mark all unread notifications of user as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const res = await notificationsService.markAllAsRead(10);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 10, isRead: false },
        data: { isRead: true },
      });
      expect(res).toEqual({ updated: 5 });
    });
  });

  // =========================================================================
  // 2. TRIGGER: NEW_DRIVE (DrivesService.create)
  // =========================================================================
  describe('Trigger: NEW_DRIVE', () => {
    it('new-drive trigger notifies only eligible students', async () => {
      const drive = {
        id: 25,
        companyName: 'Microsoft',
        role: 'SWE',
        deadline: new Date('2026-12-15T18:00:00Z'),
        status: DriveStatus.OPEN,
        createdById: 1,
      };

      mockPrismaService.drive.create.mockResolvedValue(drive);

      const profiles = [
        { userId: 101, branch: 'CSE', cgpa: 9.0 },
        { userId: 102, branch: 'ME', cgpa: 6.5 },
        { userId: 103, branch: 'IT', cgpa: 8.5 },
      ];
      mockPrismaService.studentProfile.findMany.mockResolvedValue(profiles);

      // Student 101 and 103 are eligible, 102 is ineligible
      mockEligibilityService.checkEligibility.mockImplementation((profile) => {
        if (profile.userId === 102) {
          return { eligible: false, reasons: ['Branch not allowed'] };
        }
        return { eligible: true, reasons: [] };
      });

      mockPrismaService.notification.createMany.mockResolvedValue({ count: 2 });

      await drivesService.create(1, {
        companyName: 'Microsoft',
        role: 'SWE',
        description: 'Software Engineer role',
        packageLpa: 22,
        requiredSkills: ['typescript', 'react'],
        minCgpa: 8.0,
        allowedBranches: ['CSE', 'IT'],
        maxBacklogs: 0,
        graduationYear: 2026,
        deadline: '2026-12-15T18:00:00Z',
      });

      // Expected call to createMany with only user 101 and 103
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 101,
            type: NotificationType.NEW_DRIVE,
            message: 'New drive: Microsoft - SWE. Apply before 2026-12-15.',
            driveId: 25,
            isRead: false,
          },
          {
            userId: 103,
            type: NotificationType.NEW_DRIVE,
            message: 'New drive: Microsoft - SWE. Apply before 2026-12-15.',
            driveId: 25,
            isRead: false,
          },
        ],
      });
    });
  });

  // =========================================================================
  // 3. TRIGGER: APPLICATION_SUBMITTED (ApplicationsService.apply)
  // =========================================================================
  describe('Trigger: APPLICATION_SUBMITTED', () => {
    it('notifies the student inside transaction when application is submitted successfully', async () => {
      const drive = {
        id: 10,
        companyName: 'Amazon',
        role: 'SDE 1',
        deadline: new Date(Date.now() + 86400000),
        status: DriveStatus.OPEN,
      };

      mockTx.drive.findUnique.mockResolvedValue(drive);
      mockTx.studentProfile.findUnique.mockResolvedValue({ userId: 101 });
      mockEligibilityService.checkEligibility.mockReturnValue({ eligible: true, reasons: [] });

      mockTx.application.create.mockResolvedValue({
        id: 1,
        status: ApplicationStatus.APPLIED,
        appliedAt: new Date(),
        drive: { id: 10, companyName: 'Amazon', role: 'SDE 1', deadline: drive.deadline },
      });

      await applicationsService.apply(101, 10);

      expect(mockTx.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 101,
          type: NotificationType.APPLICATION_SUBMITTED,
          message: 'Your application to Amazon (SDE 1) was submitted.',
          driveId: 10,
          isRead: false,
        },
      });
    });
  });

  // =========================================================================
  // 4. TRIGGER: STATUS_UPDATE (ApplicationsService.updateApplicationStatus & bulk)
  // =========================================================================
  describe('Trigger: STATUS_UPDATE', () => {
    it('status trigger: SHORTLISTED notifies, SELECTED does NOT', async () => {
      const drive = { id: 10, companyName: 'Google', status: DriveStatus.OPEN };

      // Case A: SHORTLISTED notifies student
      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 50,
        studentId: 101,
        driveId: 10,
        status: ApplicationStatus.APPLIED,
        drive,
      });
      mockPrismaService.application.update.mockResolvedValueOnce({
        id: 50,
        status: ApplicationStatus.SHORTLISTED,
        appliedAt: new Date(),
        student: { id: 101, name: 'Student', email: 's@test.com', studentProfile: null },
      });

      await applicationsService.updateApplicationStatus(50, {
        status: ApplicationStatus.SHORTLISTED,
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 101,
          type: NotificationType.STATUS_UPDATE,
          message: 'You have been shortlisted for Google',
          driveId: 10,
          isRead: false,
        },
      });

      // Clear calls before next check
      mockPrismaService.notification.create.mockClear();

      // Case B: SELECTED does NOT notify student (results are published later)
      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 50,
        studentId: 101,
        driveId: 10,
        status: ApplicationStatus.INTERVIEW,
        drive,
      });
      mockPrismaService.application.update.mockResolvedValueOnce({
        id: 50,
        status: ApplicationStatus.SELECTED,
        appliedAt: new Date(),
        student: { id: 101, name: 'Student', email: 's@test.com', studentProfile: null },
      });

      await applicationsService.updateApplicationStatus(50, {
        status: ApplicationStatus.SELECTED,
      });

      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();

      // Case C: REJECTED does NOT notify student
      mockPrismaService.notification.create.mockClear();

      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 50,
        studentId: 101,
        driveId: 10,
        status: ApplicationStatus.INTERVIEW,
        drive,
      });
      mockPrismaService.application.update.mockResolvedValueOnce({
        id: 50,
        status: ApplicationStatus.REJECTED,
        appliedAt: new Date(),
        student: { id: 101, name: 'Student', email: 's@test.com', studentProfile: null },
      });

      await applicationsService.updateApplicationStatus(50, {
        status: ApplicationStatus.REJECTED,
      });

      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();

      // Case D: INTERVIEW notifies student
      mockPrismaService.notification.create.mockClear();

      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 50,
        studentId: 101,
        driveId: 10,
        status: ApplicationStatus.SHORTLISTED,
        drive,
      });
      mockPrismaService.application.update.mockResolvedValueOnce({
        id: 50,
        status: ApplicationStatus.INTERVIEW,
        appliedAt: new Date(),
        student: { id: 101, name: 'Student', email: 's@test.com', studentProfile: null },
      });

      await applicationsService.updateApplicationStatus(50, {
        status: ApplicationStatus.INTERVIEW,
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 101,
          type: NotificationType.STATUS_UPDATE,
          message: 'Interview stage reached for Google',
          driveId: 10,
          isRead: false,
        },
      });
    });

    it('bulkUpdateApplicationsStatus notifies all batch students for SHORTLISTED inside transaction', async () => {
      const drive = { id: 10, companyName: 'Uber', status: DriveStatus.OPEN };
      mockTx.drive.findUnique.mockResolvedValue(drive);
      mockTx.application.findMany.mockResolvedValue([
        { id: 1, driveId: 10, studentId: 101, status: ApplicationStatus.APPLIED },
        { id: 2, driveId: 10, studentId: 102, status: ApplicationStatus.APPLIED },
      ]);
      mockTx.application.updateMany.mockResolvedValue({ count: 2 });

      await applicationsService.bulkUpdateApplicationsStatus(10, {
        applicationIds: [1, 2],
        status: ApplicationStatus.SHORTLISTED,
      });

      expect(mockTx.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 101,
            type: NotificationType.STATUS_UPDATE,
            message: 'You have been shortlisted for Uber',
            driveId: 10,
            isRead: false,
          },
          {
            userId: 102,
            type: NotificationType.STATUS_UPDATE,
            message: 'You have been shortlisted for Uber',
            driveId: 10,
            isRead: false,
          },
        ],
      });
    });
  });

  // =========================================================================
  // 5. TRIGGER: RESULT_PUBLISHED (ApplicationsService.publishResults)
  // =========================================================================
  describe('Trigger: RESULT_PUBLISHED', () => {
    it('publish results notifies every applicant with the right message', async () => {
      const drive = { id: 10, companyName: 'Google', role: 'Software Engineer', status: DriveStatus.OPEN };
      mockTx.drive.findUnique.mockResolvedValue(drive);
      mockTx.application.count
        .mockResolvedValueOnce(0) // pending count = 0
        .mockResolvedValueOnce(2) // selected count = 2
        .mockResolvedValueOnce(1) // rejected count = 1
        .mockResolvedValueOnce(3); // total count = 3

      // Return applicants for notification distribution
      mockTx.application.findMany.mockResolvedValue([
        { studentId: 101, status: ApplicationStatus.SELECTED },
        { studentId: 102, status: ApplicationStatus.SELECTED },
        { studentId: 103, status: ApplicationStatus.REJECTED },
      ]);

      mockTx.drive.update.mockResolvedValue({ id: 10, status: DriveStatus.COMPLETED });

      const result = await applicationsService.publishResults(10);

      expect(result.status).toBe(DriveStatus.COMPLETED);

      // Verify selected students notification
      expect(mockTx.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 101,
            type: NotificationType.RESULT_PUBLISHED,
            message: 'Congratulations! You have been selected by Google.',
            driveId: 10,
            isRead: false,
          },
          {
            userId: 102,
            type: NotificationType.RESULT_PUBLISHED,
            message: 'Congratulations! You have been selected by Google.',
            driveId: 10,
            isRead: false,
          },
        ],
      });

      // Verify rejected students notification
      expect(mockTx.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 103,
            type: NotificationType.RESULT_PUBLISHED,
            message: 'Results for Google are out. You were not selected this time.',
            driveId: 10,
            isRead: false,
          },
        ],
      });
    });
  });
});
