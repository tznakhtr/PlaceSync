import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface RequestWithUser extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Public endpoint to register a new student account.
   * POST /auth/register
   * Rate limited to 10 requests per minute by named "auth" throttler (IP + lowercased email).
   */
  @Post('register')
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Public endpoint to log in and receive a JWT access token.
   * POST /auth/login
   * Rate limited to 10 requests per minute by named "auth" throttler (IP + lowercased email).
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Protected endpoint to get the currently authenticated user's profile.
   * GET /auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: RequestWithUser) {
    // req.user is populated by JwtStrategy after validating the Bearer token
    return this.authService.getMe(req.user.id);
  }
}
