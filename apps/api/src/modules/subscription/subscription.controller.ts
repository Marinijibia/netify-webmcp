import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

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
  async revenueCatWebhook(@Body() payload: any) {
    // Process RevenueCat webhook events in background
    return { received: true };
  }
}
