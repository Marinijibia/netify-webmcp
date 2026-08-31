import { Controller, Get } from '@nestjs/common';
import { prisma } from '@netify/database';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  private redisClient: Redis | null = null;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');
    try {
      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
      } else {
        this.redisClient = new Redis({ host, port, password: password || undefined, lazyConnect: true, maxRetriesPerRequest: 1 });
      }
    } catch {
      this.redisClient = null;
    }
  }

  @Get()
  async check() {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    let redisStatus = 'disconnected';
    if (this.redisClient) {
      try {
        await this.redisClient.connect();
        const ping = await this.redisClient.ping();
        redisStatus = ping === 'PONG' ? 'connected' : 'degraded';
      } catch {
        redisStatus = 'mock_ready';
      }
    }

    const aiProvider = this.configService.get<string>('AI_PROVIDER') || 'gemini';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Netify API',
      version: '1.0.0',
      database: dbStatus,
      redis: redisStatus,
      aiProvider,
    };
  }
}
