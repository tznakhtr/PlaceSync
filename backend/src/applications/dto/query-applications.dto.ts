import { ApplicationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Data Transfer Object for filtering and paginating a student's applications.
 */
export class QueryApplicationsDto {
  @IsOptional()
  @IsEnum(ApplicationStatus, {
    message: 'Status must be one of: APPLIED, SHORTLISTED, INTERVIEW, SELECTED, REJECTED',
  })
  status?: ApplicationStatus;

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
