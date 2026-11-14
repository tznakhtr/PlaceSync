import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Global configuration module to load environment variables from .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Global Prisma module for database access across all services
    PrismaModule,
    // Users module
    UsersModule,
    // Authentication module
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
