import { CreateDriveDto } from './create-drive.dto';

/**
 * Data Transfer Object for updating an existing drive.
 * Reuses identical validation rules as CreateDriveDto.
 */
export class UpdateDriveDto extends CreateDriveDto {}
