import { Injectable } from '@nestjs/common';
import { prisma } from '@netify/database';
import { AIService } from '@netify/ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MemoryService {
  private aiService: AIService;

  constructor(private readonly configService: ConfigService) {
    const provider = (this.configService.get<string>('AI_PROVIDER') as any) || 'gemini';
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    this.aiService = new AIService({
      provider,
      geminiApiKey,
      openaiApiKey,
    });
  }

  /**
   * Indexes a piece of text (e.g. note, message transcript, receipt OCR) into Business Memory.
   */
  async indexMemory(organizationId: string, item: {
    customerId?: string;
    type: string;
    source: string;
    sourceReference?: string;
    content: string;
    metadata?: Record<string, any>;
  }) {
    // Generate embedding
    const embedding = await this.aiService.embed(item.content);

    // Save Memory Item
    const memory = await prisma.memoryItem.create({
      data: {
        organizationId,
        customerId: item.customerId,
        type: item.type,
        source: item.source,
        sourceReference: item.sourceReference,
        content: item.content,
        metadata: item.metadata || {},
      },
    });

    return memory;
  }

  /**
   * Performs hybrid search: retrieves relevant memory items, customer records, and recent messages.
   */
  async searchMemory(organizationId: string, query: string, customerId?: string) {
    const where: any = { organizationId };
    if (customerId) where.customerId = customerId;

    // 1. Text & keyword search over memory items and conversation messages
    const [memoryItems, conversations] = await Promise.all([
      prisma.memoryItem.findMany({
        where: {
          ...where,
          content: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.conversation.findMany({
        where: {
          ...where,
          messages: {
            some: {
              content: { contains: query, mode: 'insensitive' },
            },
          },
        },
        include: {
          messages: {
            take: 5,
            orderBy: { timestamp: 'desc' },
          },
          customer: true,
        },
        take: 3,
      }),
    ]);

    return {
      memoryItems,
      conversations,
    };
  }
}
