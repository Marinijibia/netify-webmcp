import { Test, TestingModule } from '@nestjs/testing';
import { BusinessMemoryService } from './business-memory.service';
import {
  prisma,
  Prisma,
  BusinessEventType,
  ActorType,
  EventSource,
  MemoryCategory,
  MemoryType,
  MemoryTimeWindow,
  MemoryStatus,
} from '@netify/database';
import { NotFoundException } from '@nestjs/common';
import {
  calculateCommitmentFulfillmentRate,
  calculateMissedCommitmentRate,
  calculatePaymentTimeliness,
  calculatePartialPaymentPattern,
  calculateCollectionResponsePattern,
  calculateReceivableOverduePattern,
  calculateCustomerActivityPattern,
} from './business-memory-calculator';

jest.mock('@netify/database', () => {
  const actualPrisma = jest.requireActual('@prisma/client');
  return {
    prisma: {
      $transaction: jest.fn((callback) => callback(prisma)),
      customer: {
        findFirst: jest.fn(),
      },
      businessEvent: {
        findMany: jest.fn(),
      },
      businessMemory: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      businessMemoryEvidence: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    },
    Prisma: {
      Decimal: actualPrisma.Prisma.Decimal,
    },
    BusinessEventType: {
      CUSTOMER_CREATED: 'CUSTOMER_CREATED',
      RECEIVABLE_CREATED: 'RECEIVABLE_CREATED',
      RECEIVABLE_OVERDUE: 'RECEIVABLE_OVERDUE',
      RECEIVABLE_PAID: 'RECEIVABLE_PAID',
      RECEIVABLE_PARTIALLY_PAID: 'RECEIVABLE_PARTIALLY_PAID',
      PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
      COLLECTION_ACTIVITY_RECORDED: 'COLLECTION_ACTIVITY_RECORDED',
      PAYMENT_COMMITMENT_CREATED: 'PAYMENT_COMMITMENT_CREATED',
      PAYMENT_COMMITMENT_FULFILLED: 'PAYMENT_COMMITMENT_FULFILLED',
      PAYMENT_COMMITMENT_PARTIALLY_FULFILLED: 'PAYMENT_COMMITMENT_PARTIALLY_FULFILLED',
      PAYMENT_COMMITMENT_MISSED: 'PAYMENT_COMMITMENT_MISSED',
      PAYMENT_COMMITMENT_CANCELLED: 'PAYMENT_COMMITMENT_CANCELLED',
    },
    ActorType: {
      USER: 'USER',
      SYSTEM: 'SYSTEM',
    },
    EventSource: {
      USER_ACTION: 'USER_ACTION',
      PAYMENT_PROCESS: 'PAYMENT_PROCESS',
      COLLECTION_ACTIVITY: 'COLLECTION_ACTIVITY',
      SYSTEM: 'SYSTEM',
    },
    MemoryCategory: {
      PAYMENT_BEHAVIOR: 'PAYMENT_BEHAVIOR',
      COLLECTION_BEHAVIOR: 'COLLECTION_BEHAVIOR',
      COMMITMENT_BEHAVIOR: 'COMMITMENT_BEHAVIOR',
      RECEIVABLE_HISTORY: 'RECEIVABLE_HISTORY',
      CUSTOMER_ACTIVITY: 'CUSTOMER_ACTIVITY',
    },
    MemoryType: {
      PAYMENT_FREQUENCY: 'PAYMENT_FREQUENCY',
      PAYMENT_TIMELINESS: 'PAYMENT_TIMELINESS',
      PAYMENT_COMMITMENT_FULFILLMENT_RATE: 'PAYMENT_COMMITMENT_FULFILLMENT_RATE',
      PAYMENT_COMMITMENT_MISSED_RATE: 'PAYMENT_COMMITMENT_MISSED_RATE',
      PARTIAL_PAYMENT_PATTERN: 'PARTIAL_PAYMENT_PATTERN',
      COLLECTION_RESPONSE_PATTERN: 'COLLECTION_RESPONSE_PATTERN',
      RECEIVABLE_OVERDUE_PATTERN: 'RECEIVABLE_OVERDUE_PATTERN',
      CUSTOMER_ACTIVITY_PATTERN: 'CUSTOMER_ACTIVITY_PATTERN',
    },
    MemoryTimeWindow: {
      LAST_30_DAYS: 'LAST_30_DAYS',
      LAST_90_DAYS: 'LAST_90_DAYS',
      LAST_180_DAYS: 'LAST_180_DAYS',
      ALL_TIME: 'ALL_TIME',
    },
    MemoryStatus: {
      ACTIVE: 'ACTIVE',
      SUPERSEDED: 'SUPERSEDED',
      INVALIDATED: 'INVALIDATED',
    },
  };
});

