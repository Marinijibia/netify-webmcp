import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from '../customer/customer.service';
import { ReceivableService } from '../receivable/receivable.service';
import { NotificationService } from '../notification/notification.service';
import { BusinessEventService } from '../business-event/business-event.service';
import { prisma } from '@netify/database';
import { NotFoundException } from '@nestjs/common';

jest.mock('@netify/database', () => {
  return {
    prisma: {
      customer: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      receivable: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      notification: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      organization: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'Africa/Lagos' }),
      },
    },
    CustomerStatus: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
    },
    ReceivableStatus: {
      OPEN: 'OPEN',
      OUTSTANDING: 'OUTSTANDING',
      PARTIALLY_PAID: 'PARTIALLY_PAID',
      PAID: 'PAID',
    },
    NotificationStatus: {
      READ: 'READ',
    },
  };
});

describe('Domain 10: Multi-Tenant Security & Organization Boundary Isolation Suite', () => {
  let customerService: CustomerService;
  let receivableService: ReceivableService;
  let notificationService: NotificationService;

  const ORG_A = 'org-tenant-alpha';
  const ORG_B = 'org-tenant-beta';
  const CUST_B = 'customer-belonging-to-org-b';
  const REC_B = 'receivable-belonging-to-org-b';
  const NOTIF_B = 'notification-belonging-to-org-b';

  const mockBusinessEventService = {
    recordEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        ReceivableService,
        NotificationService,
        {
          provide: BusinessEventService,
          useValue: mockBusinessEventService,
        },
      ],
    }).compile();

    customerService = module.get<CustomerService>(CustomerService);
    receivableService = module.get<ReceivableService>(ReceivableService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  describe('Cross-Tenant Data Access Denial', () => {
    it('DENIES access when Org A attempts to fetch Org B customer (throws NotFoundException)', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        customerService.getById(ORG_A, CUST_B)
      ).rejects.toThrow(NotFoundException);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: CUST_B,
            organizationId: ORG_A,
          }),
        })
      );
    });

    it('DENIES mutation when Org A attempts to update Org B customer', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        customerService.update(ORG_A, CUST_B, { name: 'Compromised Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('DENIES access when Org A attempts to query Org B receivable', async () => {
      (prisma.receivable.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        receivableService.getById(ORG_A, REC_B)
      ).rejects.toThrow(NotFoundException);

      expect(prisma.receivable.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: REC_B,
            organizationId: ORG_A,
          }),
        })
      );
    });

    it('DENIES mutation when Org A attempts to mark read Org B notification', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        notificationService.markAsRead(ORG_A, NOTIF_B)
      ).rejects.toThrow(NotFoundException);

      expect(prisma.notification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: NOTIF_B,
            organizationId: ORG_A,
          }),
        })
      );
    });
  });
});
