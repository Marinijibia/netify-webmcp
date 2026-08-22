import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, Prisma } from '@netify/database';
import {
  ActivityType,
  CollectionChannel,
  ActivityOutcome,
  CommitmentStatus,
} from '@netify/types';
import {
  CreateCollectionActivityInput,
  ActivityQueryInput,
} from '@netify/validation';

@Injectable()
export class CollectionActivityService {
  /**
   * Record a collection activity with optional inline payment commitment.
   */
  async create(
    organizationId: string,
    performedByUserId: string,
    input: CreateCollectionActivityInput
  ) {
    // 1. Verify organization exists and retrieve business timezone
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // 2. Verify performing user is a valid member of the organization
    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: performedByUserId,
        },
      },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new BadRequestException('User is not an active member of this organization');
    }

    // 3. Verify receivable belongs to this organization
    const receivable = await prisma.receivable.findFirst({
      where: {
        id: input.receivableId,
        organizationId,
      },
      include: {
        payments: {
          where: { status: 'CONFIRMED' },
        },
      },
    });
    if (!receivable) {
      throw new NotFoundException('Receivable not found in this organization');
    }

    // 4. Verify customer ownership and consistency with receivable
    if (input.customerId && input.customerId !== receivable.customerId) {
      throw new BadRequestException(
        'Customer ID does not match the debtor on this receivable'
      );
    }
    const customerId = receivable.customerId;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    // 5. If inline commitment is provided, validate amount against remaining balance
    let commitmentData: {
      amount: Prisma.Decimal;
      currency: string;
      promisedFor: Date;
      notes?: string | null;
    } | null = null;

    if (input.commitment) {
      const totalPaid = receivable.payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0)
      );
      const remainingBalance = receivable.originalAmount.sub(totalPaid);

      const commAmount = new Prisma.Decimal(input.commitment.amount.toString());
      if (commAmount.lte(0)) {
        throw new BadRequestException('Commitment amount must be greater than zero');
      }
      if (commAmount.greaterThan(remainingBalance)) {
        throw new BadRequestException(
          `Commitment amount (${receivable.currency} ${commAmount}) cannot exceed outstanding receivable balance (${receivable.currency} ${remainingBalance})`
        );
      }

      commitmentData = {
        amount: commAmount,
        currency: receivable.currency,
        promisedFor: new Date(input.commitment.promisedFor),
        notes: input.commitment.notes,
      };
    }

    // 6. Execute atomic transaction to save Activity and optional Commitment
    return await prisma.$transaction(async (tx) => {
      const activity = await tx.collectionActivity.create({
        data: {
          organizationId,
          customerId,
          receivableId: receivable.id,
          performedByUserId,
          type: input.type,
          channel: input.channel,
          outcome: input.outcome,
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
          notes: input.notes,
        },
      });

      let createdCommitment: any = null;
      if (commitmentData) {
        createdCommitment = await tx.paymentCommitment.create({
          data: {
            organizationId,
            customerId,
            receivableId: receivable.id,
            createdByUserId: performedByUserId,
            amount: commitmentData.amount,
            currency: commitmentData.currency,
            promisedFor: commitmentData.promisedFor,
            status: CommitmentStatus.PENDING,
            sourceActivityId: activity.id,
            notes: commitmentData.notes,
          },
        });
      }

      return {
        ...activity,
        commitments: createdCommitment
          ? [
              {
                ...createdCommitment,
                amount: createdCommitment.amount.toString(),
              },
            ]
          : [],
      };
    });
  }

  /**
   * List collection activities with multi-field search and pagination.
   */
  async list(organizationId: string, query: ActivityQueryInput) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CollectionActivityWhereInput = {
      organizationId,
    };

    if (query.receivableId) where.receivableId = query.receivableId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.type) where.type = query.type;
    if (query.channel) where.channel = query.channel;
    if (query.outcome) where.outcome = query.outcome;
    if (query.performedByUserId) where.performedByUserId = query.performedByUserId;

    const [totalCount, items] = await Promise.all([
      prisma.collectionActivity.count({ where }),
      prisma.collectionActivity.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { occurredAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          receivable: {
            select: {
              id: true,
              reference: true,
              description: true,
              originalAmount: true,
              currency: true,
              status: true,
            },
          },
          performedByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          commitments: true,
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        receivable: item.receivable
          ? {
              ...item.receivable,
              originalAmount: item.receivable.originalAmount.toString(),
            }
          : undefined,
        commitments: (item.commitments || []).map((c) => ({
          ...c,
          amount: c.amount.toString(),
        })),
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
    };
  }

  /**
   * Get single collection activity by ID with strict IDOR protection.
   */
  async getById(organizationId: string, id: string) {
    const activity = await prisma.collectionActivity.findFirst({
      where: { id, organizationId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        receivable: {
          select: {
            id: true,
            reference: true,
            description: true,
            originalAmount: true,
            currency: true,
            status: true,
          },
        },
        performedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        commitments: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Collection activity not found');
    }

    return {
      ...activity,
      receivable: activity.receivable
        ? {
            ...activity.receivable,
            originalAmount: activity.receivable.originalAmount.toString(),
          }
        : undefined,
      commitments: (activity.commitments || []).map((c) => ({
        ...c,
        amount: c.amount.toString(),
      })),
    };
  }
}
