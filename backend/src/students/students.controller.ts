import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
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
 * Controller for student profile management.
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
