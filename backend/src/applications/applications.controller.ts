import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { BulkUpdateApplicationsStatusDto } from './dto/bulk-update-applications-status.dto';
import { PublishResultsDto } from './dto/publish-results.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { QueryDriveApplicationsDto } from './dto/query-drive-applications.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

interface RequestWithUser extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
}

/**
 * Controller for application workflows.
 * Protected by JwtAuthGuard and RolesGuard.
 * Endpoints are explicitly restricted to either STUDENT or CELL roles.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // =========================================================================
  // STUDENT ENDPOINTS (@Roles(Role.STUDENT))
  // =========================================================================

  /**
   * POST /drives/:id/apply
   * Submit an application to a placement drive.
   */
  @Post('drives/:id/apply')
  @Roles(Role.STUDENT)
  async apply(
    @Param('id', ParseIntPipe) driveId: number,
    @Request() req: RequestWithUser,
  ) {
    return this.applicationsService.apply(req.user.id, driveId);
  }

  /**
   * GET /applications/me
   * Retrieve all applications submitted by the logged-in student.
   * Defined before :id to prevent path shadowing.
   */
  @Get('applications/me')
  @Roles(Role.STUDENT)
  async getMyApplications(
    @Request() req: RequestWithUser,
    @Query() query: QueryApplicationsDto,
  ) {
    return this.applicationsService.getMyApplications(req.user.id, query);
  }

  /**
   * GET /applications/:id
   * Retrieve a specific application by ID for the logged-in student.
   */
  @Get('applications/:id')
  @Roles(Role.STUDENT)
  async getApplicationById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.applicationsService.getApplicationById(req.user.id, id);
  }

  /**
   * DELETE /applications/:id
   * Withdraw an application before deadline while still in APPLIED status.
   */
  @Delete('applications/:id')
  @Roles(Role.STUDENT)
  async withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.applicationsService.withdraw(req.user.id, id);
  }

  // =========================================================================
  // PLACEMENT CELL ENDPOINTS (@Roles(Role.CELL))
  // =========================================================================

  /**
   * GET /drives/:id/applications/summary
   * Returns application counts per status for the drive using groupBy.
   */
  @Get('drives/:id/applications/summary')
  @Roles(Role.CELL)
  async getDriveApplicationsSummary(@Param('id', ParseIntPipe) driveId: number) {
    return this.applicationsService.getDriveApplicationsSummary(driveId);
  }

  /**
   * GET /drives/:id/applications
   * Filtered, sorted, and paginated list of applicants for a drive.
   */
  @Get('drives/:id/applications')
  @Roles(Role.CELL)
  async getDriveApplications(
    @Param('id', ParseIntPipe) driveId: number,
    @Query() query: QueryDriveApplicationsDto,
  ) {
    return this.applicationsService.getDriveApplications(driveId, query);
  }

  /**
   * PATCH /applications/:id/status
   * Update the status of an individual application.
   */
  @Patch('applications/:id/status')
  @Roles(Role.CELL)
  async updateApplicationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateApplicationStatus(id, dto);
  }

  /**
   * PATCH /drives/:id/applications/status
   * Bulk update status for multiple applications in an atomic transaction.
   */
  @Patch('drives/:id/applications/status')
  @Roles(Role.CELL)
  async bulkUpdateApplicationsStatus(
    @Param('id', ParseIntPipe) driveId: number,
    @Body() dto: BulkUpdateApplicationsStatusDto,
  ) {
    return this.applicationsService.bulkUpdateApplicationsStatus(driveId, dto);
  }

  /**
   * POST /drives/:id/publish-results
   * Mark drive as COMPLETED and optionally auto-reject pending applications.
   */
  @Post('drives/:id/publish-results')
  @Roles(Role.CELL)
  async publishResults(
    @Param('id', ParseIntPipe) driveId: number,
    @Body() dto: PublishResultsDto,
  ) {
    return this.applicationsService.publishResults(driveId, dto);
  }

  /**
   * GET /drives/:id/results
   * Retrieve the list of SELECTED students for a completed drive.
   */
  @Get('drives/:id/results')
  @Roles(Role.CELL)
  async getDriveResults(@Param('id', ParseIntPipe) driveId: number) {
    return this.applicationsService.getDriveResults(driveId);
  }
}
