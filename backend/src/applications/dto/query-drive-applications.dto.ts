import { ApplicationStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ALLOWED_BRANCHES, Branch } from '../../common/constants/branches';

/**
 * Data Transfer Object for filtering, sorting, and paginating applications for a placement drive.
 */
export class QueryDriveApplicationsDto {
  @IsOptional()
  @IsEnum(ApplicationStatus, {
    message: 'Status must be one of: APPLIED, SHORTLISTED, INTERVIEW, SELECTED, REJECTED',
  })
  status?: ApplicationStatus;

  @IsOptional()
  @IsIn(ALLOWED_BRANCHES, {
    message: `Branch must be one of: ${ALLOWED_BRANCHES.join(', ')}`,
  })
  branch?: Branch;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minCgpa must be a number' })
  @Min(0, { message: 'minCgpa cannot be negative' })
  @Max(10, { message: 'minCgpa cannot exceed 10' })
  minCgpa?: number;

  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsIn(['cgpa', 'appliedAt'], { message: 'sortBy must be either cgpa or appliedAt' })
  sortBy?: 'cgpa' | 'appliedAt' = 'appliedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'order must be either asc or desc' })
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;
}
