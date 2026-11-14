import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Read frontend URL and port from environment (with default fallbacks)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const port = process.env.PORT || 3000;

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

