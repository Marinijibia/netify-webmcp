import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { RevenueCatWebhookPayload } from '@netify/validation';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Production server-to-server webhook endpoint for RevenueCat events.
   * Path: POST /webhooks/revenuecat
   */
  @Post('revenuecat')
  @HttpCode(HttpStatus.OK)
  async handleRevenueCatWebhook(
    @Body() payload: RevenueCatWebhookPayload,
    @Headers('authorization') authHeader?: string
  ) {
    const expectedSecret = this.configService.get<string>('REVENUECAT_WEBHOOK_SECRET');
    if (expectedSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
      if (token !== expectedSecret) {
        this.logger.warn('Rejected unauthorized RevenueCat webhook request.');
        throw new UnauthorizedException('Invalid webhook authorization token');
      }
    }

    const event = payload?.event;
    this.logger.log(
      `Received RevenueCat webhook: type=${event?.type}, id=${event?.id}, app_user_id=${event?.app_user_id}`
    );

    const result = await this.subscriptionService.processWebhookEvent(payload);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
