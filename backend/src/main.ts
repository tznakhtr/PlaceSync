import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security Headers: helmet globally enabled with default settings
  app.use(helmet());
  // Explicitly ensure X-Powered-By header is never sent
  app.disable('x-powered-by');

  // Explicit JSON and URL-encoded body size limits: 100kb (file uploads maintain 2MB limit in multer)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  const configService = app.get(ConfigService);

  // Validate that JWT_SECRET is defined; if missing, throw clear error and stop
  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing! Please configure it in your .env file.');
  }

  // Validate that Cloudinary config is defined; if missing, throw clear error and stop
  const cloudinaryCloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME');
  const cloudinaryApiKey = configService.get<string>('CLOUDINARY_API_KEY');
  const cloudinaryApiSecret = configService.get<string>('CLOUDINARY_API_SECRET');
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    throw new Error(
      'FATAL: Missing Cloudinary configuration (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Please configure them in your .env file.',
    );
  }

  // Production reverse proxy support (Render sits behind a proxy)
  const nodeEnv = configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  // Read frontend URL and port from environment (with default fallbacks)
  const rawFrontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  const port = configService.get<number>('PORT') || 3000;

  // Allowed origins parsed ONLY from FRONTEND_URL (comma-separated, trimmed, trailing slashes stripped)
  const allowedOrigins = rawFrontendUrl
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter((url) => url.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      // If request comes from an unallowed origin, do not set CORS headers (browser blocks it)
      return callback(null, false);
    },
    credentials: true, // Preserved from previous configuration (frontend uses Bearer tokens)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // Global exception filter: safe error responses without leaking stack traces or internal details
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global ValidationPipe: strips unwhitelisted properties, forbids unwhitelisted fields, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip values that do not have class-validator decorators
      forbidNonWhitelisted: true, // Reject requests containing unexpected/unrecognized fields
      transform: true, // Automatically transform request payloads to DTO instances
    }),
  );

  await app.listen(port);
  console.log(`[PlaceSync] Backend server is listening on port ${port}`);
  console.log(`[PlaceSync] CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`[PlaceSync] Health check available at: http://localhost:${port}/health`);
}

bootstrap();
