import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ALLOWED_BRANCHES } from '../common/constants/branches';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

/**
 * StudentsService handles business logic for managing student profiles.
 * All operations are scoped strictly to the authenticated student's userId.
 */
@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve the authenticated student's profile.
   * Returns isComplete: false if no profile has been created yet.
   */
  async getProfile(userId: number) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return {
        profile: null,
        isComplete: false,
      };
    }

    return {
      profile,
      isComplete: true,
    };
  }

  /**
   * Create or update the authenticated student's profile via upsert.
   * Catches unique constraint violations (P2002) if another student already uses the roll number.
   */
  async upsertProfile(userId: number, dto: UpdateStudentProfileDto) {
    try {
      const profile = await this.prisma.studentProfile.upsert({
        where: { userId },
        update: {
          rollNo: dto.rollNo,
          branch: dto.branch,
          cgpa: dto.cgpa,
          activeBacklogs: dto.activeBacklogs,
          graduationYear: dto.graduationYear,
          skills: dto.skills,
          phone: dto.phone,
        },
        create: {
          userId,
          rollNo: dto.rollNo,
          branch: dto.branch,
          cgpa: dto.cgpa,
          activeBacklogs: dto.activeBacklogs,
          graduationYear: dto.graduationYear,
          skills: dto.skills,
          phone: dto.phone,
        },
      });

      return profile;
    } catch (error) {
      // Prisma error code P2002 indicates a unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target;
        const isRollNoConflict =
          (Array.isArray(target) && target.includes('rollNo')) ||
          (typeof target === 'string' && target.includes('rollNo'));

        if (isRollNoConflict) {
          throw new ConflictException(`Roll number '${dto.rollNo}' is already registered to another student`);
        }

        throw new ConflictException('A student profile with this roll number already exists');
      }

      throw error;
    }
  }

  /**
   * Return the list of allowed engineering branches for frontend dropdowns.
   */
  getBranches() {
    return ALLOWED_BRANCHES;
  }
}
