import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Global configuration module to load environment variables from .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Global Prisma module for database access across all services
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

