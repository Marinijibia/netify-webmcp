import { Test, TestingModule } from '@nestjs/testing';
import { CollectionActivityService } from './collection-activity.service';
import { prisma, Prisma } from '@netify/database';
import {
  ActivityType,
  CollectionChannel,
  ActivityOutcome,
  CommitmentStatus,
} from '@netify/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@netify/database', () => {
  const actualDatabase = jest.requireActual('@netify/database');
  return {
    ...actualDatabase,
    prisma: {
      $transaction: jest.fn((callback: any) => callback(prisma)),
      organization: {
        findUnique: jest.fn(),
      },
      membership: {
        findUnique: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
      },
      receivable: {
        findFirst: jest.fn(),
      },
      collectionActivity: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      paymentCommitment: {
        create: jest.fn(),
      },
    },
  };
});

describe('CollectionActivityService (Domain Design 04 Test Suite)', () => {
  let service: CollectionActivityService;

  const mockOrgId = 'org-1111';
  const mockUserId = 'user-1111';
  const mockCustomerId = 'cust-1111';
  const mockReceivableId = 'rec-1111';

  const mockOrg = {
    id: mockOrgId,
    name: 'Alaba Electricals',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
  };

  const mockMembership = {
    organizationId: mockOrgId,
    userId: mockUserId,
    status: 'ACTIVE',
    role: 'MEMBER',
  };

  const mockCustomer = {
    id: mockCustomerId,
    organizationId: mockOrgId,
    name: 'Kemi Adebayo',
  };

  const mockReceivable = {
    id: mockReceivableId,
    organizationId: mockOrgId,
    customerId: mockCustomerId,
    reference: 'REC-001',
    originalAmount: new Prisma.Decimal('300000.00'),
    currency: 'NGN',
    status: 'OPEN',
    payments: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionActivityService],
    }).compile();

    service = module.get<CollectionActivityService>(CollectionActivityService);
  });

  describe('1. Activity Creation & Invariants', () => {
    it('should record an activity successfully for an authorized user', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(mockReceivable);
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      const mockCreatedActivity = {
        id: 'act-101',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        performedByUserId: mockUserId,
        type: ActivityType.CALL,
        channel: CollectionChannel.PHONE,
        outcome: ActivityOutcome.CONTACTED,
        occurredAt: new Date(),
        notes: 'Spoke with Kemi. Said she will check inventory.',
      };

      (prisma.collectionActivity.create as jest.Mock).mockResolvedValue(mockCreatedActivity);

      const result = await service.create(mockOrgId, mockUserId, {
        receivableId: mockReceivableId,
        type: ActivityType.CALL,
        channel: CollectionChannel.PHONE,
        outcome: ActivityOutcome.CONTACTED,
        notes: 'Spoke with Kemi. Said she will check inventory.',
      });

      expect(result.id).toBe('act-101');
      expect(result.type).toBe(ActivityType.CALL);
      expect(result.channel).toBe(CollectionChannel.PHONE);
      expect(result.commitments).toEqual([]);
      expect(prisma.collectionActivity.create).toHaveBeenCalled();
    });

    it('should record activity with inline payment commitment atomically', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(mockReceivable);
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      const mockCreatedActivity = {
        id: 'act-102',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        performedByUserId: mockUserId,
        type: ActivityType.WHATSAPP,
        channel: CollectionChannel.WHATSAPP,
        outcome: ActivityOutcome.PROMISED_PAYMENT,
        occurredAt: new Date(),
        notes: 'Customer promised 150k on Friday',
      };

      const mockCreatedCommitment = {
        id: 'comm-101',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        createdByUserId: mockUserId,
        amount: new Prisma.Decimal('150000.00'),
        currency: 'NGN',
        promisedFor: new Date('2026-08-28'),
        status: CommitmentStatus.PENDING,
        sourceActivityId: 'act-102',
        notes: 'Promised 150k after supply',
      };

      (prisma.collectionActivity.create as jest.Mock).mockResolvedValue(mockCreatedActivity);
      (prisma.paymentCommitment.create as jest.Mock).mockResolvedValue(mockCreatedCommitment);

      const result = await service.create(mockOrgId, mockUserId, {
        receivableId: mockReceivableId,
        type: ActivityType.WHATSAPP,
        channel: CollectionChannel.WHATSAPP,
        outcome: ActivityOutcome.PROMISED_PAYMENT,
        notes: 'Customer promised 150k on Friday',
        commitment: {
          amount: 150000,
          promisedFor: new Date('2026-08-28'),
          notes: 'Promised 150k after supply',
        },
      });

      expect(result.id).toBe('act-102');
      expect(result.commitments.length).toBe(1);
      expect(result.commitments[0].amount).toBe('150000');
      expect(prisma.paymentCommitment.create).toHaveBeenCalled();
    });

    it('should reject inline commitment exceeding receivable balance', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(mockReceivable); // balance = 300,000
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      await expect(
        service.create(mockOrgId, mockUserId, {
          receivableId: mockReceivableId,
          type: ActivityType.CALL,
          channel: CollectionChannel.PHONE,
          outcome: ActivityOutcome.PROMISED_PAYMENT,
          commitment: {
            amount: 500000, // exceeds 300,000
            promisedFor: new Date('2026-08-28'),
          },
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject activity when performing user is not an active member', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(mockOrgId, 'stranger-user', {
          receivableId: mockReceivableId,
          type: ActivityType.CALL,
          channel: CollectionChannel.PHONE,
          outcome: ActivityOutcome.CONTACTED,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject activity if customer ID does not match receivable debtor', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(mockReceivable); // debtor = cust-1111

      await expect(
        service.create(mockOrgId, mockUserId, {
          receivableId: mockReceivableId,
          customerId: 'cust-9999-mismatched',
          type: ActivityType.CALL,
          channel: CollectionChannel.PHONE,
          outcome: ActivityOutcome.CONTACTED,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Multi-Tenant Security & IDOR Isolation', () => {
    it('should reject fetching activity belonging to another organization (IDOR)', async () => {
      (prisma.collectionActivity.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getById(mockOrgId, 'act-foreign-tenant')).rejects.toThrow(
        NotFoundException
      );

      expect(prisma.collectionActivity.findFirst).toHaveBeenCalledWith({
        where: { id: 'act-foreign-tenant', organizationId: mockOrgId },
        include: expect.any(Object),
      });
    });

    it('should list only activities belonging to the active organization', async () => {
      (prisma.collectionActivity.count as jest.Mock).mockResolvedValue(1);
      (prisma.collectionActivity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'act-1',
          organizationId: mockOrgId,
          customerId: mockCustomerId,
          receivableId: mockReceivableId,
          type: ActivityType.IN_PERSON,
          channel: CollectionChannel.IN_PERSON,
          outcome: ActivityOutcome.CONTACTED,
          occurredAt: new Date(),
          commitments: [],
        },
      ]);

      const result = await service.list(mockOrgId, { page: 1, pageSize: 10 });
      expect(result.items.length).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
      expect(prisma.collectionActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: mockOrgId },
        })
      );
    });
  });
});
