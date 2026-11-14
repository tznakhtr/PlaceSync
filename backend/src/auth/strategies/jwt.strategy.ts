import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: number;
  role: string;
}

/**
 * Passport strategy to validate JWT Bearer tokens from incoming requests.
 * - Extracts token from the 'Authorization: Bearer <token>' header.
 * - Verifies cryptographic signature using JWT_SECRET.
 * - Loads fresh user state from the database on every protected request.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // Fail immediately on startup if JWT_SECRET is missing
    if (!jwtSecret) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in configuration!');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Automatically called by Passport after token verification.
   * Loads fresh user data from DB and ensures the user still exists.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Returned object is attached to req.user
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

