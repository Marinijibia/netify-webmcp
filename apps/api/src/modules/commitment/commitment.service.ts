import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  prisma,
  Prisma,
  CommitmentStatus,
  BusinessEventType,
  ActorType,
  EventSource,
} from '@netify/database';
import {
  CreateCommitmentInput,
  CancelCommitmentInput,
  CommitmentQueryInput,
} from '@netify/validation';
import { BusinessEventService } from '../business-event/business-event.service';

@Injectable()
export class CommitmentService {
  constructor(private readonly businessEventService: BusinessEventService) {}

  /**
   * Helper: Get current local calendar date string (YYYY-MM-DD) for an organization's timezone.
   */
  private getLocalBusinessDate(timezone: string = 'Africa/Lagos', date: Date = new Date()): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date); // Returns YYYY-MM-DD
    } catch {
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Record a new Payment Commitment.
   */
  async create(
    organizationId: string,
    createdByUserId: string,
    input: CreateCommitmentInput
  ) {
    // 1. Verify organization exists and retrieve timezone
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // 2. Verify performing user is an active member
    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: createdByUserId,
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

    if (receivable.status === 'CANCELLED') {
      throw new BadRequestException('Cannot create a commitment on a cancelled receivable');
    }

    if (receivable.status === 'PAID') {
      throw new BadRequestException('Cannot create a commitment on a fully paid receivable');
    }

    // 4. Verify customer ownership and alignment
    if (input.customerId && input.customerId !== receivable.customerId) {
      throw new BadRequestException(
        'Customer ID does not match the debtor on this receivable'
      );
    }
    const customerId = receivable.customerId;

    // 5. Currency invariant check
    if (input.currency && input.currency.toUpperCase() !== receivable.currency.toUpperCase()) {
      throw new BadRequestException(
        `Commitment currency (${input.currency}) must match receivable currency (${receivable.currency})`
      );
    }

    // 6. Balance verification
    const totalPaid = receivable.payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Prisma.Decimal(0)
    );
    const remainingBalance = receivable.originalAmount.sub(totalPaid);

    const commAmount = new Prisma.Decimal(input.amount.toString());
    if (commAmount.lte(0)) {
      throw new BadRequestException('Commitment amount must be greater than zero');
    }
    if (commAmount.greaterThan(remainingBalance)) {
      throw new BadRequestException(
        `Commitment amount (${receivable.currency} ${commAmount}) cannot exceed remaining balance (${receivable.currency} ${remainingBalance})`
      );
    }

    // 7. Verify sourceActivity if provided
    if (input.sourceActivityId) {
      const activity = await prisma.collectionActivity.findFirst({
        where: {
          id: input.sourceActivityId,
          organizationId,
          customerId,
          receivableId: receivable.id,
        },
      });
      if (!activity) {
        throw new BadRequestException(
          'Source activity does not exist or does not belong to this customer and receivable'
        );
      }
    }

    return await prisma.$transaction(async (tx) => {
      const commitment = await tx.paymentCommitment.create({
        data: {
          organizationId,
          customerId,
          receivableId: receivable.id,
          createdByUserId,
          amount: commAmount,
          currency: receivable.currency,
          promisedFor: new Date(input.promisedFor),
          status: CommitmentStatus.PENDING,
          sourceActivityId: input.sourceActivityId || null,
          notes: input.notes || null,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
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
          createdByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          sourceActivity: true,
        },
      });

      // Record canonical PAYMENT_COMMITMENT_CREATED Business Event
      await this.businessEventService.recordEvent(tx, {
        organizationId,
        customerId: commitment.customerId,
        receivableId: commitment.receivableId,
        collectionActivityId: commitment.sourceActivityId || null,
        paymentCommitmentId: commitment.id,
        type: BusinessEventType.PAYMENT_COMMITMENT_CREATED,
        occurredAt: commitment.createdAt,
        actorType: ActorType.USER,
        actorUserId: createdByUserId,
        source: EventSource.USER_ACTION,
        data: {
          amount: commitment.amount.toString(),
          currency: commitment.currency,
          promisedFor: commitment.promisedFor.toISOString(),
          sourceActivityId: commitment.sourceActivityId,
        },
        version: 1,
      });

      return this.enrichCommitment(commitment, org.timezone);
    });
  }

  /**
   * List payment commitments with operational timeframe filters.
   */
  async list(organizationId: string, query: CommitmentQueryInput) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.PaymentCommitmentWhereInput = {
      organizationId,
    };

    if (query.receivableId) where.receivableId = query.receivableId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    const [totalCount, items] = await Promise.all([
      prisma.paymentCommitment.count({ where }),
      prisma.paymentCommitment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { promisedFor: 'asc' },
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
          createdByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          sourceActivity: true,
        },
      }),
    ]);

    let enrichedItems = items.map((item) => this.enrichCommitment(item, org.timezone));

    // Timeframe filters
    if (query.timeframe && query.timeframe !== 'ALL') {
      const todayStr = this.getLocalBusinessDate(org.timezone);
      if (query.timeframe === 'TODAY') {
        enrichedItems = enrichedItems.filter((item) => {
          const itemDateStr = this.getLocalBusinessDate(org.timezone, new Date(item.promisedFor));
          return itemDateStr === todayStr && item.status !== CommitmentStatus.CANCELLED;
        });
      } else if (query.timeframe === 'UPCOMING') {
        enrichedItems = enrichedItems.filter((item) => {
          const itemDateStr = this.getLocalBusinessDate(org.timezone, new Date(item.promisedFor));
          return itemDateStr > todayStr && item.status === CommitmentStatus.PENDING;
        });
      } else if (query.timeframe === 'MISSED') {
        enrichedItems = enrichedItems.filter((item) => item.isMissed);
      } else if (query.timeframe === 'FULFILLED') {
        enrichedItems = enrichedItems.filter((item) => item.status === CommitmentStatus.FULFILLED);
      }
    }

    return {
      items: enrichedItems,
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
   * Get single commitment by ID.
   */
  async getById(organizationId: string, id: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const commitment = await prisma.paymentCommitment.findFirst({
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
        createdByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        sourceActivity: true,
      },
    });

    if (!commitment) {
      throw new NotFoundException('Payment commitment not found');
    }

    return this.enrichCommitment(commitment, org.timezone);
  }

  /**
   * Cancel a commitment with reason notes (preserving history).
   */
  async cancel(
    organizationId: string,
    id: string,
    input: CancelCommitmentInput,
    actorUserId?: string | null
  ) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return await prisma.$transaction(async (tx) => {
      const commitment = await tx.paymentCommitment.findFirst({
        where: { id, organizationId },
      });

      if (!commitment) {
        throw new NotFoundException('Payment commitment not found');
      }

      if (commitment.status === CommitmentStatus.FULFILLED) {
        throw new BadRequestException('Cannot cancel an already fulfilled commitment');
      }

      const updated = await tx.paymentCommitment.update({
        where: { id },
        data: {
          status: CommitmentStatus.CANCELLED,
          notes: input.notes
            ? commitment.notes
              ? `${commitment.notes}\n[Cancelled]: ${input.notes}`
              : `[Cancelled]: ${input.notes}`
            : commitment.notes,
        },
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
          createdByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          sourceActivity: true,
        },
      });

      // Record canonical PAYMENT_COMMITMENT_CANCELLED Business Event
      await this.businessEventService.recordEvent(tx, {
        organizationId,
        customerId: updated.customerId,
        receivableId: updated.receivableId,
        paymentCommitmentId: updated.id,
        type: BusinessEventType.PAYMENT_COMMITMENT_CANCELLED,
        occurredAt: new Date(),
        actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
        actorUserId: actorUserId || null,
        source: EventSource.USER_ACTION,
        data: {
          amount: updated.amount.toString(),
          currency: updated.currency,
          reason: input.notes || null,
        },
        version: 1,
      });

      return this.enrichCommitment(updated, org.timezone);
    });
  }

  /**
   * Authoritative Engine: Evaluates and updates commitment fulfillment states against confirmed payments.
   */
  async evaluateCommitmentsForPayment(
    organizationId: string,
    receivableId: string,
    txClient?: Prisma.TransactionClient,
    correlationId?: string | null,
    paymentId?: string | null,
    actorUserId?: string | null
  ) {
    const db = txClient || prisma;

    const org = await db.organization.findUnique({
      where: { id: organizationId },
    });
    const timezone = org?.timezone || 'Africa/Lagos';
    const todayStr = this.getLocalBusinessDate(timezone);

    // 1. Fetch confirmed payments for this receivable
    const confirmedPayments = await db.payment.findMany({
      where: {
        organizationId,
        receivableId,
        status: 'CONFIRMED',
      },
      orderBy: { paidAt: 'asc' },
    });

    const totalConfirmedPaid = confirmedPayments.reduce(
      (sum, p) => sum.add(p.amount),
      new Prisma.Decimal(0)
    );

    // 2. Fetch all non-cancelled commitments for this receivable
    const commitments = await db.paymentCommitment.findMany({
      where: {
        organizationId,
        receivableId,
        status: {
          not: CommitmentStatus.CANCELLED,
        },
      },
      orderBy: { promisedFor: 'asc' },
    });

    // 3. Dynamically evaluate commitment fulfillment from total confirmed payments
    let availablePaid = new Prisma.Decimal(totalConfirmedPaid.toString());

    for (const comm of commitments) {
      let newStatus: CommitmentStatus = CommitmentStatus.PENDING;
      const commPromiseDateStr = this.getLocalBusinessDate(timezone, new Date(comm.promisedFor));
      const isPastPromiseDate = commPromiseDateStr < todayStr;

      if (availablePaid.gte(comm.amount)) {
        newStatus = CommitmentStatus.FULFILLED;
        availablePaid = availablePaid.sub(comm.amount);
      } else if (availablePaid.greaterThan(0)) {
        newStatus = CommitmentStatus.PARTIALLY_FULFILLED;
        availablePaid = new Prisma.Decimal(0);
      } else if (isPastPromiseDate) {
        newStatus = CommitmentStatus.MISSED;
      } else {
        newStatus = CommitmentStatus.PENDING;
      }

      if (comm.status !== newStatus) {
        await db.paymentCommitment.update({
          where: { id: comm.id },
          data: { status: newStatus },
        });

        // Emit corresponding Business Events for state transition
        if (newStatus === CommitmentStatus.FULFILLED) {
          await this.businessEventService.recordEvent(db as any, {
            organizationId,
            customerId: comm.customerId,
            receivableId: comm.receivableId,
            paymentId: paymentId || null,
            paymentCommitmentId: comm.id,
            type: BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
            occurredAt: new Date(),
            actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
            actorUserId: actorUserId || null,
            source: EventSource.PAYMENT_PROCESS,
            data: {
              amount: comm.amount.toString(),
              currency: comm.currency,
              promisedFor: comm.promisedFor.toISOString(),
            },
            correlationId: correlationId || null,
            causationId: paymentId || null,
            version: 1,
          });
        } else if (newStatus === CommitmentStatus.PARTIALLY_FULFILLED) {
          await this.businessEventService.recordEvent(db as any, {
            organizationId,
            customerId: comm.customerId,
            receivableId: comm.receivableId,
            paymentId: paymentId || null,
            paymentCommitmentId: comm.id,
            type: BusinessEventType.PAYMENT_COMMITMENT_PARTIALLY_FULFILLED,
            occurredAt: new Date(),
            actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
            actorUserId: actorUserId || null,
            source: EventSource.PAYMENT_PROCESS,
            data: {
              amount: comm.amount.toString(),
              currency: comm.currency,
              promisedFor: comm.promisedFor.toISOString(),
            },
            correlationId: correlationId || null,
            causationId: paymentId || null,
            version: 1,
          });
        } else if (newStatus === CommitmentStatus.MISSED) {
          await this.businessEventService.recordEvent(db as any, {
            organizationId,
            customerId: comm.customerId,
            receivableId: comm.receivableId,
            paymentCommitmentId: comm.id,
            type: BusinessEventType.PAYMENT_COMMITMENT_MISSED,
            occurredAt: new Date(comm.promisedFor),
            actorType: ActorType.SYSTEM,
            actorUserId: null,
            source: EventSource.SCHEDULED_PROCESS,
            data: {
              amount: comm.amount.toString(),
              currency: comm.currency,
              promisedFor: comm.promisedFor.toISOString(),
            },
            version: 1,
          });
        }
      }
    }
  }

  /**
   * Helper: Enrich commitment model with derived status and stringified decimals.
   */
  private enrichCommitment(commitment: any, timezone: string = 'Africa/Lagos') {
    const todayStr = this.getLocalBusinessDate(timezone);
    const promisedStr = this.getLocalBusinessDate(timezone, new Date(commitment.promisedFor));
    const isPastPromiseDate = promisedStr < todayStr;

    const isMissed =
      commitment.status === CommitmentStatus.MISSED ||
      (isPastPromiseDate &&
        (commitment.status === CommitmentStatus.PENDING ||
          commitment.status === CommitmentStatus.PARTIALLY_FULFILLED));

    let daysOverdue = 0;
    if (isPastPromiseDate && commitment.status !== CommitmentStatus.FULFILLED && commitment.status !== CommitmentStatus.CANCELLED) {
      const diffMs = new Date(todayStr).getTime() - new Date(promisedStr).getTime();
      daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      ...commitment,
      amount: commitment.amount.toString(),
      isMissed,
      daysOverdue,
      receivable: commitment.receivable
        ? {
            ...commitment.receivable,
            originalAmount: commitment.receivable.originalAmount.toString(),
          }
        : undefined,
    };
  }
}
