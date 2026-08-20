import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RiskService } from './risk.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('risk')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get('customer/:id')
  async getCustomerRisk(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') customerId: string
  ) {
    const data = await this.riskService.evaluateCustomerRisk(user.organizationId, customerId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
