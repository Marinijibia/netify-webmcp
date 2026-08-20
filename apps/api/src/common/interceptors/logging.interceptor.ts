import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    const orgId = request.user?.organizationId ? `[Org: ${request.user.organizationId}]` : '[No Org]';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} - ${duration}ms ${orgId} - ${ip} ${userAgent} (reqId: ${requestId})`
        );
      })
    );
  }
}
