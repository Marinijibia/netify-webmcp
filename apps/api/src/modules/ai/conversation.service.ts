import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { prisma } from '@netify/database';
import {
  AIConversationCreateInput,
  AISendMessageInput,
  AppLanguage,
} from '@netify/validation';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  /**
   * Lists conversations for the authenticated user and active organization.
   */
  async listConversations(organizationId: string, userId: string) {
    return prisma.aIConversation.findMany({
      where: {
        organizationId,
        userId,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
      take: 50,
    });
  }

  /**
   * Retrieves a specific conversation with message history and evidence.
   */
  async getConversation(organizationId: string, userId: string, conversationId: string) {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
        actionProposals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    if (conversation.organizationId !== organizationId) {
      this.logger.warn(
        `Cross-tenant conversation access blocked: user ${userId}, org ${organizationId}, target org ${conversation.organizationId}`
      );
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(`Access denied to conversation ${conversationId}`);
    }

    return conversation;
  }

  /**
   * Creates a new conversation thread.
   */
  async createConversation(
    organizationId: string,
    userId: string,
    dto: AIConversationCreateInput
  ) {
    const title = dto.title || 'New Copilot Conversation';
    const language = (dto.language?.toUpperCase() as any) || 'EN';

    return prisma.aIConversation.create({
      data: {
        organizationId,
        userId,
        title,
        language,
      },
    });
  }

  /**
   * Records a user or copilot message inside an existing conversation.
   */
  async addMessage(
    organizationId: string,
    userId: string,
    conversationId: string,
    data: {
      sender: 'USER' | 'COPILOT' | 'SYSTEM';
      content: string;
      language?: AppLanguage;
      intent?: string;
      evidenceMemoryIds?: string[];
      evidenceEventIds?: string[];
      evidenceCustomerIds?: string[];
      evidenceReceivableIds?: string[];
      metrics?: Record<string, any>;
    }
  ) {
    // Verify conversation access
    await this.getConversation(organizationId, userId, conversationId);

    const messageLanguage = (data.language?.toUpperCase() as any) || 'EN';

    const message = await prisma.aIMessage.create({
      data: {
        conversationId,
        organizationId,
        sender: data.sender,
        content: data.content,
        language: messageLanguage,
        intent: data.intent,
        evidenceMemoryIds: data.evidenceMemoryIds || [],
        evidenceEventIds: data.evidenceEventIds || [],
        evidenceCustomerIds: data.evidenceCustomerIds || [],
        evidenceReceivableIds: data.evidenceReceivableIds || [],
        metrics: data.metrics || {},
      },
    });

    // Touch conversation updatedAt
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Deletes a conversation thread.
   */
  async deleteConversation(organizationId: string, userId: string, conversationId: string) {
    await this.getConversation(organizationId, userId, conversationId);

    await prisma.aIConversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }
}
