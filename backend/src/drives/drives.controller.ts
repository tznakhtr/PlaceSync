import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DrivesService } from './drives.service';
import { CreateDriveDto } from './dto/create-drive.dto';
import { QueryDrivesDto } from './dto/query-drives.dto';
import { UpdateDriveStatusDto } from './dto/update-drive-status.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';

interface RequestWithUser extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
}

/**
 * Controller for placement drives.
 * Protected by JwtAuthGuard and RolesGuard.
 * CELL-only routes enforce @Roles(Role.CELL).
 * Read routes are accessible by any authenticated user (STUDENT or CELL).
 */
@Controller('drives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrivesController {
  constructor(private readonly drivesService: DrivesService) {}

  /**
   * POST /drives
   * Create a new drive. Placement Cell (CELL) only.
   */
  @Post()
  @Roles(Role.CELL)
  async create(@Request() req: RequestWithUser, @Body() dto: CreateDriveDto) {
    return this.drivesService.create(req.user.id, dto);
  }

  /**
   * GET /drives
   * Paginated listing of placement drives with optional status and search filters.
   * Accessible by both STUDENT and CELL.
   * CELL users receive applicationsCount for each drive.
   */
  @Get()
  async findAll(@Request() req: RequestWithUser, @Query() query: QueryDrivesDto) {
    const isCell = req.user.role === Role.CELL;
    return this.drivesService.findAll(query, isCell);
  }

  /**
   * GET /drives/:id
   * Get single drive details by ID.
   * Accessible by both STUDENT and CELL.
   * CELL users receive applicationsCount.
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: RequestWithUser) {
    const isCell = req.user.role === Role.CELL;
    return this.drivesService.findOne(id, isCell);
  }

  /**
   * PUT /drives/:id
   * Update drive details. Placement Cell (CELL) only.
   * Cannot edit if status is COMPLETED.
   */
  @Put(':id')
  @Roles(Role.CELL)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDriveDto) {
    return this.drivesService.update(id, dto);
  }

  /**
   * PATCH /drives/:id/status
   * Update drive status (OPEN, CLOSED, COMPLETED). Placement Cell (CELL) only.
   */
  @Patch(':id/status')
  @Roles(Role.CELL)
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDriveStatusDto) {
    return this.drivesService.updateStatus(id, dto);
  }

  /**
   * DELETE /drives/:id
   * Delete a drive. Placement Cell (CELL) only.
   * Cannot delete if drive has existing applications.
   */
  @Delete(':id')
  @Roles(Role.CELL)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.drivesService.remove(id);
  }
}
