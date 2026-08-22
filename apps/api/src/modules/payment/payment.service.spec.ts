import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { CommitmentService } from '../commitment/commitment.service';
import { prisma, Prisma, PaymentStatus, ReceivableStatus } from '@netify/database';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@netify/database', () => {
  const actualPrisma = jest.requireActual('@prisma/client');
  return {
    prisma: {
      $transaction: jest.fn((callback) => callback(prisma)),
      $queryRaw: jest.fn(),
      customer: {
        findFirst: jest.fn(),
      },
      receivable: {
        update: jest.fn(),
      },
      payment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    },
    Prisma: {
      Decimal: actualPrisma.Prisma.Decimal,
    },
    PaymentStatus: {
      PENDING: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      FAILED: 'FAILED',
      REVERSED: 'REVERSED',
    },
    ReceivableStatus: {
      OPEN: 'OPEN',
      PARTIALLY_PAID: 'PARTIALLY_PAID',
      PAID: 'PAID',
      OVERDUE: 'OVERDUE',
      DISPUTED: 'DISPUTED',
      CANCELLED: 'CANCELLED',
    },
  };
});

describe('PaymentService (Domain Design 03 Test Suite)', () => {
  let service: PaymentService;

  const mockOrgId = 'org-1111-1111';
  const mockCustomerId = 'cust-1111-1111';
  const mockReceivableId = 'rec-1111-1111';

  const mockReceivable = {
    id: mockReceivableId,
    organizationId: mockOrgId,
    customerId: mockCustomerId,
    reference: 'INV-101',
    originalAmount: new Prisma.Decimal('450000.00'),
    currency: 'NGN',
    status: ReceivableStatus.OPEN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: CommitmentService,
          useValue: {
            evaluateCommitmentsForPayment: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('1. Confirmed Payment & Balance Invariants', () => {
    it('should record a partial payment and set receivable to PARTIALLY_PAID', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockReceivable]);
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]); // No previous payments

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'pay-1',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        amount: new Prisma.Decimal('200000.00'),
        currency: 'NGN',
        status: PaymentStatus.CONFIRMED,
        paidAt: new Date(),
        method: 'BANK_TRANSFER',
        receivable: mockReceivable,
      });

      const result = await service.recordPayment(mockOrgId, {
        receivableId: mockReceivableId,
        amount: 200000.0,
        method: 'BANK_TRANSFER' as any,
      });

      expect(result.id).toBe('pay-1');
      expect(result.amount).toBe('200000');
      expect(prisma.receivable.update).toHaveBeenCalledWith({
        where: { id: mockReceivableId },
        data: { status: ReceivableStatus.PARTIALLY_PAID },
      });
      expect((result.receivable as any)?.balance).toBe('250000');
      expect((result.receivable as any)?.amountPaid).toBe('200000');
    });

    it('should record full payment and set receivable to PAID', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockReceivable]);
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        { id: 'pay-1', amount: new Prisma.Decimal('200000.00'), status: PaymentStatus.CONFIRMED },
      ]); // 200k already paid out of 450k

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'pay-2',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        amount: new Prisma.Decimal('250000.00'),
        currency: 'NGN',
        status: PaymentStatus.CONFIRMED,
        paidAt: new Date(),
        method: 'BANK_TRANSFER',
        receivable: mockReceivable,
      });

      const result = await service.recordPayment(mockOrgId, {
        receivableId: mockReceivableId,
        amount: 250000.0,
      });

      expect(result.id).toBe('pay-2');
      expect(prisma.receivable.update).toHaveBeenCalledWith({
        where: { id: mockReceivableId },
        data: { status: ReceivableStatus.PAID },
      });
      expect((result.receivable as any)?.balance).toBe('0');
      expect((result.receivable as any)?.amountPaid).toBe('450000');
    });

    it('should REJECT payment that exceeds remaining balance (Overpayment Protection)', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockReceivable]);
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        { id: 'pay-1', amount: new Prisma.Decimal('400000.00'), status: PaymentStatus.CONFIRMED },
      ]); // 50k balance left

      await expect(
        service.recordPayment(mockOrgId, {
          receivableId: mockReceivableId,
          amount: 60000.0, // Attempts to pay 60k when only 50k left
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should REJECT payment if receivable is already fully PAID', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockReceivable]);
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        { id: 'pay-1', amount: new Prisma.Decimal('450000.00'), status: PaymentStatus.CONFIRMED },
      ]); // Fully paid

      await expect(
        service.recordPayment(mockOrgId, {
          receivableId: mockReceivableId,
          amount: 1000.0,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should REJECT payment if receivable is CANCELLED', async () => {
      const cancelledRec = { ...mockReceivable, status: ReceivableStatus.CANCELLED };
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([cancelledRec]);

      await expect(
        service.recordPayment(mockOrgId, {
          receivableId: mockReceivableId,
          amount: 50000.0,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should REJECT payment if currency does not match receivable currency', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockReceivable]); // Receivable is NGN

      await expect(
        service.recordPayment(mockOrgId, {
          receivableId: mockReceivableId,
          amount: 100.0,
          currency: 'USD',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should REJECT payment if customer does not match receivable customer', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockReceivable]); // Receivable customer is cust-1111

      await expect(
        service.recordPayment(mockOrgId, {
          receivableId: mockReceivableId,
          customerId: 'different-customer-id',
          amount: 50000.0,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Idempotency & Concurrency Handling', () => {
    it('should safely return existing payment if idempotency key was already recorded', async () => {
      const existingPay = {
        id: 'pay-idempotent-1',
        organizationId: mockOrgId,
        idempotencyKey: 'nonce-12345',
        amount: new Prisma.Decimal('50000.00'),
        currency: 'NGN',
        status: PaymentStatus.CONFIRMED,
      };
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(existingPay);

      const result = await service.recordPayment(mockOrgId, {
        receivableId: mockReceivableId,
        amount: 50000.0,
        idempotencyKey: 'nonce-12345',
      });

      expect(result.id).toBe('pay-idempotent-1');
      expect((result as any).isDuplicate).toBe(true);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('3. Payment Reversals & Audit Integrity', () => {
    it('should reverse a confirmed payment and restore the receivable balance and status', async () => {
      const confirmedPayment = {
        id: 'pay-to-reverse',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        receivableId: mockReceivableId,
        amount: new Prisma.Decimal('200000.00'),
        status: PaymentStatus.CONFIRMED,
      };

      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(confirmedPayment);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([mockReceivable]);

      (prisma.payment.update as jest.Mock).mockResolvedValue({
        ...confirmedPayment,
        status: PaymentStatus.REVERSED,
      });

      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]); // 0 remaining confirmed payments after reversal

      const result = await service.reversePayment(mockOrgId, 'pay-to-reverse');

      expect(result.status).toBe(PaymentStatus.REVERSED);
      expect(prisma.receivable.update).toHaveBeenCalledWith({
        where: { id: mockReceivableId },
        data: { status: ReceivableStatus.OPEN },
      });
      expect((result as any).receivableRemainingBalance).toBe('450000');
    });

    it('should REJECT reversing an already reversed or failed payment', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'pay-already-reversed',
        organizationId: mockOrgId,
        status: PaymentStatus.REVERSED,
      });

      await expect(service.reversePayment(mockOrgId, 'pay-already-reversed')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
