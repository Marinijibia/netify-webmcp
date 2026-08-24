import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { prisma } from '@netify/database';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

jest.mock('@netify/database', () => ({
  prisma: {
    aIConversation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    aIMessage: {
      create: jest.fn(),
    },
  },
}));

describe('ConversationService (Domain 09)', () => {
  let service: ConversationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationService],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    jest.clearAllMocks();
  });

  describe('tenant isolation', () => {
    it('should block access to conversations from other organizations', async () => {
      (prisma.aIConversation.findUnique as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        organizationId: 'org-OTHER',
        userId: 'user-1',
        messages: [],
        actionProposals: [],
      });

      await expect(
        service.getConversation('org-MY-ORG', 'user-1', 'conv-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should block access if the conversation belongs to another user in the same org', async () => {
      (prisma.aIConversation.findUnique as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        organizationId: 'org-MY-ORG',
        userId: 'user-OTHER',
        messages: [],
        actionProposals: [],
      });

      await expect(
        service.getConversation('org-MY-ORG', 'user-1', 'conv-1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return conversation when organization and user match', async () => {
      const mockConv = {
        id: 'conv-1',
        organizationId: 'org-MY-ORG',
        userId: 'user-1',
        title: 'Collection follow up',
        language: 'HA',
        messages: [],
        actionProposals: [],
      };
      (prisma.aIConversation.findUnique as jest.Mock).mockResolvedValue(mockConv);

      const res = await service.getConversation('org-MY-ORG', 'user-1', 'conv-1');
      expect(res).toEqual(mockConv);
    });
  });
});
