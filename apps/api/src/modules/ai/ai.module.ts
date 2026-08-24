import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { CollectionPriorityService } from './collection-priority.service';
import { CollectionAttentionService } from './collection-attention.service';
import { AIContextBuilder } from './ai-context-builder';
import { BusinessQAService } from './business-qa.service';
import { ConversationService } from './conversation.service';
import { ActionExecutionService } from './action-execution.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [ConfigModule, AuthModule, SubscriptionModule],
  controllers: [AIController],
  providers: [
    AIService,
    CollectionPriorityService,
    CollectionAttentionService,
    AIContextBuilder,
    BusinessQAService,
    ConversationService,
    ActionExecutionService,
  ],
  exports: [
    AIService,
    CollectionPriorityService,
    CollectionAttentionService,
    AIContextBuilder,
    BusinessQAService,
    ConversationService,
    ActionExecutionService,
  ],
})
export class AIModule {}
