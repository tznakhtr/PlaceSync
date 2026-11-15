import { DriveStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Data Transfer Object for querying and paginating drives.
 */
export class QueryDrivesDto {
  @IsOptional()
  @IsEnum(DriveStatus, {
    message: 'Status must be one of: OPEN, CLOSED, COMPLETED',
  })
  status?: DriveStatus;

  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit cannot exceed 50' })
  limit?: number = 10;
}
