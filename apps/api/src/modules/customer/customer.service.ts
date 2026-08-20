import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, BusinessEventType } from '@netify/database';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
} from '@netify/validation';

@Injectable()
export class CustomerService {
  async list(organizationId: string, query: CustomerQueryInput) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [totalCount, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          riskAssessments: {
            take: 1,
            orderBy: { evaluatedAt: 'desc' },
          },
          invoices: {
            select: {
              id: true,
              total: true,
              paidAmount: true,
              balance: true,
              status: true,
              dueDate: true,
            },
          },
          commitments: {
            where: { status: 'PENDING' },
            select: {
              id: true,
              amount: true,
              promisedDate: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Enhance with deterministic financial calculations
    const data = customers.map((c) => {
      const totalOutstanding = c.invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
      const totalPaid = c.invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
      const overdueInvoicesCount = c.invoices.filter((inv) => inv.status === 'OVERDUE').length;
      const latestRisk = c.riskAssessments[0] || null;

      return {
        ...c,
        totalOutstanding,
        totalPaid,
        overdueInvoicesCount,
        activeCommitmentsCount: c.commitments.length,
        latestRiskAssessment: latestRisk,
      };
    });

    return {
      items: data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
    };
  }

  async getById(organizationId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        invoices: {
          orderBy: { dueDate: 'desc' },
          include: { items: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        commitments: {
          orderBy: { promisedDate: 'desc' },
        },
        conversations: {
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
            },
          },
        },
        riskAssessments: {
          take: 1,
          orderBy: { evaluatedAt: 'desc' },
        },
        aiActions: {
          orderBy: { createdAt: 'desc' },
        },
        businessEvents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const totalOutstanding = customer.invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
    const totalPaid = customer.invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const overdueInvoicesCount = customer.invoices.filter((inv) => inv.status === 'OVERDUE').length;

    return {
      ...customer,
      totalOutstanding,
      totalPaid,
      overdueInvoicesCount,
      activeCommitmentsCount: customer.commitments.filter((c) => c.status === 'PENDING').length,
      latestRiskAssessment: customer.riskAssessments[0] || null,
    };
  }

  async create(organizationId: string, input: CreateCustomerInput) {
    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name: input.name,
        phone: input.phone,
        email: input.email || undefined,
        address: input.address,
        country: input.country || 'Nigeria',
        currency: input.currency || 'NGN',
        status: input.status,
        notes: input.notes,
        tags: input.tags || [],
        metadata: input.metadata || {},
      },
    });

    // Record business event
    await prisma.businessEvent.create({
      data: {
        organizationId,
        customerId: customer.id,
        eventType: BusinessEventType.CUSTOMER_CREATED,
        summary: `Customer created: ${customer.name}`,
        payload: { customerId: customer.id, name: customer.name },
      },
    });

    return customer;
  }

  async update(organizationId: string, id: string, input: UpdateCustomerInput) {
    await this.getById(organizationId, id);

    return prisma.customer.update({
      where: { id },
      data: {
        ...input,
        email: input.email || undefined,
      },
    });
  }

  async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);
    return prisma.customer.delete({ where: { id } });
  }
}
