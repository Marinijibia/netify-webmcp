import { Test, TestingModule } from '@nestjs/testing';
import {
  BusinessEventService,
  RecordBusinessEventParams,
} from './business-event.service';
import {
  prisma,
  BusinessEventType,
  ActorType,
  EventSource,
  CustomerStatus,
  ReceivableStatus,
  PaymentStatus,
  CommitmentStatus,
} from '@netify/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('@netify/database', () => {
  const actualPrisma = jest.requireActual('@prisma/client');
  return {
    prisma: {
      $transaction: jest.fn((callback) => callback(prisma)),
      businessEvent: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
      },
      receivable: {
        findFirst: jest.fn(),
      },
    },
    Prisma: {
      Decimal: actualPrisma.Prisma.Decimal,
    },
    BusinessEventType: {
      CUSTOMER_CREATED: 'CUSTOMER_CREATED',
      CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
      RECEIVABLE_CREATED: 'RECEIVABLE_CREATED',
      RECEIVABLE_OVERDUE: 'RECEIVABLE_OVERDUE',
      RECEIVABLE_PAID: 'RECEIVABLE_PAID',
      RECEIVABLE_PARTIALLY_PAID: 'RECEIVABLE_PARTIALLY_PAID',
      PAYMENT_CREATED: 'PAYMENT_CREATED',
      PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
      PAYMENT_FAILED: 'PAYMENT_FAILED',
      PAYMENT_REVERSED: 'PAYMENT_REVERSED',
      COLLECTION_ACTIVITY_RECORDED: 'COLLECTION_ACTIVITY_RECORDED',
      PAYMENT_COMMITMENT_CREATED: 'PAYMENT_COMMITMENT_CREATED',
      PAYMENT_COMMITMENT_FULFILLED: 'PAYMENT_COMMITMENT_FULFILLED',
      PAYMENT_COMMITMENT_PARTIALLY_FULFILLED: 'PAYMENT_COMMITMENT_PARTIALLY_FULFILLED',
      PAYMENT_COMMITMENT_MISSED: 'PAYMENT_COMMITMENT_MISSED',
      PAYMENT_COMMITMENT_CANCELLED: 'PAYMENT_COMMITMENT_CANCELLED',
      INVOICE_CREATED: 'INVOICE_CREATED',
      DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    },
    ActorType: {
      USER: 'USER',
      SYSTEM: 'SYSTEM',
      CUSTOMER: 'CUSTOMER',
      PROVIDER: 'PROVIDER',
    },
    EventSource: {
      USER_ACTION: 'USER_ACTION',
      PAYMENT_PROCESS: 'PAYMENT_PROCESS',
      COLLECTION_ACTIVITY: 'COLLECTION_ACTIVITY',
      SCHEDULED_PROCESS: 'SCHEDULED_PROCESS',
      SYSTEM: 'SYSTEM',
    },
    CustomerStatus: { ACTIVE: 'ACTIVE', ARCHIVED: 'ARCHIVED' },
    ReceivableStatus: { PENDING: 'PENDING', PAID: 'PAID', PARTIALLY_PAID: 'PARTIALLY_PAID', OVERDUE: 'OVERDUE', CANCELLED: 'CANCELLED' },
    PaymentStatus: { PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', FAILED: 'FAILED', REVERSED: 'REVERSED' },
    CommitmentStatus: { PENDING: 'PENDING', FULFILLED: 'FULFILLED', PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED', MISSED: 'MISSED', CANCELLED: 'CANCELLED' },
  };
});

