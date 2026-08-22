import { Test, TestingModule } from '@nestjs/testing';
import { ReceivableService } from './receivable.service';
import { prisma, Prisma, ReceivableSource, ReceivableStatus } from '@netify/database';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@netify/database', () => {
  const actualPrisma = jest.requireActual('@prisma/client');
  return {
    prisma: {
      organization: {
        findUnique: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
      },
      receivable: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    },
    Prisma: {
      Decimal: actualPrisma.Prisma.Decimal,
    },
    ReceivableSource: {
      MANUAL: 'MANUAL',
      INVOICE: 'INVOICE',
      CREDIT_SALE: 'CREDIT_SALE',
      OTHER: 'OTHER',
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

describe('ReceivableService (Domain Design 03 Test Suite)', () => {
  let service: ReceivableService;

  const mockOrgId = 'org-1111-1111';
  const mockCustomerId = 'cust-1111-1111';
  const mockOrg = {
    id: mockOrgId,
    name: 'Acme Traders',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
  };

  const mockCustomer = {
    id: mockCustomerId,
    organizationId: mockOrgId,
    name: 'Emeka Chukwudi',
    currency: 'NGN',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceivableService],
    }).compile();

    service = module.get<ReceivableService>(ReceivableService);
  });

  describe('1. Receivable Creation & Currency Invariant', () => {
    it('should successfully create a valid receivable using organization currency', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      (prisma.receivable.create as jest.Mock).mockResolvedValue({
        id: 'rec-123',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        reference: 'INV-2026-001',
        description: 'Wholesale textile purchase',
        originalAmount: new Prisma.Decimal('450000.00'),
        currency: 'NGN',
        issuedAt: new Date(),
        dueDate,
        source: ReceivableSource.MANUAL,
        status: ReceivableStatus.OPEN,
        notes: '30 days net credit',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { id: mockCustomerId, name: 'Emeka Chukwudi', phone: '+2348012345678', email: 'emeka@example.com' },
      });

      const result = await service.create(mockOrgId, {
        customerId: mockCustomerId,
        amount: 450000.0,
        dueDate: dueDate.toISOString(),
        description: 'Wholesale textile purchase',
        reference: 'INV-2026-001',
      });

      expect(result.id).toBe('rec-123');
      expect(result.currency).toBe('NGN');
      expect(result.originalAmount).toBe('450000');
      expect(result.balance).toBe('450000');
      expect(result.amountPaid).toBe('0');
      expect(result.isOverdue).toBe(false);
    });

    it('should reject receivable creation if currency mismatches organization currency', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      await expect(
        service.create(mockOrgId, {
          customerId: mockCustomerId,
          amount: 500,
          currency: 'USD', // Org uses NGN
          dueDate: new Date().toISOString(),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject receivable creation if customer does NOT belong to the organization (Cross-Tenant / IDOR)', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null); // Customer not found in org

      await expect(
        service.create(mockOrgId, {
          customerId: 'victim-cust-id',
          amount: 50000,
          dueDate: new Date().toISOString(),
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject zero or negative amount', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      await expect(
        service.create(mockOrgId, {
          customerId: mockCustomerId,
          amount: 0,
          dueDate: new Date().toISOString(),
        })
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(mockOrgId, {
          customerId: mockCustomerId,
          amount: -1000,
          dueDate: new Date().toISOString(),
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Timezone-Aware Overdue Calculation', () => {
    it('should mark past due receivable with remaining balance as overdue using organization timezone', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      const pastDueDate = new Date('2026-01-01T00:00:00Z');

      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue({
        id: 'rec-overdue',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        originalAmount: new Prisma.Decimal('100000.00'),
        currency: 'NGN',
        dueDate: pastDueDate,
        status: ReceivableStatus.OPEN,
        payments: [],
      });

      const result = await service.getById(mockOrgId, 'rec-overdue');

      expect(result.isOverdue).toBe(true);
      expect(result.daysOverdue).toBeGreaterThan(0);
      expect(result.balance).toBe('100000');
    });

    it('should NOT mark paid or cancelled receivable as overdue even if due date passed', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      const pastDueDate = new Date('2026-01-01T00:00:00Z');

      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue({
        id: 'rec-paid',
        organizationId: mockOrgId,
        customerId: mockCustomerId,
        originalAmount: new Prisma.Decimal('100000.00'),
        currency: 'NGN',
        dueDate: pastDueDate,
        status: ReceivableStatus.CANCELLED,
        payments: [],
      });

      const result = await service.getById(mockOrgId, 'rec-paid');

      expect(result.isOverdue).toBe(false);
      expect(result.daysOverdue).toBe(0);
    });
  });

  describe('3. Multi-Tenant Listing & IDOR Protection', () => {
    it('should list receivables scoped strictly to the organization', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.receivable.count as jest.Mock).mockResolvedValue(1);
      (prisma.receivable.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'rec-1',
          organizationId: mockOrgId,
          customerId: mockCustomerId,
          originalAmount: new Prisma.Decimal('50000.00'),
          currency: 'NGN',
          dueDate: new Date(),
          status: ReceivableStatus.OPEN,
          payments: [],
        },
      ]);

      const result = await service.list(mockOrgId, { page: 1, pageSize: 20 });

      expect(result.items.length).toBe(1);
      expect(prisma.receivable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: mockOrgId }),
        })
      );
    });

    it('should reject getById if receivable belongs to another organization (IDOR Attack)', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('attacker-org-id', 'victim-rec-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('4. Cancellation Invariant Enforcement', () => {
    it('should allow cancelling an unpaid receivable without payments', async () => {
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue({
        id: 'rec-to-cancel',
        organizationId: mockOrgId,
        originalAmount: new Prisma.Decimal('50000.00'),
        status: ReceivableStatus.OPEN,
      });
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.receivable.update as jest.Mock).mockResolvedValue({
        id: 'rec-to-cancel',
        organizationId: mockOrgId,
        originalAmount: new Prisma.Decimal('50000.00'),
        status: ReceivableStatus.CANCELLED,
      });

      const result = await service.cancel(mockOrgId, 'rec-to-cancel');

      expect(result.status).toBe(ReceivableStatus.CANCELLED);
    });

    it('should REJECT cancellation if confirmed payments exist', async () => {
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue({
        id: 'rec-with-payment',
        organizationId: mockOrgId,
        status: ReceivableStatus.PARTIALLY_PAID,
      });
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        { id: 'pay-1', status: 'CONFIRMED', amount: new Prisma.Decimal('20000.00') },
      ]);

      await expect(service.cancel(mockOrgId, 'rec-with-payment')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
