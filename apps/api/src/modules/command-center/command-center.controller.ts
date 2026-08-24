import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CommandCenterService } from './command-center.service';
import { CollectionPriorityService } from '../ai/collection-priority.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CurrentUser,
  AuthenticatedUserContext,
} from '../../common/decorators/current-user.decorator';
import {
  CommandCenterAttentionQuerySchema,
  CommandCenterPrioritiesQuerySchema,
  CommandCenterBriefingQuerySchema,
  CommandCenterAttentionQueryInput,
  CommandCenterPrioritiesQueryInput,
  CommandCenterBriefingQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('command-center')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CommandCenterController {
  constructor(
    private readonly commandCenterService: CommandCenterService,
    private readonly priorityService: CollectionPriorityService
  ) {}

  /**
   * GET /api/v1/command-center/attention
   * Returns deterministic daily attention signals, disaggregated facts, and inferences.
   */
  @Get('attention')
  @UsePipes(new ZodValidationPipe(CommandCenterAttentionQuerySchema))
  async getAttention(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query() query: CommandCenterAttentionQueryInput
  ) {
    const data = await this.commandCenterService.getAttentionOverview(
      user.organizationId,
      query.language,
      query.currency
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/command-center/priorities
   * Returns top prioritized customers queue with explainable reasons.
   */
  @Get('priorities')
  @UsePipes(new ZodValidationPipe(CommandCenterPrioritiesQuerySchema))
  async getPriorities(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query() query: CommandCenterPrioritiesQueryInput
  ) {
    const data = await this.priorityService.getPrioritizedCustomers(
      user.organizationId,
      {
        limit: query.limit,
        currency: query.currency,
      }
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/command-center/briefing
   * Returns data-grounded localized daily briefing.
   */
  @Get('briefing')
  @UsePipes(new ZodValidationPipe(CommandCenterBriefingQuerySchema))
  async getBriefing(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query() query: CommandCenterBriefingQueryInput
  ) {
    const overview = await this.commandCenterService.getAttentionOverview(
      user.organizationId,
      query.language,
      query.currency
    );
    return {
      success: true,
      data: {
        briefing: overview.executiveBriefing,
        facts: overview.facts,
        inferences: overview.inferences,
        calculatedAt: overview.calculatedAt,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