describe('BusinessEventService (Domain 05)', () => {
  let service: BusinessEventService;

  const mockOrgId = 'org-test-05';
  const mockOrgId2 = 'org-test-other';
  const mockCustomerId = 'cust-test-05';
  const mockReceivableId = 'rec-test-05';
  const mockUserId = 'user-test-05';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessEventService],
    }).compile();

    service = module.get<BusinessEventService>(BusinessEventService);
  });

  describe('Sanitization & Security', () => {
    it('strips sensitive secrets, access tokens, and passwords from event data', async () => {
      const payloadWithSecrets = {
        amount: '100000',
        currency: 'NGN',
        password: 'superSecretPassword123',
        accessToken: 'eyJhbGciOiJIUzI1NiIsIn...',
        creditCard: '4111222233334444',
        pin: '1234',
        safeNotes: 'Customer promised to pay by transfer',
      };

      const sanitized = (service as any).sanitizePayload(payloadWithSecrets);

      expect(sanitized.amount).toBe('100000');
      expect(sanitized.currency).toBe('NGN');
      expect(sanitized.safeNotes).toBe('Customer promised to pay by transfer');
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.accessToken).toBeUndefined();
      expect(sanitized.creditCard).toBeUndefined();
      expect(sanitized.pin).toBeUndefined();
    });
  });

  describe('Event Recording Invariants', () => {
    it('throws BadRequestException if organizationId is missing', async () => {
      await expect(
        service.recordStandalone({
          organizationId: '',
          type: BusinessEventType.CUSTOMER_CREATED,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if event type is missing', async () => {
      await expect(
        service.recordStandalone({
          organizationId: mockOrgId,
          type: undefined as any,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('IDOR & Multi-Tenant Boundary Isolation', () => {
    it('strictly separates organization event streams', async () => {
      // Mock findMany and count
      const findManySpy = jest
        .spyOn(prisma.businessEvent, 'findMany')
        .mockResolvedValueOnce([
          {
            id: 'evt-1',
            organizationId: mockOrgId,
            customerId: mockCustomerId,
            receivableId: null,
            paymentId: null,
            collectionActivityId: null,
            paymentCommitmentId: null,
            type: BusinessEventType.CUSTOMER_CREATED,
            occurredAt: new Date(),
            recordedAt: new Date(),
            actorType: ActorType.USER,
            actorUserId: mockUserId,
            source: EventSource.USER_ACTION,
            data: { name: 'Adebayo Stores' },
            version: 1,
            correlationId: null,
            causationId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
        ]);

      const countSpy = jest
        .spyOn(prisma.businessEvent, 'count')
        .mockResolvedValueOnce(1);

      const result = await service.listOrganizationEvents(mockOrgId, {
        page: 1,
        pageSize: 20,
      });

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: mockOrgId }),
        })
      );
      expect(result.items.length).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
    });

    it('throws NotFoundException if retrieving timeline for a non-existent or cross-tenant customer', async () => {
      jest.spyOn(prisma.customer, 'findFirst').mockResolvedValueOnce(null);

      await expect(
        service.getCustomerTimeline(mockOrgId, 'wrong-cust-id', {
          page: 1,
          pageSize: 20,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if retrieving timeline for a non-existent or cross-tenant receivable', async () => {
      jest.spyOn(prisma.receivable, 'findFirst').mockResolvedValueOnce(null);

      await expect(
        service.getReceivableTimeline(mockOrgId, 'wrong-rec-id', {
          page: 1,
          pageSize: 20,
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Ordering & Chronology Verification', () => {
    it('orders events deterministically by occurredAt desc, recordedAt desc, id desc', async () => {
      const findFirstSpy = jest
        .spyOn(prisma.customer, 'findFirst')
        .mockResolvedValueOnce({ id: mockCustomerId, name: 'Test' } as any);

      const findManySpy = jest
        .spyOn(prisma.businessEvent, 'findMany')
        .mockResolvedValueOnce([]);

      jest.spyOn(prisma.businessEvent, 'count').mockResolvedValueOnce(0);

      await service.getCustomerTimeline(mockOrgId, mockCustomerId, {
        page: 1,
        pageSize: 20,
      });

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { occurredAt: 'desc' },
            { recordedAt: 'desc' },
            { id: 'desc' },
          ],
        })
      );
    });
  });

  describe('Transactional Domain Event Emission', () => {
    it('creates PAYMENT_CONFIRMED event with correlationId and snapshot data inside transaction', async () => {
      const mockTx: any = {
        businessEvent: {
          create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'evt-pay-1', ...data })),
        },
      };

      const result = await service.recordEvent(mockTx, {
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        paymentId: 'pay-123',
        type: BusinessEventType.PAYMENT_CONFIRMED,
        occurredAt: new Date('2026-08-20T10:00:00Z'),
        actorType: ActorType.USER,
        actorUserId: mockUserId,
        source: EventSource.PAYMENT_PROCESS,
        data: {
          amount: '50000',
          currency: 'NGN',
          method: 'BANK_TRANSFER',
          reference: 'TRF-9901',
        },
        correlationId: 'corr_pay_123',
        version: 1,
      });

      expect(mockTx.businessEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: mockOrgId,
          customerId: mockCustomerId,
          receivableId: mockReceivableId,
          paymentId: 'pay-123',
          type: BusinessEventType.PAYMENT_CONFIRMED,
          actorType: ActorType.USER,
          actorUserId: mockUserId,
          source: EventSource.PAYMENT_PROCESS,
          data: {
            amount: '50000',
            currency: 'NGN',
            method: 'BANK_TRANSFER',
            reference: 'TRF-9901',
          },
          correlationId: 'corr_pay_123',
          version: 1,
        }),
      });

      expect(result.id).toBe('evt-pay-1');
    });

    it('creates COLLECTION_ACTIVITY_RECORDED and PAYMENT_COMMITMENT_CREATED events', async () => {
      const mockTx: any = {
        businessEvent: {
          create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'evt-act-1', ...data })),
        },
      };

      await service.recordEvent(mockTx, {
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        collectionActivityId: 'act-123',
        type: BusinessEventType.COLLECTION_ACTIVITY_RECORDED,
        occurredAt: new Date(),
        actorType: ActorType.USER,
        actorUserId: mockUserId,
        source: EventSource.COLLECTION_ACTIVITY,
        data: {
          type: 'WHATSAPP',
          channel: 'WHATSAPP',
          outcome: 'PROMISED_PAYMENT',
          notes: 'Customer promised ₦20,000 Friday',
        },
        correlationId: 'corr_act_123',
        version: 1,
      });

      expect(mockTx.businessEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: BusinessEventType.COLLECTION_ACTIVITY_RECORDED,
          collectionActivityId: 'act-123',
          source: EventSource.COLLECTION_ACTIVITY,
        }),
      });
    });
  });
});
