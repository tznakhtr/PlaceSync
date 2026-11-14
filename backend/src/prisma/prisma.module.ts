import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global PrismaModule exposes PrismaService to the entire application.
 * Being @Global(), other feature modules can inject PrismaService directly
 * without having to import PrismaModule in every feature module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

