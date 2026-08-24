import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';
import { CollectionPriorityService } from './collection-priority.service';
import { CollectionAttentionService } from './collection-attention.service';
import { AIContextBuilder } from './ai-context-builder';
import { BusinessQAService } from './business-qa.service';
import { ConversationService } from './conversation.service';
import { ActionExecutionService } from './action-execution.service';
import {
  prisma,
  ReceivableStatus,
  CommitmentStatus,
  MemoryStatus,
  MemoryCategory,
  MemoryType,
  AICapability,
  AIRecommendationAction,
  AIRecommendationStatus,
  AIUrgencyLevel,
  AIConfidenceLevel,
} from '@netify/database';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

jest.mock('@netify/database', () => {
  const actualPrisma = jest.requireActual('@prisma/client');
  return {
    prisma: {
      customer: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      receivable: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
      },
      paymentCommitment: {
        findMany: jest.fn(),
      },
      collectionActivity: {
        findMany: jest.fn(),
      },
      businessEvent: {
        findMany: jest.fn(),
      },
      businessMemory: {
        findMany: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
      },
      aIRequest: {
        create: jest.fn(),
      },
      aIRecommendation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    },
    Prisma: {
      Decimal: actualPrisma.Prisma.Decimal,
    },
    ReceivableStatus: { OPEN: 'OPEN', PARTIALLY_PAID: 'PARTIALLY_PAID', PAID: 'PAID', OVERDUE: 'OVERDUE', CANCELLED: 'CANCELLED' },
    CommitmentStatus: { PENDING: 'PENDING', FULFILLED: 'FULFILLED', MISSED: 'MISSED', CANCELLED: 'CANCELLED' },
    MemoryStatus: { ACTIVE: 'ACTIVE', SUPERSEDED: 'SUPERSEDED' },
    MemoryCategory: { PAYMENT_BEHAVIOR: 'PAYMENT_BEHAVIOR', COMMITMENT_BEHAVIOR: 'COMMITMENT_BEHAVIOR' },
    MemoryType: {
      PAYMENT_COMMITMENT_MISSED_RATE: 'PAYMENT_COMMITMENT_MISSED_RATE',
      PAYMENT_TIMELINESS: 'PAYMENT_TIMELINESS',
    },
    AICapability: {
      COLLECTION_PRIORITIZATION: 'COLLECTION_PRIORITIZATION',
      CUSTOMER_EXPLANATION: 'CUSTOMER_EXPLANATION',
      COLLECTION_RECOMMENDATION: 'COLLECTION_RECOMMENDATION',
      CUSTOMER_SUMMARY: 'CUSTOMER_SUMMARY',
      COLLECTION_MESSAGE_DRAFT: 'COLLECTION_MESSAGE_DRAFT',
      BUSINESS_QA: 'BUSINESS_QA',
    },
    AIRequestStatus: { SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
    AIRecommendationAction: {
      FOLLOW_UP_NOW: 'FOLLOW_UP_NOW',
      FOLLOW_UP_LATER: 'FOLLOW_UP_LATER',
      REQUEST_PAYMENT_DATE: 'REQUEST_PAYMENT_DATE',
      REQUEST_PARTIAL_PAYMENT: 'REQUEST_PARTIAL_PAYMENT',
      REVIEW_COMMITMENT: 'REVIEW_COMMITMENT',
    },
    AIRecommendationStatus: { ACTIVE: 'ACTIVE', ACCEPTED: 'ACCEPTED', DISMISSED: 'DISMISSED', EXPIRED: 'EXPIRED' },
    AIUrgencyLevel: { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' },
    AIConfidenceLevel: { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' },
  };
});

describe('Domain 07: AI Intelligence + Collection Copilot Suite', () => {
  let aiService: AIService;
  let priorityService: CollectionPriorityService;
  let attentionService: CollectionAttentionService;
  let contextBuilder: AIContextBuilder;
  let qaService: BusinessQAService;

  const mockOrgId = 'org-test-07';
  const mockUserId = 'user-test-07';
  const mockCustomerId = 'cust-test-07';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        CollectionPriorityService,
        CollectionAttentionService,
        AIContextBuilder,
        BusinessQAService,
        ConversationService,
        ActionExecutionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test_openai_key';
              if (key === 'AI_MODEL_DEFAULT') return 'gpt-4o-mini';
              return null;
            }),
          },
        },
      ],
    }).compile();

    aiService = module.get<AIService>(AIService);
    priorityService = module.get<CollectionPriorityService>(CollectionPriorityService);
    attentionService = module.get<CollectionAttentionService>(CollectionAttentionService);
    contextBuilder = module.get<AIContextBuilder>(AIContextBuilder);
    qaService = module.get<BusinessQAService>(BusinessQAService);
  });

  describe('1. Deterministic Collection Priority Engine', () => {
    it('ranks overdue customers with missed commitments higher than current accounts', async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days overdue
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      (prisma.customer.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'cust-urgent',
          name: 'Alhaji Musa Trading',
          phone: '+2348011111111',
          currency: 'NGN',
          receivables: [
            {
              id: 'rec-1',
              originalAmount: '450000',
              currency: 'NGN',
              dueDate: pastDate,
              status: ReceivableStatus.OPEN,
              payments: [],
            },
          ],
          paymentCommitments: [
            {
              id: 'comm-1',
              promisedAmount: '450000',
              promisedFor: pastDate,
              status: CommitmentStatus.MISSED,
              createdAt: pastDate,
            },
          ],
          collectionActivities: [],
          businessMemories: [],
        },
        {
          id: 'cust-current',
          name: 'ABC Supplies',
          phone: '+2348022222222',
          currency: 'NGN',
          receivables: [
            {
              id: 'rec-2',
              originalAmount: '100000',
              currency: 'NGN',
              dueDate: futureDate,
              status: ReceivableStatus.OPEN,
              payments: [],
            },
          ],
          paymentCommitments: [],
          collectionActivities: [],
          businessMemories: [],
        },
      ]);

      const result = await priorityService.getPrioritizedCustomers(mockOrgId, { page: 1, limit: 10 });

      expect(result.items.length).toBe(2);
      expect(result.items[0].customerId).toBe('cust-urgent');
      expect(result.items[0].urgency).toBe('HIGH');
      expect(result.items[0].reasons).toContain('NGN 450,000 overdue');
      expect(result.items[0].reasons).toContain('Missed 1 payment commitment');

      expect(result.items[1].customerId).toBe('cust-current');
      expect(result.items[1].urgency).toBe('LOW');
    });

    it('excludes customers who have fully paid and have no pending promises', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'cust-paid',
          name: 'Paid Enterprise',
          currency: 'NGN',
          receivables: [
            {
              id: 'rec-paid',
              originalAmount: '50000',
              currency: 'NGN',
              dueDate: new Date(),
              status: ReceivableStatus.OPEN,
              payments: [{ amount: '50000', paidAt: new Date() }],
            },
          ],
          paymentCommitments: [],
          collectionActivities: [],
          businessMemories: [],
        },
      ]);

      const result = await priorityService.getPrioritizedCustomers(mockOrgId, { page: 1, limit: 10 });
      expect(result.items.length).toBe(0);
    });
  });

  describe('2. Today Attention & Daily Briefing', () => {
    it('computes exact deterministic totals for outstanding, overdue, and commitments due today', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValueOnce({
        currency: 'NGN',
        name: 'Test Org',
      });

      jest.spyOn(priorityService, 'getPrioritizedCustomers').mockResolvedValueOnce({
        items: [
          {
            customerId: 'cust-1',
            customerName: 'Alhaji Musa',
            currency: 'NGN',
            totalOutstanding: 450000,
            totalOverdue: 450000,
            oldestOverdueDays: 5,
            openReceivablesCount: 1,
            pendingCommitmentsCount: 1,
            missedCommitmentsCount: 1,
            priorityScore: 85,
            urgency: 'HIGH',
            reasons: ['NGN 450,000 overdue'],
          },
        ],
        totalCount: 1,
        highUrgencyCount: 1,
        mediumUrgencyCount: 0,
        lowUrgencyCount: 0,
      });

      (prisma.receivable.findMany as jest.Mock).mockResolvedValueOnce([
        {
          originalAmount: '450000',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          payments: [],
        },
      ]);

      (prisma.paymentCommitment.findMany as jest.Mock).mockResolvedValueOnce([
        {
          promisedAmount: '450000',
        },
      ]);

      const attention = await attentionService.getTodayAttention(mockOrgId);

      expect(attention.currency).toBe('NGN');
      expect(attention.totalOutstanding).toBe(450000);
      expect(attention.totalOverdue).toBe(450000);
      expect(attention.commitmentsDueCount).toBe(1);
      expect(attention.highPriorityCount).toBe(1);
      expect(attention.executiveBriefing).toContain('450,000');
    });
  });

  describe('3. AI Context Builder & Multi-Tenant Boundary Isolation', () => {
    it('throws NotFoundException when accessing a customer outside tenant boundary', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        contextBuilder.buildCustomerContext(mockOrgId, 'cross-tenant-cust-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('assembles verified financial truth, active memories, and recent events with XML injection tags', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValueOnce({
        id: mockCustomerId,
        name: 'Musa Trading',
        phone: '+2348011111111',
        currency: 'NGN',
        notes: 'Important customer',
        receivables: [
          {
            id: 'rec-1',
            originalAmount: '300000',
            currency: 'NGN',
            dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'OPEN',
            payments: [],
          },
        ],
        paymentCommitments: [],
        businessMemories: [
          {
            id: 'mem-1',
            category: 'PAYMENT_BEHAVIOR',
            type: 'PAYMENT_TIMELINESS',
            statement: 'Customer usually pays 3 days after commitment date.',
            value: { averageDelayDays: 3 },
            confidence: '1.0',
            timeWindow: 'LAST_90_DAYS',
          },
        ],
      });

      (prisma.businessEvent.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'evt-1',
          type: 'COLLECTION_ACTIVITY_RECORDED',
          occurredAt: new Date(),
          actorType: 'USER',
          data: { channel: 'WHATSAPP' },
          metadata: {},
        },
      ]);

      const pkg = await contextBuilder.buildCustomerContext(mockOrgId, mockCustomerId);

      expect(pkg.financial.totalOutstanding).toBe(300000);
      expect(pkg.financial.totalOverdue).toBe(300000);
      expect(pkg.validMemoryIds.has('mem-1')).toBe(true);
      expect(pkg.validEventIds.has('evt-1')).toBe(true);
      expect(pkg.formattedPromptContext).toContain('<untrusted_business_data');
      expect(pkg.formattedPromptContext).toContain('Musa Trading');
    });
  });

  describe('4. Grounding Verification & Hallucination Defense', () => {
    it('filters out hallucinated evidence IDs not present in authorized context', async () => {
      jest.spyOn(contextBuilder, 'buildCustomerContext').mockResolvedValueOnce({
        financial: {
          customerId: mockCustomerId,
          customerName: 'Musa Trading',
          currency: 'NGN',
          totalOutstanding: 450000,
          totalOverdue: 450000,
          openReceivables: [],
          recentCommitments: [],
          recentPayments: [],
        },
        businessMemories: [{ id: 'valid-mem-1', category: 'PAYMENT_BEHAVIOR', type: 'TIMELINESS', statement: 'Test', value: {}, confidence: 1, timeWindow: 'LAST_90_DAYS' }],
        businessEvents: [{ id: 'valid-evt-1', type: 'PAYMENT_CONFIRMED', occurredAt: '2026-08-20', actorType: 'USER', summary: 'Payment' }],
        validMemoryIds: new Set(['valid-mem-1']),
        validEventIds: new Set(['valid-evt-1']),
        formattedPromptContext: 'mock prompt context',
      });

      // Mock OpenAI structured output returning 1 valid and 1 fabricated evidence ID
      jest.spyOn((aiService as any).providerFactory.getProvider('openai'), 'structuredOutputWithMetrics').mockResolvedValueOnce({
        data: {
          summary: 'Customer has ₦450,000 overdue.',
          whyItMatters: 'Missed commitments.',
          recentHistory: 'No recent payments.',
          recommendation: 'Follow up on WhatsApp.',
          confidence: 'HIGH',
          evidenceMemoryIds: ['valid-mem-1', 'fake-hallucinated-mem-999'],
          evidenceEventIds: ['valid-evt-1', 'fake-hallucinated-evt-888'],
        },
        metrics: { model: 'gpt-4o-mini', latencyMs: 320, inputTokens: 500, outputTokens: 100 },
      });

      const explanation = await aiService.explainCustomer(mockOrgId, mockUserId, mockCustomerId, {});

      expect(explanation.evidenceMemoryIds).toEqual(['valid-mem-1']);
      expect(explanation.evidenceMemoryIds).not.toContain('fake-hallucinated-mem-999');
      expect(explanation.evidenceEventIds).toEqual(['valid-evt-1']);
      expect(explanation.evidenceEventIds).not.toContain('fake-hallucinated-evt-888');
    });
  });

  describe('5. Safe Intent-Driven Business Q&A (No Dynamic SQL)', () => {
    it('correctly classifies natural language intents into controlled query handlers', () => {
      expect(qaService.classifyIntent('Who owes us the most money?')).toBe('TOP_OUTSTANDING');
      expect(qaService.classifyIntent('Which customers are overdue on payments?')).toBe('OVERDUE_RECEIVABLES');
      expect(qaService.classifyIntent('How much did we collect this month?')).toBe('RECENT_PAYMENTS');
      expect(qaService.classifyIntent('Who missed a payment promise?')).toBe('MISSED_COMMITMENTS');
      expect(qaService.classifyIntent('Which customers did we follow up with on WhatsApp?')).toBe('COLLECTION_ACTIVITY');
    });

    it('executes safe parameterized queries and returns citations', async () => {
      jest.spyOn(priorityService, 'getPrioritizedCustomers').mockResolvedValueOnce({
        items: [
          {
            customerId: 'cust-1',
            customerName: 'Alhaji Musa',
            currency: 'NGN',
            totalOutstanding: 450000,
            totalOverdue: 450000,
            oldestOverdueDays: 5,
            openReceivablesCount: 1,
            pendingCommitmentsCount: 0,
            missedCommitmentsCount: 1,
            priorityScore: 80,
            urgency: 'HIGH',
            reasons: ['NGN 450,000 overdue'],
          },
        ],
        totalCount: 1,
        highUrgencyCount: 1,
        mediumUrgencyCount: 0,
        lowUrgencyCount: 0,
      });

      const queryResult = await qaService.executeDeterministicQuery(mockOrgId, {
        query: 'Who owes us the most?',
      });

      expect(queryResult.intent).toBe('TOP_OUTSTANDING');
      expect(queryResult.citations).toContain('Alhaji Musa');
    });
  });

  describe('6. Recommendation Lifecycle & Expiry', () => {
    it('creates active recommendation record and supports status updates (ACCEPTED/DISMISSED)', async () => {
      jest.spyOn(contextBuilder, 'buildCustomerContext').mockResolvedValueOnce({
        financial: {
          customerId: mockCustomerId,
          customerName: 'Musa Trading',
          currency: 'NGN',
          totalOutstanding: 450000,
          totalOverdue: 450000,
          openReceivables: [],
          recentCommitments: [],
          recentPayments: [],
        },
        businessMemories: [],
        businessEvents: [],
        validMemoryIds: new Set([]),
        validEventIds: new Set([]),
        formattedPromptContext: 'mock context',
      });

      jest.spyOn((aiService as any).providerFactory.getProvider('openai'), 'structuredOutputWithMetrics').mockResolvedValueOnce({
        data: {
          action: 'FOLLOW_UP_NOW',
          urgency: 'HIGH',
          title: 'Immediate WhatsApp Follow-up',
          reasoningSummary: '₦450,000 is 3 days overdue with missed promise.',
          suggestedChannel: 'WHATSAPP',
          suggestedMessage: 'Kindly confirm receipt and transfer status for ₦450,000.',
          confidence: 'HIGH',
          evidenceMemoryIds: [],
          evidenceEventIds: [],
        },
        metrics: { model: 'gpt-4o-mini', latencyMs: 250 },
      });

      (prisma.aIRecommendation.create as jest.Mock).mockResolvedValueOnce({
        id: 'rec-abc-123',
        status: 'ACTIVE',
      });

      const recommendation = await aiService.recommendAction(mockOrgId, mockUserId, mockCustomerId, {});

      expect(recommendation.action).toBe('FOLLOW_UP_NOW');
      expect(recommendation.urgency).toBe('HIGH');
      expect(recommendation.title).toBe('Immediate WhatsApp Follow-up');

      // Test status update
      (prisma.aIRecommendation.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'rec-abc-123',
        organizationId: mockOrgId,
      });
      (prisma.aIRecommendation.update as jest.Mock).mockResolvedValueOnce({
        id: 'rec-abc-123',
        status: 'ACCEPTED',
      });

      const updated = await aiService.updateRecommendationStatus(mockOrgId, mockUserId, 'rec-abc-123', {
        status: 'ACCEPTED',
      });

      expect(updated.status).toBe('ACCEPTED');
    });
  });

  describe('7. Failure Handling & Service Unavailability', () => {
    it('throws ServiceUnavailableException when OpenAI API key is unconfigured or request fails', async () => {
      jest.spyOn(contextBuilder, 'buildCustomerContext').mockResolvedValueOnce({
        financial: { customerId: mockCustomerId, customerName: 'Test', currency: 'NGN', totalOutstanding: 100, totalOverdue: 0, openReceivables: [], recentCommitments: [], recentPayments: [] },
        businessMemories: [],
        businessEvents: [],
        validMemoryIds: new Set([]),
        validEventIds: new Set([]),
        formattedPromptContext: 'mock',
      });

      jest.spyOn((aiService as any).providerFactory.getProvider('openai'), 'structuredOutputWithMetrics').mockRejectedValueOnce(
        new Error('API key invalid')
      );

      await expect(
        aiService.explainCustomer(mockOrgId, mockUserId, mockCustomerId, {})
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
