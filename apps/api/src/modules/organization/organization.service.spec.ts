import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import {
  prisma,
  UserRole,
  UserStatus,
  OrganizationStatus,
  MembershipStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  SecurityEventType,
} from '@netify/database';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
} from '@netify/validation';

jest.mock('@netify/database', () => {
  const mPrisma: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mPrisma)),
  };

  return {
    prisma: mPrisma,
    UserRole: {
      OWNER: 'OWNER',
      MEMBER: 'MEMBER',
      ADMIN: 'ADMIN',
      MANAGER: 'MANAGER',
      STAFF: 'STAFF',
    },
    UserStatus: {
      ACTIVE: 'ACTIVE',
      SUSPENDED: 'SUSPENDED',
      DEACTIVATED: 'DEACTIVATED',
    },
    OrganizationStatus: {
      ACTIVE: 'ACTIVE',
      SUSPENDED: 'SUSPENDED',
      ARCHIVED: 'ARCHIVED',
    },
    MembershipStatus: {
      ACTIVE: 'ACTIVE',
      INVITED: 'INVITED',
      SUSPENDED: 'SUSPENDED',
      REMOVED: 'REMOVED',
    },
    SubscriptionPlan: {
      FREE: 'FREE',
      PRO: 'PRO',
    },
    SubscriptionStatus: {
      ACTIVE: 'ACTIVE',
    },
    SecurityEventType: {
      ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
    },
  };
});

