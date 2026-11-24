import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
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
      envFilePath: ['.env', '.env.example'],
    }),
    // Rate Limiting: Default 300 req/min per IP; named "auth" 10 req/min per IP + email
    // The default in-memory store is sufficient for a single instance deployment.
    ThrottlerModule.forRoot({
      errorMessage: 'Too many requests. Please try again in a minute.',
      throttlers: [
        {
          name: 'default',
          ttl: 60000, // 1 minute in milliseconds (v5+ API)
          limit: 300,
        },
        {
          name: 'auth',
          ttl: 60000, // 1 minute in milliseconds
          limit: 10,
          getTracker: (req: Record<string, any>) => {
            const ip = req.ip || req.socket?.remoteAddress || 'unknown';
            const email =
              typeof req.body?.email === 'string'
                ? req.body.email.trim().toLowerCase()
                : '';
            return email ? `${ip}-${email}` : ip;
          },
          skipIf: (context) => {
            const req = context.switchToHttp().getRequest();
            const path = req.path || req.url || '';
            const isAuthRoute =
              req.method === 'POST' &&
              (path.endsWith('/auth/login') ||
                path.endsWith('/auth/register') ||
                path.includes('/auth/login') ||
                path.includes('/auth/register'));
            return !isAuthRoute;
          },
        },
      ],
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
    // Cloudinary file upload module
    CloudinaryModule,
  ],
  controllers: [AppController, TestAccessController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
