import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { EntitlementService } from './entitlement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import { PLAN_CONFIG, revenueCatWebhookEventSchema, RevenueCatWebhookPayload } from '@netify/validation';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly entitlementService: EntitlementService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Retrieves active plan, status, and feature limits for the current organization.
   */
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

  /**
   * Returns all available plans and their configured limits.
   */
  @Get('plans')
  async getPlans() {
    return {
      success: true,
      data: {
        plans: PLAN_CONFIG,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Syncs active mobile entitlements reported by RevenueCat with backend database.
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async syncMobileEntitlements(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: { entitlements: string[] }
  ) {
    const data = await this.subscriptionService.syncMobileEntitlements(
      user.userId,
      user.organizationId,
      body.entitlements || []
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Server-to-server webhook endpoint for RevenueCat events.
   */
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

    const validated = revenueCatWebhookEventSchema.safeParse(payload);
    if (!validated.success) {
      return {
        received: true,
        valid: false,
        message: 'Invalid payload structure ignored',
      };
    }

    const result = await this.subscriptionService.processWebhookEvent(validated.data);
    return result;
  }
}
