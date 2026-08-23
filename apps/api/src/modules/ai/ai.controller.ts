import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { CollectionPriorityService } from './collection-priority.service';
import { CollectionAttentionService } from './collection-attention.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import {
  CurrentUser,
  AuthenticatedUserContext,
} from '../../common/decorators/current-user.decorator';
import {
  NetifyFeature,
  PriorityCustomerQuerySchema,
  CustomerExplainInputSchema,
  CustomerRecommendationInputSchema,
  CustomerSummaryInputSchema,
  DraftMessageInputSchema,
  BusinessQAInputSchema,
  UpdateRecommendationStatusSchema,
  TodayAttentionQuerySchema,
  PriorityCustomerQueryInput,
  CustomerExplainInput,
  CustomerRecommendationInput,
  CustomerSummaryInput,
  DraftMessageInput,
  BusinessQAInput,
  UpdateRecommendationStatusInput,
  TodayAttentionQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('ai')
@UseGuards(JwtAuthGuard, TenantGuard, FeatureGuard)
@RequireFeature(NetifyFeature.AI_COLLECTION_COPILOT)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly priorityService: CollectionPriorityService,
    private readonly attentionService: CollectionAttentionService
  ) {}

  /**
   * GET /api/v1/ai/today
   * Returns deterministic today's attention metrics, briefing, and top priority customers.
   */
  @Get('today')
  @UsePipes(new ZodValidationPipe(TodayAttentionQuerySchema))
  async getTodayAttention(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query() query: TodayAttentionQueryInput
  ) {
    const data = await this.attentionService.getTodayAttention(
      user.organizationId,
      query
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/ai/priority-customers
   * Returns prioritized customer queue calculated deterministically with explainable reasons.
   */
  @Get('priority-customers')
  @UsePipes(new ZodValidationPipe(PriorityCustomerQuerySchema))
  async getPriorityCustomers(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query() query: PriorityCustomerQueryInput
  ) {
    const data = await this.priorityService.getPrioritizedCustomers(
      user.organizationId,
      query
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/ai/customers/:customerId/explain
   * Explains customer priority and debt background with evidence grounding.
   */
  @Post('customers/:customerId/explain')
  @UsePipes(new ZodValidationPipe(CustomerExplainInputSchema))
  async explainCustomer(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('customerId') customerId: string,
    @Body() body: CustomerExplainInput
  ) {
    const data = await this.aiService.explainCustomer(
      user.organizationId,
      user.userId,
      customerId,
      body
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/ai/customers/:customerId/recommend
   * Generates grounded collection recommendation and persists AIRecommendation record.
   */
  @Post('customers/:customerId/recommend')
  @UsePipes(new ZodValidationPipe(CustomerRecommendationInputSchema))
  async recommendAction(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('customerId') customerId: string,
    @Body() body: CustomerRecommendationInput
  ) {
    const data = await this.aiService.recommendAction(
      user.organizationId,
      user.userId,
      customerId,
      body
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/ai/customers/:customerId/draft-message
   * Drafts a culturally respectful collection message for user review.
   */
  @Post('customers/:customerId/draft-message')
  @UsePipes(new ZodValidationPipe(DraftMessageInputSchema))
  async draftMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('customerId') customerId: string,
    @Body() body: DraftMessageInput
  ) {
    const data = await this.aiService.draftMessage(
      user.organizationId,
      user.userId,
      customerId,
      body
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/ai/customers/:customerId/summary
   * Generates 360-degree customer overview.
   */
  @Post('customers/:customerId/summary')
  @UsePipes(new ZodValidationPipe(CustomerSummaryInputSchema))
  async summarizeCustomer(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('customerId') customerId: string,
    @Body() body: CustomerSummaryInput
  ) {
    const data = await this.aiService.summarizeCustomer(
      user.organizationId,
      user.userId,
      customerId,
      body
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/ai/qa
   * Answers natural language business queries grounded in database results.
   */
  @Post('qa')
  @UsePipes(new ZodValidationPipe(BusinessQAInputSchema))
  async askQA(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: BusinessQAInput
  ) {
    const data = await this.aiService.askQA(
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

  /**
   * PATCH /api/v1/ai/recommendations/:id/status
   * Updates recommendation lifecycle state (ACCEPTED / DISMISSED).
   */
  @Patch('recommendations/:id/status')
  @UsePipes(new ZodValidationPipe(UpdateRecommendationStatusSchema))
  async updateRecommendationStatus(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') recommendationId: string,
    @Body() body: UpdateRecommendationStatusInput
  ) {
    const data = await this.aiService.updateRecommendationStatus(
      user.organizationId,
      user.userId,
      recommendationId,
      body
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
