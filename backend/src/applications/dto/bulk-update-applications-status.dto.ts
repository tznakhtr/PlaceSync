import { ApplicationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsInt } from 'class-validator';

/**
 * Data Transfer Object for bulk updating statuses of multiple applications.
 */
export class BulkUpdateApplicationsStatusDto {
  @IsArray({ message: 'applicationIds must be an array of numbers' })
  @ArrayMinSize(1, { message: 'applicationIds must contain at least 1 id' })
  @ArrayMaxSize(200, { message: 'applicationIds cannot exceed 200 ids' })
  @ArrayUnique({ message: 'applicationIds must not contain duplicate ids' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Each applicationId must be an integer' })
  applicationIds: number[];

  @IsEnum(ApplicationStatus, {
    message: 'Status must be one of: APPLIED, SHORTLISTED, INTERVIEW, SELECTED, REJECTED',
  })
  status: ApplicationStatus;
}
