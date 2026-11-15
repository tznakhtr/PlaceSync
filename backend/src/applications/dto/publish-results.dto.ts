import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Data Transfer Object for publishing drive results.
 */
export class PublishResultsDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  @IsBoolean({ message: 'autoRejectPending must be a boolean' })
  autoRejectPending?: boolean = false;
}
