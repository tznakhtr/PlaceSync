import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validate that JWT_SECRET is defined; if missing, throw clear error and stop
  const configService = app.get(ConfigService);
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

  // Read frontend URL and port from environment (with default fallbacks)
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  const port = configService.get<number>('PORT') || 3000;

  // Enable CORS for FRONTEND_URL and local development origins
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global ValidationPipe: strips unwhitelisted properties from incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove values that do not have class-validator decorators
      transform: true, // Automatically transform request payloads to DTO instances
    }),
  );

  await app.listen(port);
  console.log(`[PlaceSync] Backend server is listening on port ${port}`);
  console.log(`[PlaceSync] CORS allowed origin: ${frontendUrl}`);
  console.log(`[PlaceSync] Health check available at: http://localhost:${port}/health`);
}

bootstrap();
