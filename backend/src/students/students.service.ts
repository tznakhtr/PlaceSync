import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ALLOWED_BRANCHES } from '../common/constants/branches';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

/**
 * StudentsService handles business logic for managing student profiles and resumes.
 * All operations are scoped strictly to the authenticated student's userId.
 */
@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Retrieve the authenticated student's profile.
   * Returns isComplete: false if no profile has been created yet.
   * Strips resumePublicId so internal Cloudinary identifiers are never exposed.
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

    const { resumePublicId, ...sanitizedProfile } = profile;

    return {
      profile: sanitizedProfile,
      isComplete: true,
    };
  }

  /**
   * Create or update the authenticated student's profile via upsert.
   * NEVER overwrites resumeUrl or resumePublicId.
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

      const { resumePublicId, ...sanitizedProfile } = profile;
      return sanitizedProfile;
    } catch (error) {
      // Prisma error code P2002 indicates a unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target;
        const isRollNoConflict =
          (Array.isArray(target) && target.includes('rollNo')) ||
          (typeof target === 'string' && target.includes('rollNo'));

        if (isRollNoConflict) {
          throw new ConflictException(
            `Roll number '${dto.rollNo}' is already registered to another student`,
          );
        }

        throw new ConflictException('A student profile with this roll number already exists');
      }

      throw error;
    }
  }

  /**
   * Upload student resume PDF to Cloudinary.
   * Validates file presence, PDF mimetype, magic bytes (%PDF), and profile existence.
   * Updates resumeUrl and resumePublicId in the database and cleans up old file from Cloudinary.
   */
  async uploadResume(userId: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    // Check file size limit (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new PayloadTooLargeException('Resume must be 2 MB or smaller');
    }

    // Validate MIME type and PDF magic bytes (%PDF at offset 0)
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfBytes =
      file.buffer &&
      file.buffer.length >= 4 &&
      file.buffer.subarray(0, 4).toString('utf-8') === '%PDF';

    if (!isPdfMime || !isPdfBytes) {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Ensure student has created their profile before uploading resume
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('Complete your profile before uploading a resume');
    }

    const oldPublicId = profile.resumePublicId;

    // Upload new resume PDF to Cloudinary
    const uploaded = await this.cloudinaryService.uploadPdf(file.buffer, userId);

    try {
      // Persist resume URL and publicId on student profile
      await this.prisma.studentProfile.update({
        where: { userId },
        data: {
          resumeUrl: uploaded.url,
          resumePublicId: uploaded.publicId,
        },
      });
    } catch (dbError) {
      // If saving to database fails, delete the newly uploaded file to avoid orphaned storage
      try {
        await this.cloudinaryService.deletePdf(uploaded.publicId);
      } catch (cleanupError) {
        // Silently catch cleanup error
      }
      throw dbError;
    }

    // If student had a previous resume, delete the old file from Cloudinary
    if (oldPublicId) {
      try {
        await this.cloudinaryService.deletePdf(oldPublicId);
      } catch (cleanupOldError) {
        // Silently catch cleanup error
      }
    }

    return { resumeUrl: uploaded.url };
  }

  /**
   * Delete student resume PDF from Cloudinary and reset database fields to null.
   */
  async deleteResume(userId: number) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile || (!profile.resumeUrl && !profile.resumePublicId)) {
      throw new NotFoundException('No resume uploaded');
    }

    if (profile.resumePublicId) {
      await this.cloudinaryService.deletePdf(profile.resumePublicId);
    }

    await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        resumeUrl: null,
        resumePublicId: null,
      },
    });

    return { message: 'Resume deleted successfully' };
  }

  /**
   * Return the list of allowed engineering branches for frontend dropdowns.
   */
  getBranches() {
    return ALLOWED_BRANCHES;
  }
}
