import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { prisma, CustomerStatus, ContactType } from '@netify/database';
import {
  createCustomerSchema,
  createCustomerContactSchema,
  customerQuerySchema,
} from '@netify/validation';

jest.mock('@netify/database', () => {
  const mPrisma: any = {
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customerContact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mPrisma)),
  };

  return {
    prisma: mPrisma,
    CustomerStatus: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      ARCHIVED: 'ARCHIVED',
      BLOCKED: 'BLOCKED',
    },
    ContactType: {
      PHONE: 'PHONE',
      EMAIL: 'EMAIL',
      WHATSAPP: 'WHATSAPP',
      OTHER: 'OTHER',
    },
    BusinessEventType: {
      CUSTOMER_CREATED: 'CUSTOMER_CREATED',
      CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
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
  };
});

import { BusinessEventService } from '../business-event/business-event.service';

describe('CustomerService (Domain Design 02 Test Suite)', () => {
  let service: CustomerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: BusinessEventService,
          useValue: {
            recordEvent: jest.fn().mockResolvedValue({ id: 'evt-cust-mock' }),
            getCustomerTimeline: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  describe('1. Customer Creation & Atomic Primary Contact Setup', () => {
    it('should atomically create a customer and initial primary contacts', async () => {
      const mockCreatedCustomer = {
        id: 'cust-1',
        organizationId: 'org-1',
        name: 'Musa Garba & Sons Ltd',
        phone: '+2348012345678',
        email: 'musa@garba.ng',
        status: 'ACTIVE',
        country: 'NG',
        currency: 'NGN',
        notes: 'Wholesale distributor in Kano',
        tags: ['wholesale'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.create as jest.Mock).mockResolvedValue(mockCreatedCustomer);
      (prisma.customerContact.create as jest.Mock).mockResolvedValue({ id: 'contact-1' });
      (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
        ...mockCreatedCustomer,
        contacts: [
          { id: 'contact-1', type: 'PHONE', value: '+2348012345678', isPrimary: true },
          { id: 'contact-2', type: 'EMAIL', value: 'musa@garba.ng', isPrimary: true },
        ],
      });

      const result = await service.create('org-1', {
        name: 'Musa Garba & Sons Ltd',
        phone: '+2348012345678',
        email: 'musa@garba.ng',
        notes: 'Wholesale distributor in Kano',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          name: 'Musa Garba & Sons Ltd',
          phone: '+2348012345678',
          email: 'musa@garba.ng',
          status: 'ACTIVE',
        }),
      });
      expect(prisma.customerContact.create).toHaveBeenCalledTimes(2);
      expect(result!.name).toBe('Musa Garba & Sons Ltd');
    });

    it('should reject creation if organizationId is missing', async () => {
      await expect(
        service.create('', { name: 'Test Customer' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creation if name is empty or whitespace', async () => {
      await expect(
        service.create('org-1', { name: '   ' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Multi-Tenant Customer Listing, Search & Pagination', () => {
    it('should return paginated list of customers for the organization with search', async () => {
      const mockCustomers = [
        {
          id: 'cust-1',
          organizationId: 'org-1',
          name: 'Apex Supermarket',
          status: 'ACTIVE',
          contacts: [{ id: 'c-1', type: 'PHONE', value: '+2348033333333', isPrimary: true }],
        },
      ];

      (prisma.customer.count as jest.Mock).mockResolvedValue(1);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const result = await service.list('org-1', {
        search: 'Apex',
        status: 'ACTIVE' as any,
        page: 1,
        pageSize: 20,
      });

      expect(result.items.length).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('3. Insecure Direct Object Reference (IDOR) Protection', () => {
    it('should allow retrieval if customer belongs to user organization', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-legit',
        name: 'Legit Customer',
        contacts: [],
      });

      const result = await service.getById('org-legit', 'cust-1');
      expect(result.id).toBe('cust-1');
    });

    it('should REJECT retrieval if customer belongs to another organization (IDOR)', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('org-attacker', 'cust-victim')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should REJECT update if customer belongs to another organization (IDOR)', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('org-attacker', 'cust-victim', { name: 'Hijacked Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should REJECT archiving if customer belongs to another organization (IDOR)', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.archive('org-attacker', 'cust-victim')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('4. Customer Archiving & Preservation', () => {
    it('should soft-archive customer without physical database deletion', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-1',
        name: 'Preserved Customer',
        status: 'ACTIVE',
      });

      (prisma.customer.update as jest.Mock).mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-1',
        name: 'Preserved Customer',
        status: 'ARCHIVED',
        contacts: [],
      });

      const result = await service.archive('org-1', 'cust-1');

      expect(result.status).toBe('ARCHIVED');
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-1' },
          data: { status: 'ARCHIVED' },
        })
      );
    });
  });

  describe('5. Dedicated Customer Contacts & Primary Constraint Management', () => {
    it('should add a new contact and demote existing primary contact of same type', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-1',
        name: 'Customer With Contacts',
      });

      (prisma.customerContact.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.customerContact.create as jest.Mock).mockResolvedValue({
        id: 'contact-new',
        customerId: 'cust-1',
        type: 'PHONE',
        value: '+2348099999999',
        isPrimary: true,
      });
      (prisma.customer.update as jest.Mock).mockResolvedValue({});

      const contact = await service.addContact('org-1', 'cust-1', {
        type: 'PHONE' as any,
        value: '+2348099999999',
        label: 'New Main Line',
        isPrimary: true,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.customerContact.updateMany).toHaveBeenCalledWith({
        where: {
          customerId: 'cust-1',
          type: 'PHONE',
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
      expect(contact.value).toBe('+2348099999999');
    });

    it('should delete a contact with IDOR protection', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-1',
      });

      (prisma.customerContact.findFirst as jest.Mock).mockResolvedValue({
        id: 'contact-1',
        customerId: 'cust-1',
      });

      (prisma.customerContact.delete as jest.Mock).mockResolvedValue({});

      const res = await service.deleteContact('org-1', 'cust-1', 'contact-1');
      expect(res.success).toBe(true);
      expect(prisma.customerContact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      });
    });

    it('should REJECT deleting contact if contact does not belong to customer (IDOR)', async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-1',
      });

      (prisma.customerContact.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteContact('org-1', 'cust-1', 'foreign-contact-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('6. Schema Validation Suite', () => {
    it('should accept valid customer with African phone number and email', () => {
      const valid = {
        name: 'Chidi & Chidi Global Ltd',
        phone: '+2348023456789',
        email: 'chidi@chidiglobal.com',
        notes: 'Regular client since 2024',
      };

      const result = createCustomerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject customer name with less than 2 characters', () => {
      const invalid = {
        name: 'A',
      };

      const result = createCustomerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const invalid = {
        name: 'Test Customer',
        phone: 'not-a-phone-number',
      };

      const result = createCustomerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format in contact creation', () => {
      const invalid = {
        type: ContactType.EMAIL,
        value: 'invalid-email-address',
      };

      const result = createCustomerContactSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept valid contact with label and primary flag', () => {
      const valid = {
        type: ContactType.PHONE,
        value: '+254712345678',
        label: 'Nairobi Office',
        isPrimary: true,
      };

      const result = createCustomerContactSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
