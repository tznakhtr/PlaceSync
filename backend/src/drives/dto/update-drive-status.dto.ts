import { DriveStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

/**
 * Data Transfer Object for updating drive status.
 */
export class UpdateDriveStatusDto {
  @IsEnum(DriveStatus, {
    message: 'Status must be one of: OPEN, CLOSED, COMPLETED',
  })
  status: DriveStatus;
}
