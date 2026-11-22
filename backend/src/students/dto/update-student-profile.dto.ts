import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ALLOWED_BRANCHES, Branch } from '../../common/constants/branches';

/**
 * Data Transfer Object for creating or updating a student's profile.
 * UserId is never accepted from the request body to prevent privilege escalation.
 */
export class UpdateStudentProfileDto {
  @IsString({ message: 'Roll number must be a string' })
  @IsNotEmpty({ message: 'Roll number is required' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  rollNo: string;

  @IsString({ message: 'Branch must be a string' })
  @IsIn(ALLOWED_BRANCHES, {
    message: `Branch must be one of: ${ALLOWED_BRANCHES.join(', ')}`,
  })
  branch: Branch;

  @Type(() => Number)
  @IsNumber({}, { message: 'CGPA must be a valid number' })
  @Min(0, { message: 'CGPA cannot be negative' })
  @Max(10, { message: 'CGPA cannot exceed 10' })
  cgpa: number;

  @Type(() => Number)
  @IsInt({ message: 'Active backlogs must be an integer' })
  @Min(0, { message: 'Active backlogs cannot be negative' })
  activeBacklogs: number;

  @Type(() => Number)
  @IsInt({ message: 'Graduation year must be an integer' })
  @Min(2024, { message: 'Graduation year must be at least 2024' })
  @Max(2035, { message: 'Graduation year cannot exceed 2035' })
  graduationYear: number;

  @IsArray({ message: 'Skills must be an array of strings' })
  @ArrayMaxSize(30, { message: 'Skills cannot exceed 30 items' })
  @IsString({ each: true, message: 'Each skill must be a string' })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) return value;
    // Trim, convert to lowercase, filter non-empty, and deduplicate
    const cleaned = value
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    return Array.from(new Set(cleaned));
  })
  skills: string[];

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^[0-9]{10}$/, { message: 'Phone must be a 10-digit number' })
  phone?: string;
}
