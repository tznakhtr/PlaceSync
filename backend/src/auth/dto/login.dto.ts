import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for user login.
 */
export class LoginDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(72, { message: 'Password cannot exceed 72 characters' })
  password: string;
}