describe('BusinessMemory (Domain Design 06 Test Suite)', () => {
  let service: BusinessMemoryService;

  const mockOrgId = 'org-1111-2222';
  const mockCustomerId = 'cust-3333-4444';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessMemoryService],
    }).compile();

    service = module.get<BusinessMemoryService>(BusinessMemoryService);
  });

  describe('1. Deterministic Calculation Rules & Minimum Evidence Thresholds', () => {
    it('should return empty memory candidate if no events exist', () => {
      const results = calculateCommitmentFulfillmentRate([], MemoryTimeWindow.LAST_90_DAYS);
      expect(results).toHaveLength(0);
    });

    it('should return empty memory if below minimum evidence threshold (< 2 commitments)', () => {
      const singleEvent: any = {
        id: 'evt-1',
        type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
        occurredAt: new Date(),
        data: { currency: 'NGN' },
      };

      const results = calculateCommitmentFulfillmentRate([singleEvent], MemoryTimeWindow.LAST_90_DAYS);
      expect(results).toHaveLength(0);
    });

    it('should calculate 100% fulfillment rate when 2 of 2 commitments are fulfilled', () => {
      const now = new Date();
      const events: any[] = [
        {
          id: 'evt-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          data: { currency: 'NGN' },
        },
        {
          id: 'evt-2',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
          data: { currency: 'NGN' },
        },
      ];

      const results = calculateCommitmentFulfillmentRate(events, MemoryTimeWindow.LAST_90_DAYS, now);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(MemoryType.PAYMENT_COMMITMENT_FULFILLMENT_RATE);
      expect(results[0].value.rate).toBe(1.0);
      expect(results[0].value.fulfilled).toBe(2);
      expect(results[0].value.total).toBe(2);
      expect(results[0].statement).toContain('fulfilled 2 of 2 payment commitments in the last 90 days');
      expect(results[0].evidenceEventIds).toEqual(['evt-1', 'evt-2']);
    });

    it('should calculate 50% fulfillment rate and 50% missed rate when 1 fulfilled and 1 missed', () => {
      const now = new Date();
      const events: any[] = [
        {
          id: 'evt-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          data: { currency: 'NGN' },
        },
        {
          id: 'evt-2',
          type: BusinessEventType.PAYMENT_COMMITMENT_MISSED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
          data: { currency: 'NGN' },
        },
      ];

      const fulfillmentResults = calculateCommitmentFulfillmentRate(events, MemoryTimeWindow.LAST_90_DAYS, now);
      expect(fulfillmentResults).toHaveLength(1);
      expect(fulfillmentResults[0].value.rate).toBe(0.5);

      const missedResults = calculateMissedCommitmentRate(events, MemoryTimeWindow.LAST_90_DAYS, now);
      expect(missedResults).toHaveLength(1);
      expect(missedResults[0].value.rate).toBe(0.5);
      expect(missedResults[0].statement).toContain('missed 1 of 2 payment commitments');
    });

    it('should calculate payment timeliness delay accurately', () => {
      const now = new Date();
      const events: any[] = [
        {
          id: 'evt-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date('2026-08-13T10:00:00Z'),
          data: {
            promisedFor: '2026-08-10T00:00:00Z',
            paidAt: '2026-08-13T10:00:00Z', // 3 days late
          },
        },
        {
          id: 'evt-2',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date('2026-08-23T10:00:00Z'),
          data: {
            promisedFor: '2026-08-20T00:00:00Z',
            paidAt: '2026-08-23T10:00:00Z', // 3 days late
          },
        },
      ];

      const results = calculatePaymentTimeliness(events, MemoryTimeWindow.LAST_90_DAYS, now);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(MemoryType.PAYMENT_TIMELINESS);
      expect(results[0].value.averageDaysDifference).toBe(3);
      expect(results[0].statement).toContain('historically pays 3 days after the promised commitment date');
    });

    it('should separate multiple currencies into distinct aggregates without summing them', () => {
      const now = new Date();
      const events: any[] = [
        {
          id: 'evt-ngn-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          data: { currency: 'NGN' },
        },
        {
          id: 'evt-ngn-2',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
          data: { currency: 'NGN' },
        },
        {
          id: 'evt-usd-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          data: { currency: 'USD' },
        },
        {
          id: 'evt-usd-2',
          type: BusinessEventType.PAYMENT_COMMITMENT_MISSED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
          data: { currency: 'USD' },
        },
      ];

      const results = calculateCommitmentFulfillmentRate(events, MemoryTimeWindow.LAST_90_DAYS, now);
      expect(results).toHaveLength(2);

      const ngnMemory = results.find((r) => r.currency === 'NGN');
      const usdMemory = results.find((r) => r.currency === 'USD');

      expect(ngnMemory).toBeDefined();
      expect(ngnMemory?.value.rate).toBe(1.0);
      expect(usdMemory).toBeDefined();
      expect(usdMemory?.value.rate).toBe(0.5);
    });

    it('should respect time windows and exclude events older than the window', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120); // 120 days ago

      const events: any[] = [
        {
          id: 'evt-old-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: oldDate,
          data: { currency: 'NGN' },
        },
        {
          id: 'evt-recent-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          data: { currency: 'NGN' },
        },
      ];

      // In 90-day window: only 1 event, below threshold of 2
      const results90 = calculateCommitmentFulfillmentRate(events, MemoryTimeWindow.LAST_90_DAYS, now);
      expect(results90).toHaveLength(0);

      // In ALL_TIME window: 2 events, meets threshold
      const resultsAllTime = calculateCommitmentFulfillmentRate(events, MemoryTimeWindow.ALL_TIME, now);
      expect(resultsAllTime).toHaveLength(1);
    });
  });

  describe('2. Collection & Overdue Patterns', () => {
    it('should derive collection response pattern for WhatsApp interactions', () => {
      const now = new Date();
      const events: any[] = [
        {
          id: 'evt-act-1',
          type: BusinessEventType.COLLECTION_ACTIVITY_RECORDED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          data: { channel: 'WHATSAPP', outcome: 'CONTACTED' },
        },
        {
          id: 'evt-act-2',
          type: BusinessEventType.COLLECTION_ACTIVITY_RECORDED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
          data: { channel: 'WHATSAPP', outcome: 'PROMISED_PAYMENT' },
        },
      ];

      const results = calculateCollectionResponsePattern(events, MemoryTimeWindow.LAST_90_DAYS, now);
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe(MemoryCategory.COLLECTION_BEHAVIOR);
      expect(results[0].type).toBe(MemoryType.COLLECTION_RESPONSE_PATTERN);
      expect(results[0].value.respondedCount).toBe(2);
      expect(results[0].value.total).toBe(2);
      expect(results[0].statement).toContain('Customer responded to 2 of 2 recent whatsapp collection interactions');
    });

    it('should derive receivable overdue pattern when >= 2 receivables exist', () => {
      const now = new Date();
      const events: any[] = [
        {
          id: 'evt-rec-1',
          type: BusinessEventType.RECEIVABLE_CREATED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20),
          data: {},
        },
        {
          id: 'evt-rec-2',
          type: BusinessEventType.RECEIVABLE_CREATED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          data: {},
        },
        {
          id: 'evt-ovd-1',
          type: BusinessEventType.RECEIVABLE_OVERDUE,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
          data: {},
        },
      ];

      const results = calculateReceivableOverduePattern(events, MemoryTimeWindow.LAST_180_DAYS, now);
      expect(results).toHaveLength(1);
      expect(results[0].value.overdueCount).toBe(1);
      expect(results[0].value.totalReceivables).toBe(2);
      expect(results[0].statement).toContain('1 of 2 receivables became overdue in the last 180 days');
    });
  });

  describe('3. Rebuild, Reconciliation & Idempotency', () => {
    it('should rebuild customer memory idempotently without creating duplicate active records', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: mockCustomerId,
        organizationId: mockOrgId,
      });

      const now = new Date();
      (prisma.businessEvent.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'evt-1',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          recordedAt: new Date(),
          data: { currency: 'NGN' },
        },
        {
          id: 'evt-2',
          type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
          occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
          recordedAt: new Date(),
          data: { currency: 'NGN' },
        },
      ]);

      // First run: no existing memories in DB
      (prisma.businessMemory.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.businessMemory.create as jest.Mock).mockResolvedValue({
        id: 'mem-1',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
      });

      const result1 = await service.rebuildCustomerMemory(mockOrgId, mockCustomerId);
      expect(result1.created).toBeGreaterThan(0);
      expect(prisma.businessMemory.create).toHaveBeenCalled();

      // Second run: existing memory with same statement & value already in DB
      (prisma.businessMemory.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'mem-1',
          organizationId: mockOrgId,
          customerId: mockCustomerId,
          category: MemoryCategory.COMMITMENT_BEHAVIOR,
          type: MemoryType.PAYMENT_COMMITMENT_FULFILLMENT_RATE,
          timeWindow: MemoryTimeWindow.LAST_90_DAYS,
          statement: 'Customer fulfilled 2 of 2 payment commitments in the last 90 days.',
          value: { fulfilled: 2, partiallyFulfilled: 0, missed: 0, total: 2, rate: 1, currency: 'NGN' },
          currency: 'NGN',
          status: MemoryStatus.ACTIVE,
          evidence: [{ businessEventId: 'evt-1' }, { businessEventId: 'evt-2' }],
        },
        {
          id: 'mem-2',
          organizationId: mockOrgId,
          customerId: mockCustomerId,
          category: MemoryCategory.COMMITMENT_BEHAVIOR,
          type: MemoryType.PAYMENT_COMMITMENT_FULFILLMENT_RATE,
          timeWindow: MemoryTimeWindow.LAST_180_DAYS,
          statement: 'Customer fulfilled 2 of 2 payment commitments in the last 180 days.',
          value: { fulfilled: 2, partiallyFulfilled: 0, missed: 0, total: 2, rate: 1, currency: 'NGN' },
          currency: 'NGN',
          status: MemoryStatus.ACTIVE,
          evidence: [{ businessEventId: 'evt-1' }, { businessEventId: 'evt-2' }],
        },
        {
          id: 'mem-3',
          organizationId: mockOrgId,
          customerId: mockCustomerId,
          category: MemoryCategory.COMMITMENT_BEHAVIOR,
          type: MemoryType.PAYMENT_COMMITMENT_FULFILLMENT_RATE,
          timeWindow: MemoryTimeWindow.ALL_TIME,
          statement: 'Customer fulfilled 2 of 2 payment commitments across all time.',
          value: { fulfilled: 2, partiallyFulfilled: 0, missed: 0, total: 2, rate: 1, currency: 'NGN' },
          currency: 'NGN',
          status: MemoryStatus.ACTIVE,
          evidence: [{ businessEventId: 'evt-1' }, { businessEventId: 'evt-2' }],
        },
      ]);

      (prisma.businessMemory.create as jest.Mock).mockClear();
      (prisma.businessMemory.update as jest.Mock).mockClear();

      const result2 = await service.rebuildCustomerMemory(mockOrgId, mockCustomerId);
      // No new memory created on identical rerun
      expect(result2.created).toBe(0);
    });

    it('should throw NotFoundException if customer does not belong to organization (IDOR)', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getCustomerMemories(mockOrgId, 'cust-attacker', { page: 1, pageSize: 20 })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
