import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UsePipes,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
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
  bulkNotificationActionSchema,
  BulkNotificationActionInput,
  notificationPreferencesSchema,
  NotificationPreferencesInput,
} from '@netify/validation';

@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotificationController {
  constructor(
    private readonly notifService: NotificationService,
    private readonly pushService: PushNotificationService,
    private readonly signalService: SignalDetectionService
  ) {}

  /**
   * Real-time Server-Sent Events (SSE) notification stream for active organization.
   */
  @Sse('stream')
  stream(@CurrentUser() user: AuthenticatedUserContext): Observable<MessageEvent> {
    return this.notifService.getEventStream(user.organizationId);
  }

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

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.notifService.deleteNotification(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('bulk')
  @UsePipes(new ZodValidationPipe(bulkNotificationActionSchema))
  async bulkAction(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: BulkNotificationActionInput
  ) {
    const data = await this.notifService.bulkAction(user.organizationId, body);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.notifService.getPreferences(user.organizationId, user.userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('preferences')
  @UsePipes(new ZodValidationPipe(notificationPreferencesSchema))
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: NotificationPreferencesInput
  ) {
    const data = await this.notifService.updatePreferences(
      user.organizationId,
      user.userId,
      body
    );
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

