import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { CollectionPriorityService } from './collection-priority.service';
import { CollectionAttentionService } from './collection-attention.service';
import { ConversationService } from './conversation.service';
import { ActionExecutionService } from './action-execution.service';
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
  AISendMessageSchema,
  AIActionConfirmSchema,
  UpdateLanguagePreferenceSchema,
  PriorityCustomerQueryInput,
  CustomerExplainInput,
  CustomerRecommendationInput,
  CustomerSummaryInput,
  DraftMessageInput,
  BusinessQAInput,
  UpdateRecommendationStatusInput,
  TodayAttentionQueryInput,
  AISendMessageInput,
  AIActionConfirmInput,
  UpdateLanguagePreferenceInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('ai')
@UseGuards(JwtAuthGuard, TenantGuard, FeatureGuard)
@RequireFeature(NetifyFeature.AI_COLLECTION_COPILOT)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly priorityService: CollectionPriorityService,
    private readonly attentionService: CollectionAttentionService,
    private readonly conversationService: ConversationService,
    private readonly actionService: ActionExecutionService
  ) {}

  /**
   * POST /api/v1/ai/chat
   * Main multilingual conversational intelligence endpoint.
   */
  @Post('chat')
  @UsePipes(new ZodValidationPipe(AISendMessageSchema))
  async chat(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: AISendMessageInput
  ) {
    const data = await this.aiService.chat(
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
   * GET /api/v1/ai/conversations
   * Lists historical conversation sessions for the active business.
   */
  @Get('conversations')
  async listConversations(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.conversationService.listConversations(
      user.organizationId,
      user.userId
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/ai/conversations/:id
   * Retrieves messages for a specific conversation.
   */
  @Get('conversations/:id')
  async getConversation(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') conversationId: string
  ) {
    const data = await this.conversationService.getConversation(
      user.organizationId,
      user.userId,
      conversationId
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/v1/ai/conversations/:id
   * Deletes a conversation.
   */
  @Delete('conversations/:id')
  async deleteConversation(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') conversationId: string
  ) {
    await this.conversationService.deleteConversation(
      user.organizationId,
      user.userId,
      conversationId
    );
    return {
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/ai/actions/:id/confirm
   * Confirms or declines a proposed action with explicit user approval.
   */
  @Post('actions/:id/confirm')
  @UsePipes(new ZodValidationPipe(AIActionConfirmSchema))
  async confirmAction(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') actionProposalId: string,
    @Body() body: AIActionConfirmInput
  ) {
    const data = await this.actionService.confirmAction(
      user.organizationId,
      user.userId,
      actionProposalId,
      body.confirm,
      body.notes
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/ai/actions
   * Lists action proposals for user review.
   */
  @Get('actions')
  async listActions(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.actionService.listProposals(
      user.organizationId,
      user.userId
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /api/v1/ai/language
   * Updates user's preferred language.
   */
  @Patch('language')
  @UsePipes(new ZodValidationPipe(UpdateLanguagePreferenceSchema))
  async updateLanguage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: UpdateLanguagePreferenceInput
  ) {
    const data = await this.aiService.updateUserLanguage(user.userId, body.language);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/ai/today
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
