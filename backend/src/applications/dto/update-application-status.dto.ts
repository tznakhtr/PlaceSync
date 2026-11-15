import { ApplicationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

/**
 * Data Transfer Object for changing an application's status.
 */
export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus, {
    message: 'Status must be one of: APPLIED, SHORTLISTED, INTERVIEW, SELECTED, REJECTED',
  })
  status: ApplicationStatus;
}
