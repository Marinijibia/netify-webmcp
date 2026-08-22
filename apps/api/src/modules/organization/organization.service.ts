import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '@netify/validation';

@Injectable()
export class OrganizationService {
  /**
   * Atomically creates an Organization, its initial OWNER membership,
   * a default FREE subscription, and advances user onboarding.
   */
  async createOrganization(userId: string, input: CreateOrganizationInput) {
    if (!userId) {
      throw new BadRequestException('Authenticated user ID is required');
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new ForbiddenException('User account is not active or does not exist');
    }

    const trimmedName = input.name.trim();
    const slug =
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.floor(1000 + Math.random() * 9000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization with explicit fields
      const org = await tx.organization.create({
        data: {
          name: trimmedName,
          slug,
          businessType: input.businessType.trim(),
          currency: input.currency.trim().toUpperCase(),
          country: input.country.trim().toUpperCase(),
          timezone: input.timezone.trim(),
          status: OrganizationStatus.ACTIVE,
        },
      });

      // 2. Create OWNER Membership
      const membership = await tx.membership.create({
        data: {
          organizationId: org.id,
          userId,
          role: UserRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      // 3. Create initial Subscription
      await tx.subscription.create({
        data: {
          organizationId: org.id,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // 4. Advance user onboarding step
      await tx.user.update({
        where: { id: userId },
        data: {
          onboardingStep: 'BUSINESS_PREFERENCES',
        },
      });

      // 5. Record Security Audit Event
      await tx.securityEvent.create({
        data: {
          userId,
          eventType: SecurityEventType.ORGANIZATION_CREATED,
          metadata: {
            organizationId: org.id,
            name: org.name,
            country: org.country,
            currency: org.currency,
            timezone: org.timezone,
            businessType: org.businessType,
          },
        },
      });

      return { org, membership };
    });

    return {
      ...result.org,
      role: result.membership.role,
      membershipStatus: result.membership.status,
    };
  }

  /**
   * Retrieves all organizations where the user has non-removed membership.
   */
  async getUserOrganizations(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        status: {
          not: MembershipStatus.REMOVED,
        },
      },
      include: {
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      membershipStatus: m.status,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Retrieves organization by ID with IDOR protection.
   * Ensures the calling user has ACTIVE membership.
   */
  async getOrganizationById(userId: string, organizationId: string) {
    if (!userId || !organizationId) {
      throw new BadRequestException('User ID and Organization ID are required');
    }

    // Verify active membership (IDOR Prevention)
    const membership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not belong to this organization.');
    }

    if (membership.status === MembershipStatus.SUSPENDED) {
      throw new ForbiddenException('Your membership in this organization is suspended.');
    }

    if (membership.status === MembershipStatus.REMOVED) {
      throw new ForbiddenException('Your membership in this organization has been removed.');
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: true,
        entitlements: true,
        _count: {
          select: {
            customers: true,
            invoices: true,
            commitments: true,
            memberships: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return {
      ...org,
      myMembership: {
        role: membership.role,
        status: membership.status,
      },
    };
  }

  /**
   * Updates organization settings. Restricts access to active OWNER or ADMIN.
   */
  async updateOrganization(userId: string, organizationId: string, input: UpdateOrganizationInput) {
    if (!userId || !organizationId) {
      throw new BadRequestException('User ID and Organization ID are required');
    }

    const membership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Active membership required to update organization.');
    }

    if (membership.role !== UserRole.OWNER && membership.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only workspace owners or administrators can modify organization settings.');
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.businessType !== undefined) updateData.businessType = input.businessType.trim();
    if (input.timezone !== undefined) updateData.timezone = input.timezone.trim();
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
    if (input.settings !== undefined) updateData.settings = input.settings;

    return prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });
  }

  /**
   * Lists all active or invited members of an organization. IDOR protected.
   */
  async getMembers(userId: string, organizationId: string) {
    if (!userId || !organizationId) {
      throw new BadRequestException('User ID and Organization ID are required');
    }

    const myMembership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!myMembership) {
      throw new ForbiddenException('Active membership required to view organization members.');
    }

    const members = await prisma.membership.findMany({
      where: {
        organizationId,
        status: {
          not: MembershipStatus.REMOVED,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      status: m.status,
      user: m.user,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  /**
   * Updates a member's role. Owner-only operation with Owner Invariant check.
   */
  async updateMemberRole(
    callerUserId: string,
    organizationId: string,
    targetMemberId: string,
    newRole: UserRole
  ) {
    const callerMembership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId: callerUserId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!callerMembership || callerMembership.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only workspace owners can change member roles.');
    }

    const targetMembership = await prisma.membership.findFirst({
      where: {
        id: targetMemberId,
        organizationId,
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member record not found in this organization.');
    }

    // Owner Invariant: Check if demoting the last active OWNER
    if (targetMembership.role === UserRole.OWNER && newRole !== UserRole.OWNER) {
      const activeOwnerCount = await prisma.membership.count({
        where: {
          organizationId,
          role: UserRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (activeOwnerCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last active owner. An organization must always have at least one owner.'
        );
      }
    }

    return prisma.membership.update({
      where: { id: targetMemberId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Updates a member's status (e.g. SUSPENDED, REMOVED, ACTIVE).
   * Owner-only operation with Owner Invariant check.
   */
  async updateMemberStatus(
    callerUserId: string,
    organizationId: string,
    targetMemberId: string,
    newStatus: MembershipStatus
  ) {
    const callerMembership = await prisma.membership.findFirst({
      where: {
        organizationId,
        userId: callerUserId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!callerMembership || callerMembership.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only workspace owners can change member status.');
    }

    const targetMembership = await prisma.membership.findFirst({
      where: {
        id: targetMemberId,
        organizationId,
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member record not found in this organization.');
    }

    // Owner Invariant: Check if removing or suspending the last active OWNER
    if (
      targetMembership.role === UserRole.OWNER &&
      (newStatus === MembershipStatus.SUSPENDED || newStatus === MembershipStatus.REMOVED)
    ) {
      const activeOwnerCount = await prisma.membership.count({
        where: {
          organizationId,
          role: UserRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (activeOwnerCount <= 1) {
        throw new BadRequestException(
          'Cannot suspend or remove the last active owner. An organization must always have at least one active owner.'
        );
      }
    }

    return prisma.membership.update({
      where: { id: targetMemberId },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
