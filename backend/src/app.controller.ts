import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  /**
   * Simple health check endpoint.
   * Accessible at: GET /health
   * Exempt from rate limiting (@SkipThrottle) so external uptime monitors work without interruption.
   * Returns: { status: "ok" }
   */
  @Get('health')
  @SkipThrottle()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
