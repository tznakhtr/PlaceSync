import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Simple health check endpoint.
   * Accessible at: GET /health
   * Returns: { status: "ok" }
   */
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}

