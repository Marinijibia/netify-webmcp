import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.notifService.list(user.organizationId, user.userId);
    return {
      success: true,
      data,
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
}