describe('OrganizationService (Domain Design 01 Test Suite)', () => {
  let service: OrganizationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationService],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  describe('1. Atomic Organization & OWNER Membership Creation', () => {
    const validPayload = {
      name: 'Apex Haulage Logistics Ltd',
      businessType: 'LOGISTICS',
      country: 'NG',
      currency: 'NGN',
      timezone: 'Africa/Lagos',
    };

    it('should atomically create organization, OWNER membership, FREE subscription, and advance onboarding', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-owner-1',
        status: 'ACTIVE',
        isActive: true,
      });

      const mockOrg = {
        id: 'org-123',
        name: 'Apex Haulage Logistics Ltd',
        slug: 'apex-haulage-logistics-ltd-4567',
        businessType: 'LOGISTICS',
        country: 'NG',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMembership = {
        id: 'mem-123',
        organizationId: 'org-123',
        userId: 'user-owner-1',
        role: 'OWNER',
        status: 'ACTIVE',
      };

      (prisma.organization.create as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.membership.create as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.subscription.create as jest.Mock).mockResolvedValue({ id: 'sub-123' });
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.securityEvent.create as jest.Mock).mockResolvedValue({});

      const result = await service.createOrganization('user-owner-1', validPayload);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Apex Haulage Logistics Ltd',
            businessType: 'LOGISTICS',
            country: 'NG',
            currency: 'NGN',
            timezone: 'Africa/Lagos',
            status: 'ACTIVE',
          }),
        })
      );
      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-123',
          userId: 'user-owner-1',
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-123',
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-owner-1' },
        data: { onboardingStep: 'BUSINESS_PREFERENCES' },
      });
      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-owner-1',
            eventType: 'ORGANIZATION_CREATED',
          }),
        })
      );
      expect(result.role).toBe('OWNER');
      expect(result.membershipStatus).toBe('ACTIVE');
    });

    it('should reject creation if user is missing or inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createOrganization('invalid-user', validPayload)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should reject unauthenticated caller with empty userId', async () => {
      await expect(service.createOrganization('', validPayload)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('2. Multi-Tenant Listing & Isolation', () => {
    it('should list all organizations where user has non-removed membership', async () => {
      const mockMemberships = [
        {
          id: 'mem-1',
          role: 'OWNER',
          status: 'ACTIVE',
          createdAt: new Date(),
          organization: {
            id: 'org-1',
            name: 'Business One Ltd',
            country: 'NG',
            currency: 'NGN',
            timezone: 'Africa/Lagos',
            status: 'ACTIVE',
          },
        },
        {
          id: 'mem-2',
          role: 'MEMBER',
          status: 'ACTIVE',
          createdAt: new Date(),
          organization: {
            id: 'org-2',
            name: 'Business Two Kenya',
            country: 'KE',
            currency: 'KES',
            timezone: 'Africa/Nairobi',
            status: 'ACTIVE',
          },
        },
      ];

      (prisma.membership.findMany as jest.Mock).mockResolvedValue(mockMemberships);

      const result = await service.getUserOrganizations('user-123');

      expect(result.length).toBe(2);
      expect(result[0].role).toBe('OWNER');
      expect(result[1].role).toBe('MEMBER');
      expect(prisma.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-123',
            status: { not: 'REMOVED' },
          },
        })
      );
    });
  });

  describe('3. Insecure Direct Object Reference (IDOR) Protection', () => {
    it('should allow retrieval if user has ACTIVE membership in organization', async () => {
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-target',
        userId: 'user-legit',
        role: 'OWNER',
        status: 'ACTIVE',
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-target',
        name: 'Target Business',
        country: 'NG',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        status: 'ACTIVE',
      });

      const result = await service.getOrganizationById('user-legit', 'org-target');

      expect(result.id).toBe('org-target');
      expect(result.myMembership.role).toBe('OWNER');
    });

    it('should REJECT and BLOCK access if user does NOT belong to the organization (IDOR Attack)', async () => {
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getOrganizationById('attacker-user-id', 'victim-org-id')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should REJECT and BLOCK access if user membership is SUSPENDED', async () => {
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-target',
        userId: 'suspended-user',
        role: 'MEMBER',
        status: 'SUSPENDED',
      });

      await expect(service.getOrganizationById('suspended-user', 'org-target')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should REJECT and BLOCK access if user membership is REMOVED', async () => {
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-target',
        userId: 'removed-user',
        role: 'MEMBER',
        status: 'REMOVED',
      });

      await expect(service.getOrganizationById('removed-user', 'org-target')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('4. Owner Authorization & Invariant Enforcement', () => {
    it('should allow active OWNER to update organization settings', async () => {
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-1',
        userId: 'owner-1',
        role: 'OWNER',
        status: 'ACTIVE',
      });

      (prisma.organization.update as jest.Mock).mockResolvedValue({
        id: 'org-1',
        name: 'Updated Name Ltd',
      });

      const result = await service.updateOrganization('owner-1', 'org-1', {
        name: 'Updated Name Ltd',
      });

      expect(result.name).toBe('Updated Name Ltd');
    });

    it('should REJECT member from updating organization settings (Owner/Admin required)', async () => {
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-1',
        userId: 'member-1',
        role: 'MEMBER',
        status: 'ACTIVE',
      });

      await expect(
        service.updateOrganization('member-1', 'org-1', { name: 'Hacked Name' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should enforce OWNER INVARIANT: Prevent demoting the last active owner', async () => {
      // Caller is OWNER
      (prisma.membership.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'caller-mem',
          organizationId: 'org-1',
          userId: 'owner-1',
          role: 'OWNER',
          status: 'ACTIVE',
        })
        // Target is the sole OWNER
        .mockResolvedValueOnce({
          id: 'target-mem-1',
          organizationId: 'org-1',
          userId: 'owner-1',
          role: 'OWNER',
          status: 'ACTIVE',
        });

      // Only 1 active owner exists
      (prisma.membership.count as jest.Mock).mockResolvedValue(1);

      await expect(
        service.updateMemberRole('owner-1', 'org-1', 'target-mem-1', UserRole.MEMBER)
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce OWNER INVARIANT: Prevent removing or suspending the last active owner', async () => {
      (prisma.membership.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'caller-mem',
          organizationId: 'org-1',
          userId: 'owner-1',
          role: 'OWNER',
          status: 'ACTIVE',
        })
        .mockResolvedValueOnce({
          id: 'target-mem-1',
          organizationId: 'org-1',
          userId: 'owner-1',
          role: 'OWNER',
          status: 'ACTIVE',
        });

      (prisma.membership.count as jest.Mock).mockResolvedValue(1);

      await expect(
        service.updateMemberStatus('owner-1', 'org-1', 'target-mem-1', MembershipStatus.REMOVED)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Strict Schema Validation Rules', () => {
    it('should accept valid country, currency, IANA timezone, and businessType', () => {
      const valid = {
        name: 'Apex Haulage Logistics',
        businessType: 'LOGISTICS',
        country: 'NG',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
      };

      const result = createOrganizationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid country code', () => {
      const invalidCountry = {
        name: 'Apex Haulage Logistics',
        businessType: 'LOGISTICS',
        country: 'NIGERIA_LONG_TEXT',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
      };

      const result = createOrganizationSchema.safeParse(invalidCountry);
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency code', () => {
      const invalidCurrency = {
        name: 'Apex Haulage Logistics',
        businessType: 'LOGISTICS',
        country: 'NG',
        currency: 'NAIRA', // Must be 3-letter ISO code
        timezone: 'Africa/Lagos',
      };

      const result = createOrganizationSchema.safeParse(invalidCurrency);
      expect(result.success).toBe(false);
    });

    it('should reject non-IANA timezone format', () => {
      const invalidTz = {
        name: 'Apex Haulage Logistics',
        businessType: 'LOGISTICS',
        country: 'NG',
        currency: 'NGN',
        timezone: 'WAT', // Non-canonical display string, must be IANA e.g. Africa/Lagos
      };

      const result = createOrganizationSchema.safeParse(invalidTz);
      expect(result.success).toBe(false);
    });

    it('should reject empty or missing organization name', () => {
      const missingName = {
        name: '   ',
        businessType: 'LOGISTICS',
        country: 'NG',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
      };

      const result = createOrganizationSchema.safeParse(missingName);
      expect(result.success).toBe(false);
    });
  });
});
