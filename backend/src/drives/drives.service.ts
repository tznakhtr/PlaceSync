import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriveStatus, Prisma } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new placement drive.
   * New drives always start with status OPEN.
   * createdById is set strictly from the authenticated CELL user.
   */
  async create(userId: number, dto: CreateDriveDto) {
    return this.prisma.drive.create({
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
  }

  /**
   * Retrieve a paginated list of drives sorted by deadline ascending (soonest first).
   * Supports optional status filtering and case-insensitive search across companyName and role.
   * CELL users receive applicationsCount for each drive.
   */
  async findAll(query: QueryDrivesDto, isCell: boolean) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DriveWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

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

    const totalPages = Math.ceil(total / limit) || 1;

    // For CELL users, format _count to applicationsCount; for STUDENT users, omit application counts
    const data = drives.map((drive) => {
      if (isCell) {
        const { _count, ...rest } = drive as typeof drive & { _count?: { applications: number } };
        return {
          ...rest,
          applicationsCount: _count?.applications ?? 0,
        };
      }
      return drive;
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
   * CELL users receive applicationsCount.
   */
  async findOne(id: number, isCell: boolean) {
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

    return drive;
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
