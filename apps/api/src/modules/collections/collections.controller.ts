import { Controller, Get, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('collections')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.collectionsService.getCollectionSummary(user.organizationId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('priority-queue')
  async getPriorityQueue(@CurrentUser() user: AuthenticatedUserContext) {
    const summary = await this.collectionsService.getCollectionSummary(user.organizationId);
    return {
      success: true,
      data: summary.priorityQueue,
      meta: {
        totalOutstanding: summary.totalOutstanding,
        totalNeedsAttention: summary.totalNeedsAttention,
        commitmentsThisWeek: summary.commitmentsThisWeek,
        currency: summary.currency,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
