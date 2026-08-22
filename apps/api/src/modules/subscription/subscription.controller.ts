import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService
  ) {}

  @Get('current')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getCurrent(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.subscriptionService.getSubscription(user.organizationId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('webhook/revenuecat')
  async revenueCatWebhook(
    @Body() payload: any,
    @Headers('authorization') authHeader?: string
  ) {
    const expectedSecret = this.configService.get<string>('REVENUECAT_WEBHOOK_SECRET');
    if (expectedSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, '');
      if (token !== expectedSecret) {
        throw new UnauthorizedException('Invalid webhook authorization token');
      }
    }

    // Process RevenueCat webhook events in background
    return { received: true };
  }
}
