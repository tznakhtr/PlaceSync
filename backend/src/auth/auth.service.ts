import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * AuthService handles business logic for authentication:
 * student registration, credential validation, JWT token issuance, and user retrieval.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new student.
   * - Checks for existing email conflicts (409 Conflict).
   * - Hashes the password using bcrypt with 10 salt rounds.
   * - Hardcodes the STUDENT role.
   * - Returns user data without passwordHash.
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash the password using bcrypt (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the student user record
    const newUser = await this.usersService.createStudent({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
  }

  /**
   * Authenticate a user by email and password.
   * Returns identical generic 401 message on wrong email or password for security.
   * On success, returns an access token and sanitized user details.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      // Do not reveal that email was not found
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare provided password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Do not reveal that password was incorrect
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT payload with subject (user.id) and role
    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Retrieve the authenticated user's profile fresh from the database.
   * If the user was removed or deactivated, throws 401 Unauthorized.
   */
  async getMe(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

