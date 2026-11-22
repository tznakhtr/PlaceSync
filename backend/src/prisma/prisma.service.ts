import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService manages database connections using PrismaClient.
 * - Connects to the database automatically when the module initializes (startup).
 * - Disconnects cleanly when the module is destroyed (shutdown).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Establish connection to PostgreSQL database on startup
    await this.$connect();
  }

  async onModuleDestroy() {
    // Cleanly close database connections on application shutdown
    await this.$disconnect();
  }
}

