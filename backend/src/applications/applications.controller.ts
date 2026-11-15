import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ApplicationsService } from './applications.service';
import { QueryApplicationsDto } from './dto/query-applications.dto';

interface RequestWithUser extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
}

/**
 * Controller for student application workflows.
 * All routes are strictly protected by JwtAuthGuard and RolesGuard,
 * and restricted exclusively to users with the STUDENT role.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * POST /drives/:id/apply
   * Submit an application to a placement drive.
   * Student ID is inferred from the authenticated user token.
   */
  @Post('drives/:id/apply')
  async apply(
    @Param('id', ParseIntPipe) driveId: number,
    @Request() req: RequestWithUser,
  ) {
    return this.applicationsService.apply(req.user.id, driveId);
  }

  /**
   * GET /applications/me
   * Retrieve all applications submitted by the logged-in student.
   * Defined before :id to prevent route shadowing.
   */
  @Get('applications/me')
  async getMyApplications(
    @Request() req: RequestWithUser,
    @Query() query: QueryApplicationsDto,
  ) {
    return this.applicationsService.getMyApplications(req.user.id, query);
  }

  /**
   * GET /applications/:id
   * Retrieve a specific application by ID.
   * Returns 404 if not found or belongs to another student.
   */
  @Get('applications/:id')
  async getApplicationById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.applicationsService.getApplicationById(req.user.id, id);
  }

  /**
   * DELETE /applications/:id
   * Withdraw an application before drive deadline while still in APPLIED status.
   */
  @Delete('applications/:id')
  async withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.applicationsService.withdraw(req.user.id, id);
  }
}
