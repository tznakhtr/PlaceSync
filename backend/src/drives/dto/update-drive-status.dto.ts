import { IsIn } from 'class-validator';

/**
 * Data Transfer Object for updating drive status.
 * Acceptable values for status updates are OPEN and CLOSED.
 * COMPLETED is accepted past validation to return a domain-specific 400 error in DrivesService.
 */
export class UpdateDriveStatusDto {
  @IsIn(['OPEN', 'CLOSED', 'COMPLETED'], {
    message: 'Status must be one of: OPEN, CLOSED',
  })
  status: 'OPEN' | 'CLOSED' | 'COMPLETED';
}
