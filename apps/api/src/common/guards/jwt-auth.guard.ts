import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token: string | null = null;
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (request.query?.token && typeof request.query.token === 'string') {
      // Support SSE streams and query-based token authentication
      token = request.query.token;
    } else if (request.query?.access_token && typeof request.query.access_token === 'string') {
      token = request.query.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('Authorization token missing or invalid');
    }
    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'dev_jwt_secret_netify_change_in_production';
      const payload = await this.jwtService.verifyAsync(token, { secret });

      request.user = {
        userId: payload.sub || payload.userId,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
