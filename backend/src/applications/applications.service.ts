import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, DriveStatus, Prisma } from '@prisma/client';
import { EligibilityService } from '../eligibility/eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryApplicationsDto } from './dto/query-applications.dto';

/**
 * ApplicationsService manages student placement job applications.
 * Handles applying with atomic validation, application tracking, and withdrawal.
 */
@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: EligibilityService,
  ) {}

  /**
   * Apply to a drive inside an atomic transaction.
   * - Validates drive existence and student eligibility.
   * - Creates the application with status APPLIED.
   * - Catches P2002 to safely handle concurrent duplicate requests.
   */
  async apply(userId: number, driveId: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // a. Load the drive
        const drive = await tx.drive.findUnique({
          where: { id: driveId },
        });

        if (!drive) {
          throw new NotFoundException('Drive not found');
        }

        // b. Load the student's profile (can be null)
        const profile = await tx.studentProfile.findUnique({
          where: { userId },
        });

        // c. Evaluate eligibility via EligibilityService
        const eligibility = this.eligibilityService.checkEligibility(profile, drive);

        // d. Reject if ineligible with descriptive reasons
        if (!eligibility.eligible) {
          throw new ForbiddenException({
            message: 'You are not eligible for this drive',
            reasons: eligibility.reasons,
          });
        }

        // e. Create application with status APPLIED
        const application = await tx.application.create({
          data: {
            studentId: userId,
            driveId: drive.id,
            status: ApplicationStatus.APPLIED,
            matchScore: null,
          },
          select: {
            id: true,
            status: true,
            appliedAt: true,
            drive: {
              select: {
                id: true,
                companyName: true,
                role: true,
                deadline: true,
              },
            },
          },
        });

        return application;
      });
    } catch (error) {
      // Prisma error code P2002: unique constraint violation on (studentId, driveId)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already applied to this drive');
      }
      throw error;
    }
  }

  /**
   * Retrieve the authenticated student's applications, sorted newest first.
   */
  async getMyApplications(userId: number, query: QueryApplicationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      studentId: userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [total, applications] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          status: true,
          appliedAt: true,
          drive: {
            select: {
              id: true,
              companyName: true,
              role: true,
              packageLpa: true,
              location: true,
              deadline: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieve a single application by ID for the logged-in student.
   * If it does not exist or belongs to another student, returns 404.
   */
  async getApplicationById(userId: number, id: number) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        studentId: userId,
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        drive: {
          select: {
            id: true,
            companyName: true,
            role: true,
            packageLpa: true,
            location: true,
            deadline: true,
            status: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  /**
   * Withdraw an application.
   * Only permitted if application status is APPLIED, drive is OPEN, and deadline is in the future.
   */
  async withdraw(userId: number, id: number) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        studentId: userId,
      },
      include: {
        drive: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const isAppliedStatus = application.status === ApplicationStatus.APPLIED;
    const isDriveOpen = application.drive.status === DriveStatus.OPEN;
    const isBeforeDeadline = new Date(application.drive.deadline).getTime() > Date.now();

    if (!isAppliedStatus || !isDriveOpen || !isBeforeDeadline) {
      throw new BadRequestException(
        'You can only withdraw before the deadline while your application is still in APPLIED status',
      );
    }

    await this.prisma.application.delete({
      where: { id },
    });

    return { message: 'Application withdrawn successfully' };
  }
}
