import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('current')
  async getCurrent(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.orgService.getOrganizationById(user.organizationId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('members')
  async getMembers(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.orgService.getMembers(user.organizationId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('settings')
  async updateSettings(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: { settings: Record<string, any> }
  ) {
    const data = await this.orgService.updateSettings(user.organizationId, body.settings);
    return {
      success: true,
      data,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
