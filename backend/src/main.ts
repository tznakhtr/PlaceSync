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

  // Read frontend URL and port from environment (with default fallbacks)
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  const port = configService.get<number>('PORT') || 3000;

  // Enable CORS for FRONTEND_URL
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
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
