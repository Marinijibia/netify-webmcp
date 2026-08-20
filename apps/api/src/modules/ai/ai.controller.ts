import { Controller, Post, Body, UseGuards, UsePipes } from '@nestjs/common';
import { AIServiceWrapper } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  extractCommitmentInputSchema,
  draftMessageInputSchema,
  aiInvestigationInputSchema,
  ExtractCommitmentInput,
  DraftMessageInput,
  AIInvestigationInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('ai')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AIController {
  constructor(private readonly aiService: AIServiceWrapper) {}

  @Post('investigate')
  @UsePipes(new ZodValidationPipe(aiInvestigationInputSchema))
  async investigate(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: AIInvestigationInput
  ) {
    const data = await this.aiService.investigate(user.organizationId, body);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('extract-commitment')
  @UsePipes(new ZodValidationPipe(extractCommitmentInputSchema))
  async extractCommitment(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: ExtractCommitmentInput
  ) {
    const data = await this.aiService.extractCommitment(user.organizationId, body);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('draft-message')
  @UsePipes(new ZodValidationPipe(draftMessageInputSchema))
  async draftMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: DraftMessageInput
  ) {
    const data = await this.aiService.draftFollowupMessage(user.organizationId, body);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
