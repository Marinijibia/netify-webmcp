import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'ServerError';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : res.message || message;
      error = res.error || exception.name;
      details = res.details || (typeof res === 'object' && res.errors ? res.errors : undefined);
    } else if (exception instanceof Error) {
      // For unhandled exceptions, sanitize response message to avoid leaking internals
      message = process.env.NODE_ENV === 'development' 
        ? exception.message 
        : 'An unexpected internal server error occurred.';
      error = exception.name;
    }

    this.logger.error(
      `[${request.method} ${request.url}] Status: ${status} Error: ${error} Message: ${exception instanceof Error ? exception.message : message}`,
      exception instanceof Error ? exception.stack : undefined
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.requestId,
    });
  }
}
