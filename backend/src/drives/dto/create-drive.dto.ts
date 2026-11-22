import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ALLOWED_BRANCHES, Branch } from '../../common/constants/branches';

/**
 * Custom validator constraint to ensure the deadline is in the future.
 */
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (typeof value !== 'string' && !(value instanceof Date)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.getTime() > Date.now();
  }

  defaultMessage() {
    return 'Deadline must be a valid ISO date in the future';
  }
}

/**
 * Data Transfer Object for creating a new placement drive.
 * Validates all required fields, trims text, and enforces domain rules.
 */
export class CreateDriveDto {
  @IsString({ message: 'Company name must be a string' })
  @IsNotEmpty({ message: 'Company name is required' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  companyName: string;

  @IsString({ message: 'Role must be a string' })
  @IsNotEmpty({ message: 'Role is required' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  role: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Package (LPA) must be a number' })
  @IsPositive({ message: 'Package (LPA) must be greater than 0' })
  packageLpa: number;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : typeof value === 'string' ? value.trim() : value,
  )
  location?: string;

  @IsArray({ message: 'Required skills must be an array of strings' })
  @ArrayMaxSize(30, { message: 'Required skills cannot exceed 30 items' })
  @IsString({ each: true, message: 'Each required skill must be a string' })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) return value;
    // Clean, lowercase, filter out empty strings, and deduplicate
    const cleaned = value
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    return Array.from(new Set(cleaned));
  })
  requiredSkills: string[];

  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum CGPA must be a number' })
  @Min(0, { message: 'Minimum CGPA cannot be negative' })
  @Max(10, { message: 'Minimum CGPA cannot exceed 10' })
  minCgpa: number;

  @IsArray({ message: 'Allowed branches must be an array of strings' })
  @ArrayMinSize(1, { message: 'At least one allowed branch is required' })
  @ArrayUnique({ message: 'Allowed branches must not contain duplicates' })
  @IsIn(ALLOWED_BRANCHES, {
    each: true,
    message: `Each allowed branch must be one of: ${ALLOWED_BRANCHES.join(', ')}`,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) return value;
    const cleaned = value
      .filter((b): b is string => typeof b === 'string')
      .map((b) => b.trim().toUpperCase());
    return Array.from(new Set(cleaned));
  })
  allowedBranches: Branch[];

  @Type(() => Number)
  @IsInt({ message: 'Maximum backlogs must be an integer' })
  @Min(0, { message: 'Maximum backlogs cannot be negative' })
  maxBacklogs: number;

  @Type(() => Number)
  @IsInt({ message: 'Graduation year must be an integer' })
  @Min(2024, { message: 'Graduation year must be at least 2024' })
  @Max(2035, { message: 'Graduation year cannot exceed 2035' })
  graduationYear: number;

  @IsDateString({}, { message: 'Deadline must be a valid ISO date string' })
  @Validate(IsFutureDateConstraint)
  deadline: string;
}
