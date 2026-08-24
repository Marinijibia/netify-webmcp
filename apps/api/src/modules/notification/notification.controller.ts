import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { SignalDetectionService } from '../signal/signal-detection.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  notificationQuerySchema,
  NotificationQueryInput,
  registerPushTokenSchema,
  RegisterPushTokenInput,
} from '@netify/validation';

@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotificationController {
  constructor(
    private readonly notifService: NotificationService,
    private readonly pushService: PushNotificationService,
    private readonly signalService: SignalDetectionService
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(notificationQuerySchema))
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query() query: NotificationQueryInput
  ) {
    const data = await this.notifService.list(user.organizationId, user.userId, query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUserContext) {
    const count = await this.notifService.getUnreadCount(user.organizationId, user.userId);
    return {
      success: true,
      data: { unreadCount: count },
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.notifService.markAsRead(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.notifService.markAllAsRead(user.organizationId, user.userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('push-token')
  @UsePipes(new ZodValidationPipe(registerPushTokenSchema))
  async registerPushToken(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: RegisterPushTokenInput
  ) {
    const data = await this.pushService.registerToken(
      user.organizationId,
      user.userId,
      body.token,
      body.platform,
      body.deviceInfo
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('scan-signals')
  async scanSignals(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.signalService.scanOrganizationSignals(user.organizationId);
    return {
      success: true,
      data: { detectedCount: data.length, signals: data },
      timestamp: new Date().toISOString(),
    };
  }
}
