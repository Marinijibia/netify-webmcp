import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, CommitmentStatus, BusinessEventType } from '@netify/database';
import {
  CreateCommitmentInput,
  UpdateCommitmentStatusInput,
  CommitmentQueryInput,
} from '@netify/validation';

@Injectable()
export class CommitmentService {
  async list(organizationId: string, query: CommitmentQueryInput) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId };

    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    if (query.dueThisWeek) {
      const now = new Date();
      const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.promisedDate = {
        gte: now,
        lte: endOfWeek,
      };
      where.status = CommitmentStatus.PENDING;
    }

    const [totalCount, commitments] = await Promise.all([
      prisma.commitment.count({ where }),
      prisma.commitment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { promisedDate: 'asc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          invoice: { select: { id: true, invoiceNumber: true, balance: true } },
        },
      }),
    ]);

    return {
      items: commitments,
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
    const commitment = await prisma.commitment.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        invoice: true,
      },
    });

    if (!commitment) {
      throw new NotFoundException('Commitment not found');
    }

    return commitment;
  }

  async create(organizationId: string, input: CreateCommitmentInput) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const commitment = await prisma.commitment.create({
      data: {
        organizationId,
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: input.currency || customer.currency || 'NGN',
        promisedDate: input.promisedDate,
        description: input.description,
        source: input.source,
        sourceReference: input.sourceReference,
        confidence: input.confidence,
        status: input.status,
        evidenceId: input.evidenceId,
      },
    });

    // Record business event
    await prisma.businessEvent.create({
      data: {
        organizationId,
        customerId: input.customerId,
        eventType: BusinessEventType.COMMITMENT_CREATED,
        summary: `Commitment: ${customer.name} promised ${commitment.currency} ${commitment.amount.toLocaleString()} on ${new Date(commitment.promisedDate).toLocaleDateString()}`,
        payload: {
          commitmentId: commitment.id,
          amount: commitment.amount,
          promisedDate: commitment.promisedDate,
          source: commitment.source,
        },
      },
    });

    return commitment;
  }

  async updateStatus(organizationId: string, id: string, input: UpdateCommitmentStatusInput) {
    const existing = await this.getById(organizationId, id);

    const updated = await prisma.commitment.update({
      where: { id },
      data: { status: input.status },
    });

    // Log state change event
    let eventType: BusinessEventType = BusinessEventType.COMMITMENT_CREATED;
    if (input.status === CommitmentStatus.FULFILLED) {
      eventType = BusinessEventType.COMMITMENT_FULFILLED;
    } else if (input.status === CommitmentStatus.MISSED) {
      eventType = BusinessEventType.COMMITMENT_MISSED;
    }

    await prisma.businessEvent.create({
      data: {
        organizationId,
        customerId: existing.customerId,
        eventType,
        summary: `Commitment status updated to ${input.status} for ${existing.customer?.name}`,
        payload: { commitmentId: id, status: input.status, notes: input.notes },
      },
    });

    return updated;
  }

  /**
   * Evaluates pending commitments and marks overdue ones as MISSED.
   */
  async evaluatePendingCommitments(organizationId: string) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const missed = await prisma.commitment.updateMany({
      where: {
        organizationId,
        status: CommitmentStatus.PENDING,
        promisedDate: { lt: yesterday },
      },
      data: {
        status: CommitmentStatus.MISSED,
      },
    });

    return missed;
  }
}
