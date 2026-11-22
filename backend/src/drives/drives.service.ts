import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriveStatus, Prisma } from '@prisma/client';
import { EligibilityService } from '../eligibility/eligibility.service';
import { NotificationType } from '../notifications/notification-type';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriveDto } from './dto/create-drive.dto';
import { QueryDrivesDto } from './dto/query-drives.dto';
import { UpdateDriveStatusDto } from './dto/update-drive-status.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';

/**
 * Service managing placement drives.
 * Handles CRUD operations, status management, pagination, and role-based response formatting.
 */
@Injectable()
export class DrivesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: EligibilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new placement drive.
   * New drives always start with status OPEN.
   * createdById is set strictly from the authenticated CELL user.
   * Triggers in-app notification to all eligible students.
   */
  async create(userId: number, dto: CreateDriveDto) {
    const drive = await this.prisma.drive.create({
      data: {
        companyName: dto.companyName,
        role: dto.role,
        description: dto.description,
        packageLpa: dto.packageLpa,
        location: dto.location,
        requiredSkills: dto.requiredSkills,
        minCgpa: dto.minCgpa,
        allowedBranches: dto.allowedBranches,
        maxBacklogs: dto.maxBacklogs,
        graduationYear: dto.graduationYear,
        deadline: new Date(dto.deadline),
        status: DriveStatus.OPEN,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Notify all eligible students about the new drive
    const studentProfiles = await this.prisma.studentProfile.findMany();
    const eligibleStudentUserIds = studentProfiles
      .filter((profile) => this.eligibilityService.checkEligibility(profile, drive).eligible)
      .map((profile) => profile.userId);

    if (eligibleStudentUserIds.length > 0) {
      const deadlineDate = new Date(drive.deadline).toISOString().split('T')[0];
      const message = `New drive: ${drive.companyName} - ${drive.role}. Apply before ${deadlineDate}.`;
      await this.notificationsService.createManyFor(
        eligibleStudentUserIds,
        NotificationType.NEW_DRIVE,
        message,
        drive.id,
      );
    }

    return drive;
  }

  /**
   * Retrieve a paginated list of drives sorted by deadline ascending (soonest first).
   * - For STUDENT: evaluates eligibility via EligibilityService, supports ?eligibleOnly=true filter.
   * - For CELL: includes applicationsCount; does NOT include eligibility.
   */
  async findAll(query: QueryDrivesDto, userId: number, isCell: boolean) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DriveWhereInput = {};

    // For STUDENT users, load the student profile once for eligibility checks
    let studentProfile: Awaited<ReturnType<typeof this.prisma.studentProfile.findUnique>> = null;

    if (!isCell) {
      studentProfile = await this.prisma.studentProfile.findUnique({
        where: { userId },
      });

      // If ?eligibleOnly=true is requested by a STUDENT
      if (query.eligibleOnly) {
        // If student has no profile, no drives can be eligible
        if (!studentProfile) {
          return {
            data: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          };
        }

        // Apply Prisma filters matching the exact eligibility criteria to ensure accurate pagination
        where.status = DriveStatus.OPEN;
        where.deadline = { gt: new Date() };
        where.minCgpa = { lte: studentProfile.cgpa };
        where.maxBacklogs = { gte: studentProfile.activeBacklogs };
        where.graduationYear = studentProfile.graduationYear;
        where.allowedBranches = { has: studentProfile.branch };
      }
    }

    // Apply explicit status filter if provided (and not already overridden by eligibleOnly)
    if (query.status && !where.status) {
      where.status = query.status;
    }

    // Case-insensitive search on companyName or role
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { role: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, drives] = await Promise.all([
      this.prisma.drive.count({ where }),
      this.prisma.drive.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deadline: 'asc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          ...(isCell ? { _count: { select: { applications: true } } } : {}),
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    // Format responses based on role:
    // CELL users get applicationsCount (no eligibility)
    // STUDENT users get eligibility object (no applicationsCount)
    const data = drives.map((drive) => {
      if (isCell) {
        const { _count, ...rest } = drive as typeof drive & { _count?: { applications: number } };
        return {
          ...rest,
          applicationsCount: _count?.applications ?? 0,
        };
      }

      // Single source of truth for reasons evaluated on each drive
      const eligibility = this.eligibilityService.checkEligibility(studentProfile, drive);
      return {
        ...drive,
        eligibility,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieve a single drive by ID.
   * Throws 404 if not found.
   * - CELL users receive applicationsCount.
   * - STUDENT users receive eligibility.
   */
  async findOne(id: number, userId: number, isCell: boolean) {
    const drive = await this.prisma.drive.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        ...(isCell ? { _count: { select: { applications: true } } } : {}),
      },
    });

    if (!drive) {
      throw new NotFoundException(`Drive with ID ${id} not found`);
    }

    if (isCell) {
      const { _count, ...rest } = drive as typeof drive & { _count?: { applications: number } };
      return {
        ...rest,
        applicationsCount: _count?.applications ?? 0,
      };
    }

    // For STUDENT users, evaluate eligibility against the student's profile
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    const eligibility = this.eligibilityService.checkEligibility(studentProfile, drive);

    return {
      ...drive,
      eligibility,
    };
  }

  /**
   * Update an existing drive.
   * Throws 404 if not found.
   * Throws 400 if the drive status is COMPLETED.
   */
  async update(id: number, dto: UpdateDriveDto) {
    const existingDrive = await this.prisma.drive.findUnique({
      where: { id },
    });

    if (!existingDrive) {
      throw new NotFoundException(`Drive with ID ${id} not found`);
    }

    if (existingDrive.status === DriveStatus.COMPLETED) {
      throw new BadRequestException('Cannot edit a drive that is already COMPLETED');
    }

    return this.prisma.drive.update({
      where: { id },
      data: {
        companyName: dto.companyName,
        role: dto.role,
        description: dto.description,
        packageLpa: dto.packageLpa,
        location: dto.location,
        requiredSkills: dto.requiredSkills,
        minCgpa: dto.minCgpa,
        allowedBranches: dto.allowedBranches,
        maxBacklogs: dto.maxBacklogs,
        graduationYear: dto.graduationYear,
        deadline: new Date(dto.deadline),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update status of a drive (OPEN, CLOSED, COMPLETED).
   * Throws 404 if drive does not exist.
   */
  async updateStatus(id: number, dto: UpdateDriveStatusDto) {
    const existingDrive = await this.prisma.drive.findUnique({
      where: { id },
    });

    if (!existingDrive) {
      throw new NotFoundException(`Drive with ID ${id} not found`);
    }

    return this.prisma.drive.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete a drive.
   * Throws 404 if not found.
   * Throws 409 Conflict if the drive already has applications.
   */
  async remove(id: number) {
    const existingDrive = await this.prisma.drive.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!existingDrive) {
      throw new NotFoundException(`Drive with ID ${id} not found`);
    }

    if (existingDrive._count.applications > 0) {
      throw new ConflictException('This drive already has applications. Close it instead of deleting.');
    }

    await this.prisma.drive.delete({
      where: { id },
    });

    return { message: 'Drive deleted successfully' };
  }
}
