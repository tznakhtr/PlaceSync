import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, DriveStatus, Prisma } from '@prisma/client';
import { EligibilityService } from '../eligibility/eligibility.service';
import { NotificationType } from '../notifications/notification-type';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { canTransition } from './application-status';
import { BulkUpdateApplicationsStatusDto } from './dto/bulk-update-applications-status.dto';
import { PublishResultsDto } from './dto/publish-results.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { QueryDriveApplicationsDto } from './dto/query-drive-applications.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

/**
 * Service managing applications across both Student and Placement Cell workflows.
 */
@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: EligibilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // =========================================================================
  // STUDENT WORKFLOWS
  // =========================================================================

  /**
   * Student applies to a drive.
   * Atomically checks drive existence, student profile, eligibility, creates application,
   * and triggers an in-app confirmation notification inside the same transaction.
   * Catches P2002 to safely handle concurrent duplicate submissions.
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

        // d. Reject if ineligible with all failed reasons
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

        // Trigger notification: application submitted
        const message = `Your application to ${drive.companyName} (${drive.role}) was submitted.`;
        await this.notificationsService.createFor(
          userId,
          NotificationType.APPLICATION_SUBMITTED,
          message,
          drive.id,
          tx,
        );

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
   * Retrieve logged-in student's applications, newest first.
   * Masks SELECTED and REJECTED statuses as "UNDER_REVIEW" if the drive is not yet COMPLETED.
   * If filtered by SELECTED or REJECTED, only returns records from COMPLETED drives to prevent leakage.
   */
  async getMyApplications(userId: number, query: QueryApplicationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      studentId: userId,
    };

    if (query.status) {
      if (query.status === ApplicationStatus.SELECTED || query.status === ApplicationStatus.REJECTED) {
        // Prevent leaking unpublished results by requiring drive to be COMPLETED
        where.status = query.status;
        where.drive = {
          status: DriveStatus.COMPLETED,
        };
      } else {
        where.status = query.status;
      }
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

    // Mask uncompleted drive results as UNDER_REVIEW for student privacy
    const data = applications.map((app) => {
      const isDriveCompleted = app.drive.status === DriveStatus.COMPLETED;
      const isFinalStatus =
        app.status === ApplicationStatus.SELECTED || app.status === ApplicationStatus.REJECTED;
      const displayStatus = !isDriveCompleted && isFinalStatus ? 'UNDER_REVIEW' : app.status;

      return {
        ...app,
        status: displayStatus,
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
   * Retrieve a single application by ID for the logged-in student.
   * Masks uncompleted drive final results as UNDER_REVIEW.
   * Returns 404 if not found or belongs to another student.
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

    const isDriveCompleted = application.drive.status === DriveStatus.COMPLETED;
    const isFinalStatus =
      application.status === ApplicationStatus.SELECTED ||
      application.status === ApplicationStatus.REJECTED;
    const displayStatus = !isDriveCompleted && isFinalStatus ? 'UNDER_REVIEW' : application.status;

    return {
      ...application,
      status: displayStatus,
    };
  }

  /**
   * Withdraw an application.
   * Permitted only if status is APPLIED, drive is OPEN, and deadline is in the future.
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

  // =========================================================================
  // PLACEMENT CELL WORKFLOWS
  // =========================================================================

  /**
   * Retrieve applications for a specific drive with filtering and sorting.
   * Excludes password data by selecting strictly necessary student fields.
   */
  async getDriveApplications(driveId: number, query: QueryDriveApplicationsDto) {
    const drive = await this.prisma.drive.findUnique({
      where: { id: driveId },
    });

    if (!drive) {
      throw new NotFoundException('Drive not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      driveId,
    };

    if (query.status) {
      where.status = query.status;
    }

    const studentConditions: Prisma.UserWhereInput = {};

    if (query.branch) {
      studentConditions.studentProfile = {
        branch: query.branch,
      };
    }

    if (query.minCgpa !== undefined) {
      studentConditions.studentProfile = {
        ...((studentConditions.studentProfile as Prisma.StudentProfileWhereInput) || {}),
        cgpa: { gte: query.minCgpa },
      };
    }

    if (Object.keys(studentConditions).length > 0) {
      where.student = studentConditions;
    }

    if (query.search) {
      where.OR = [
        { student: { name: { contains: query.search, mode: 'insensitive' } } },
        { student: { email: { contains: query.search, mode: 'insensitive' } } },
        { student: { studentProfile: { rollNo: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const order = query.order ?? 'desc';
    const orderBy: Prisma.ApplicationOrderByWithRelationInput =
      query.sortBy === 'cgpa'
        ? { student: { studentProfile: { cgpa: order } } }
        : { appliedAt: order };

    const [total, applications] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: {
                select: {
                  rollNo: true,
                  branch: true,
                  cgpa: true,
                  activeBacklogs: true,
                  graduationYear: true,
                  skills: true,
                  phone: true,
                  resumeUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const data = applications.map((app) => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      student: {
        id: app.student.id,
        name: app.student.name,
        email: app.student.email,
        profile: app.student.studentProfile,
      },
    }));

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
   * Group drive applications by status using Prisma groupBy.
   * Returns counts including 0 for empty statuses.
   */
  async getDriveApplicationsSummary(driveId: number) {
    const drive = await this.prisma.drive.findUnique({
      where: { id: driveId },
    });

    if (!drive) {
      throw new NotFoundException('Drive not found');
    }

    const groups = await this.prisma.application.groupBy({
      by: ['status'],
      where: { driveId },
      _count: { status: true },
    });

    const summary: Record<string, number> = {
      total: 0,
      APPLIED: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      SELECTED: 0,
      REJECTED: 0,
    };

    for (const group of groups) {
      summary[group.status] = group._count.status;
      summary.total += group._count.status;
    }

    return summary;
  }

  /**
   * Update a single application's status.
   * Enforces transition rules and prevents updates on completed drives.
   */
  async updateApplicationStatus(applicationId: number, dto: UpdateApplicationStatusDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        drive: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.drive.status === DriveStatus.COMPLETED) {
      throw new BadRequestException('Results are already published for this drive');
    }

    if (!canTransition(application.status, dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${application.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                rollNo: true,
                branch: true,
                cgpa: true,
                activeBacklogs: true,
                graduationYear: true,
                skills: true,
                phone: true,
                resumeUrl: true,
              },
            },
          },
        },
      },
    });

    // Notify student immediately for SHORTLISTED or INTERVIEW status updates
    if (dto.status === ApplicationStatus.SHORTLISTED) {
      await this.notificationsService.createFor(
        application.studentId,
        NotificationType.STATUS_UPDATE,
        `You have been shortlisted for ${application.drive.companyName}`,
        application.driveId,
      );
    } else if (dto.status === ApplicationStatus.INTERVIEW) {
      await this.notificationsService.createFor(
        application.studentId,
        NotificationType.STATUS_UPDATE,
        `Interview stage reached for ${application.drive.companyName}`,
        application.driveId,
      );
    }

    return {
      id: updated.id,
      status: updated.status,
      appliedAt: updated.appliedAt,
      student: {
        id: updated.student.id,
        name: updated.student.name,
        email: updated.student.email,
        profile: updated.student.studentProfile,
      },
    };
  }

  /**
   * Bulk update application statuses within an atomic transaction.
   * If any ID is missing, from another drive, or has an invalid transition, nothing changes.
   */
  async bulkUpdateApplicationsStatus(driveId: number, dto: BulkUpdateApplicationsStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const drive = await tx.drive.findUnique({
        where: { id: driveId },
      });

      if (!drive) {
        throw new NotFoundException('Drive not found');
      }

      if (drive.status === DriveStatus.COMPLETED) {
        throw new BadRequestException('Results are already published for this drive');
      }

      const applications = await tx.application.findMany({
        where: { id: { in: dto.applicationIds } },
      });

      const appMap = new Map(applications.map((app) => [app.id, app]));
      const failures: Array<{ applicationId: number; reason: string }> = [];

      for (const appId of dto.applicationIds) {
        const app = appMap.get(appId);
        if (!app) {
          failures.push({
            applicationId: appId,
            reason: 'Application does not exist',
          });
        } else if (app.driveId !== driveId) {
          failures.push({
            applicationId: appId,
            reason: `Application does not belong to drive ${driveId}`,
          });
        } else if (!canTransition(app.status, dto.status)) {
          failures.push({
            applicationId: appId,
            reason: `Cannot change status from ${app.status} to ${dto.status}`,
          });
        }
      }

      if (failures.length > 0) {
        throw new BadRequestException({
          message: 'Bulk status update failed',
          failures,
        });
      }

      const updateResult = await tx.application.updateMany({
        where: { id: { in: dto.applicationIds } },
        data: { status: dto.status },
      });

      // Trigger notifications if status is SHORTLISTED or INTERVIEW inside the transaction
      if (
        dto.status === ApplicationStatus.SHORTLISTED ||
        dto.status === ApplicationStatus.INTERVIEW
      ) {
        const studentUserIds = applications.map((a) => a.studentId);
        const message =
          dto.status === ApplicationStatus.SHORTLISTED
            ? `You have been shortlisted for ${drive.companyName}`
            : `Interview stage reached for ${drive.companyName}`;

        await this.notificationsService.createManyFor(
          studentUserIds,
          NotificationType.STATUS_UPDATE,
          message,
          driveId,
          tx,
        );
      }

      return { updated: updateResult.count };
    });
  }

  /**
   * Publish results for a drive.
   * Marks drive COMPLETED and optionally auto-rejects pending applications in ONE transaction.
   */
  async publishResults(driveId: number, dto?: PublishResultsDto) {
    return this.prisma.$transaction(async (tx) => {
      const drive = await tx.drive.findUnique({
        where: { id: driveId },
      });

      if (!drive) {
        throw new NotFoundException('Drive not found');
      }

      if (drive.status === DriveStatus.COMPLETED) {
        throw new ConflictException('Results are already published');
      }

      // Check for pending (non-final) applications
      const pendingCount = await tx.application.count({
        where: {
          driveId,
          status: {
            notIn: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED],
          },
        },
      });

      if (pendingCount > 0) {
        if (!dto?.autoRejectPending) {
          throw new ConflictException({
            message: 'Some applications are still pending',
            pendingCount,
          });
        }

        // Auto-reject any remaining non-final applications
        await tx.application.updateMany({
          where: {
            driveId,
            status: {
              notIn: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED],
            },
          },
          data: {
            status: ApplicationStatus.REJECTED,
          },
        });
      }

      // Complete the drive
      await tx.drive.update({
        where: { id: driveId },
        data: {
          status: DriveStatus.COMPLETED,
        },
      });

      // Calculate final stats
      const [selectedCount, rejectedCount, totalCount] = await Promise.all([
        tx.application.count({ where: { driveId, status: ApplicationStatus.SELECTED } }),
        tx.application.count({ where: { driveId, status: ApplicationStatus.REJECTED } }),
        tx.application.count({ where: { driveId } }),
      ]);

      // Notify EVERY applicant of this drive with their outcome inside tx
      const allApplicants = await tx.application.findMany({
        where: { driveId },
        select: { studentId: true, status: true },
      });

      const selectedStudentIds = allApplicants
        .filter((app) => app.status === ApplicationStatus.SELECTED)
        .map((app) => app.studentId);

      const rejectedStudentIds = allApplicants
        .filter((app) => app.status === ApplicationStatus.REJECTED)
        .map((app) => app.studentId);

      if (selectedStudentIds.length > 0) {
        await this.notificationsService.createManyFor(
          selectedStudentIds,
          NotificationType.RESULT_PUBLISHED,
          `Congratulations! You have been selected by ${drive.companyName}.`,
          drive.id,
          tx,
        );
      }

      if (rejectedStudentIds.length > 0) {
        await this.notificationsService.createManyFor(
          rejectedStudentIds,
          NotificationType.RESULT_PUBLISHED,
          `Results for ${drive.companyName} are out. You were not selected this time.`,
          drive.id,
          tx,
        );
      }

      return {
        driveId,
        status: DriveStatus.COMPLETED,
        selected: selectedCount,
        rejected: rejectedCount,
        total: totalCount,
      };
    });
  }

  /**
   * Retrieve list of selected candidates for a completed drive.
   */
  async getDriveResults(driveId: number) {
    const drive = await this.prisma.drive.findUnique({
      where: { id: driveId },
      select: {
        id: true,
        companyName: true,
        role: true,
        status: true,
      },
    });

    if (!drive) {
      throw new NotFoundException('Drive not found');
    }

    if (drive.status !== DriveStatus.COMPLETED) {
      throw new BadRequestException('Results have not been published yet');
    }

    const selectedApplications = await this.prisma.application.findMany({
      where: {
        driveId,
        status: ApplicationStatus.SELECTED,
      },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                rollNo: true,
                branch: true,
                cgpa: true,
              },
            },
          },
        },
      },
    });

    const selected = selectedApplications.map((app) => ({
      student: {
        id: app.student.id,
        name: app.student.name,
        email: app.student.email,
        profile: app.student.studentProfile
          ? {
              rollNo: app.student.studentProfile.rollNo,
              branch: app.student.studentProfile.branch,
              cgpa: app.student.studentProfile.cgpa,
            }
          : null,
      },
    }));

    return {
      drive,
      selected,
    };
  }
}
