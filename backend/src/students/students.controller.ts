import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Request,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import * as multer from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { MulterExceptionFilter } from '../common/filters/multer-exception.filter';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentsService } from './students.service';

interface RequestWithUser extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
}

/**
 * Controller for student profile and resume management.
 * Protected by JwtAuthGuard and RolesGuard.
 */
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * GET /students/me
   * Fetches the logged-in student's profile.
   * Only accessible by users with role STUDENT (CELL users get 403 Forbidden).
   */
  @Get('me')
  @Roles(Role.STUDENT)
  async getProfile(@Request() req: RequestWithUser) {
    return this.studentsService.getProfile(req.user.id);
  }

  /**
   * PUT /students/me
   * Creates or updates the logged-in student's profile.
   * Only accessible by users with role STUDENT (CELL users get 403 Forbidden).
   */
  @Put('me')
  @Roles(Role.STUDENT)
  async updateProfile(@Request() req: RequestWithUser, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.upsertProfile(req.user.id, dto);
  }

  /**
   * POST /students/me/resume
   * Uploads student resume PDF into Cloudinary using in-memory storage.
   * Strict 2 MB limit; rejects non-PDFs and uncompleted profiles.
   */
  @Post('me/resume')
  @Roles(Role.STUDENT)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB maximum
      },
    }),
  )
  async uploadResume(
    @Request() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.studentsService.uploadResume(req.user.id, file);
  }

  /**
   * DELETE /students/me/resume
   * Deletes student resume from Cloudinary and clears profile fields.
   */
  @Delete('me/resume')
  @Roles(Role.STUDENT)
  async deleteResume(@Request() req: RequestWithUser) {
    return this.studentsService.deleteResume(req.user.id);
  }

  /**
   * GET /students/branches
   * Returns the list of allowed engineering branches for frontend dropdowns.
   * Accessible by both STUDENT and CELL roles.
   */
  @Get('branches')
  @Roles(Role.STUDENT, Role.CELL)
  getBranches() {
    return this.studentsService.getBranches();
  }
}
