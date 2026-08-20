import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@netify/database';

@Injectable()
export class OrganizationService {
  async getOrganizationById(organizationId: string) {
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
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async updateSettings(organizationId: string, settings: Record<string, any>) {
    return prisma.organization.update({
      where: { id: organizationId },
      data: { settings },
    });
  }

  async getMembers(organizationId: string) {
    return prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
