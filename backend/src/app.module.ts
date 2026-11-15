import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { TestAccessController } from './test-access/test-access.controller';
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
    // Students module
    StudentsModule,
  ],
  controllers: [AppController, TestAccessController],
  providers: [],
})
export class AppModule {}
