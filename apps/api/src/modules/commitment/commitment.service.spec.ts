import { Test, TestingModule } from '@nestjs/testing';
import { CommitmentService } from './commitment.service';
import { BusinessEventService } from '../business-event/business-event.service';
import {
  prisma,
  Prisma,
  CommitmentStatus,
} from '@netify/database';
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
      payment: {
        findMany: jest.fn(),
      },
      collectionActivity: {
        findFirst: jest.fn(),
      },
      paymentCommitment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    },
  };
});

describe('CommitmentService (Domain Design 04 Test Suite)', () => {
  let service: CommitmentService;

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

  const mockReceivable = {
    id: mockReceivableId,
    organizationId: mockOrgId,
    customerId: mockCustomerId,
    reference: 'REC-001',
    originalAmount: new Prisma.Decimal('500000.00'),
    currency: 'NGN',
    status: 'OPEN',
    payments: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommitmentService,
        {
          provide: BusinessEventService,
          useValue: {
            recordEvent: jest.fn().mockResolvedValue({ id: 'evt-comm-mock' }),
          },
        },
      ],
    }).compile();

    service = module.get<CommitmentService>(CommitmentService);
  });

  describe('1. Commitment Creation & Invariants', () => {
    it('should create a valid commitment within remaining balance', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(mockReceivable);

      const mockCommitment = {
        id: 'comm-1',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        createdByUserId: mockUserId,
        amount: new Prisma.Decimal('200000.00'),
        currency: 'NGN',
        promisedFor: new Date('2026-08-30'),
        status: CommitmentStatus.PENDING,
        notes: 'Promise after delivery',
      };

      (prisma.paymentCommitment.create as jest.Mock).mockResolvedValue(mockCommitment);

      const result = await service.create(mockOrgId, mockUserId, {
        receivableId: mockReceivableId,
        amount: 200000,
        currency: 'NGN',
        promisedFor: new Date('2026-08-30'),
        notes: 'Promise after delivery',
      });

      expect(result.id).toBe('comm-1');
      expect(result.amount).toBe('200000');
      expect(result.status).toBe(CommitmentStatus.PENDING);
      expect(prisma.paymentCommitment.create).toHaveBeenCalled();
    });

    it('should reject commitment with amount exceeding remaining balance', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(mockReceivable); // balance = 500k

      await expect(
        service.create(mockOrgId, mockUserId, {
          receivableId: mockReceivableId,
          amount: 600000,
          currency: 'NGN',
          promisedFor: new Date('2026-08-30'),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject commitment with currency mismatch', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(mockReceivable); // currency = NGN

      await expect(
        service.create(mockOrgId, mockUserId, {
          receivableId: mockReceivableId,
          amount: 100000,
          currency: 'USD',
          promisedFor: new Date('2026-08-30'),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject commitment when performing user is not active member', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(mockOrgId, 'stranger-user', {
          receivableId: mockReceivableId,
          amount: 100000,
          promisedFor: new Date('2026-08-30'),
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Authoritative Payment Fulfillment Engine', () => {
    it('should fulfill commitment when confirmed payment meets committed amount', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      const mockPayments = [
        {
          id: 'pay-1',
          organizationId: mockOrgId,
          receivableId: mockReceivableId,
          amount: new Prisma.Decimal('200000.00'),
          status: 'CONFIRMED',
          paidAt: new Date(),
        },
      ];

      const mockCommitments = [
        {
          id: 'comm-1',
          amount: new Prisma.Decimal('200000.00'),
          status: CommitmentStatus.PENDING,
          promisedFor: new Date('2026-08-25'),
        },
      ];

      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.paymentCommitment.findMany as jest.Mock).mockResolvedValue(mockCommitments);

      await service.evaluateCommitmentsForPayment(mockOrgId, mockReceivableId);

      expect(prisma.paymentCommitment.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: { status: CommitmentStatus.FULFILLED },
      });
    });

    it('should partially fulfill commitment when confirmed payment is less than committed amount', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      const mockPayments = [
        {
          id: 'pay-1',
          organizationId: mockOrgId,
          receivableId: mockReceivableId,
          amount: new Prisma.Decimal('100000.00'),
          status: 'CONFIRMED',
          paidAt: new Date(),
        },
      ];

      const mockCommitments = [
        {
          id: 'comm-1',
          amount: new Prisma.Decimal('200000.00'),
          status: CommitmentStatus.PENDING,
          promisedFor: new Date('2026-08-30'),
        },
      ];

      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.paymentCommitment.findMany as jest.Mock).mockResolvedValue(mockCommitments);

      await service.evaluateCommitmentsForPayment(mockOrgId, mockReceivableId);

      expect(prisma.paymentCommitment.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: { status: CommitmentStatus.PARTIALLY_FULFILLED },
      });
    });

    it('should recalculate commitment to PENDING / MISSED upon payment reversal', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      // No confirmed payments after reversal
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);

      const mockCommitments = [
        {
          id: 'comm-1',
          amount: new Prisma.Decimal('200000.00'),
          status: CommitmentStatus.FULFILLED,
          promisedFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

      (prisma.paymentCommitment.findMany as jest.Mock).mockResolvedValue(mockCommitments);

      await service.evaluateCommitmentsForPayment(mockOrgId, mockReceivableId);

      expect(prisma.paymentCommitment.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: { status: CommitmentStatus.PENDING },
      });
    });
  });

  describe('3. Commitment Cancellation & History Preservation', () => {
    it('should soft-cancel a pending commitment and record cancellation notes', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.paymentCommitment.findFirst as jest.Mock).mockResolvedValue({
        id: 'comm-1',
        organizationId: mockOrgId,
        status: CommitmentStatus.PENDING,
        amount: new Prisma.Decimal('200000.00'),
        promisedFor: new Date('2026-08-30'),
        notes: 'Original notes',
      });

      (prisma.paymentCommitment.update as jest.Mock).mockResolvedValue({
        id: 'comm-1',
        organizationId: mockOrgId,
        status: CommitmentStatus.CANCELLED,
        amount: new Prisma.Decimal('200000.00'),
        promisedFor: new Date('2026-08-30'),
        notes: 'Original notes\n[Cancelled]: Customer renegotiated terms',
      });

      const result = await service.cancel(mockOrgId, 'comm-1', {
        notes: 'Customer renegotiated terms',
      });

      expect(result.status).toBe(CommitmentStatus.CANCELLED);
      expect(prisma.paymentCommitment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comm-1' },
          data: {
            status: CommitmentStatus.CANCELLED,
            notes: 'Original notes\n[Cancelled]: Customer renegotiated terms',
          },
        })
      );
    });

    it('should reject cancelling an already fulfilled commitment', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.paymentCommitment.findFirst as jest.Mock).mockResolvedValue({
        id: 'comm-1',
        organizationId: mockOrgId,
        status: CommitmentStatus.FULFILLED,
        amount: new Prisma.Decimal('200000.00'),
      });

      await expect(
        service.cancel(mockOrgId, 'comm-1', { notes: 'Try cancel' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. IDOR Protection', () => {
    it('should reject access to another organization commitment', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.paymentCommitment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getById(mockOrgId, 'comm-foreign')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
