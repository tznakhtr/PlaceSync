import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';

/**
 * Global exception filter for PlaceSync.
 * - Standardizes error response structure across the entire application.
 * - In production, never leaks internal stack traces, SQL queries, or database schema details on 500 errors.
 * - Preserves friendly messages for Multer upload errors (such as 413 for oversized files).
 * - Logs server errors safely without recording sensitive user credentials (passwords, tokens).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Handle Multer file upload errors
    if (exception instanceof MulterError) {
      if (exception.code === 'LIMIT_FILE_SIZE') {
        return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message: 'Resume must be 2 MB or smaller',
          error: 'Payload Too Large',
        });
      }

      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'Bad Request',
      });
    }

    // 2. Handle standard NestJS HttpExceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();

      // If server error (5xx), log with stack trace
      if (status >= 500) {
        this.logger.error(
          `[${request.method}] ${request.url} - HTTP ${status}: ${exception.message}`,
          exception.stack,
        );
      }

      if (typeof errorResponse === 'object' && errorResponse !== null) {
        return response.status(status).json(errorResponse);
      }

      return response.status(status).json({
        statusCode: status,
        message: errorResponse,
      });
    }

    // 3. Handle unhandled / unexpected errors (500 Internal Server Error)
    const err = exception instanceof Error ? exception : new Error(String(exception));

    // Log internal error safely on the server
    this.logger.error(
      `[${request.method}] ${request.url} - Unhandled Exception: ${err.message}`,
      err.stack,
    );

    // Never leak stack traces, database schemas, or query details to clients
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
