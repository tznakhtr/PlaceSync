import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Reusable JWT Authentication Guard.
 * Apply with @UseGuards(JwtAuthGuard) to protect endpoints.
 * Requires a valid Bearer token in the Authorization header.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

