import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { DrivesModule } from './drives/drives.module';
import { EligibilityModule } from './eligibility/eligibility.module';
import { NotificationsModule } from './notifications/notifications.module';
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
    // Eligibility evaluation module
    EligibilityModule,
    // Placement drives module
    DrivesModule,
    // Applications module
    ApplicationsModule,
    // In-app notifications module
    NotificationsModule,
  ],
  controllers: [AppController, TestAccessController],
  providers: [],
})
export class AppModule {}
