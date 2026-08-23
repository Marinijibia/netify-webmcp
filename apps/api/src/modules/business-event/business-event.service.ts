import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  prisma,
  Prisma,
  BusinessEventType,
  ActorType,
  EventSource,
} from '@netify/database';
import {
  BusinessEventQueryInput,
  CustomerTimelineQueryInput,
  ReceivableTimelineQueryInput,
} from '@netify/validation';

export interface RecordBusinessEventParams {
  organizationId: string;
  customerId?: string | null;
  receivableId?: string | null;
  paymentId?: string | null;
  collectionActivityId?: string | null;
  paymentCommitmentId?: string | null;
  type: BusinessEventType;
  occurredAt?: Date | string;
  actorType?: ActorType;
  actorUserId?: string | null;
  source?: EventSource;
  data?: Record<string, any>;
  version?: number;
  correlationId?: string | null;
  causationId?: string | null;
}

@Injectable()
export class BusinessEventService {
  /**
   * Sanitizes payload by stripping sensitive keys and unbounded blobs.
   */
  private sanitizePayload(data?: Record<string, any>): Record<string, any> {
    if (!data) return {};
    const sanitized: Record<string, any> = {};
    const FORBIDDEN_KEYS = new Set([
      'password',
      'passwordhash',
      'token',
      'accesstoken',
      'refreshtoken',
      'secret',
      'apikey',
      'creditcard',
      'cardnumber',
      'cvv',
      'pin',
    ]);

    for (const [key, value] of Object.entries(data)) {
      if (!FORBIDDEN_KEYS.has(key.toLowerCase())) {
        if (value !== undefined) {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }

  /**
   * Atomically records an immutable Business Event within an active transaction client.
   */
  async recordEvent(
    tx: Prisma.TransactionClient,
    params: RecordBusinessEventParams
  ) {
    if (!params.organizationId) {
      throw new BadRequestException('organizationId is required to record a business event');
    }
    if (!params.type) {
      throw new BadRequestException('Event type is required');
    }

    const occurredAt = params.occurredAt
      ? new Date(params.occurredAt)
      : new Date();

    const sanitizedData = this.sanitizePayload(params.data);

    return tx.businessEvent.create({
      data: {
        organizationId: params.organizationId,
        customerId: params.customerId || null,
        receivableId: params.receivableId || null,
        paymentId: params.paymentId || null,
        collectionActivityId: params.collectionActivityId || null,
        paymentCommitmentId: params.paymentCommitmentId || null,
        type: params.type,
        occurredAt,
        recordedAt: new Date(),
        actorType: params.actorType || ActorType.USER,
        actorUserId: params.actorUserId || null,
        source: params.source || EventSource.USER_ACTION,
        data: sanitizedData,
        version: params.version || 1,
        correlationId: params.correlationId || null,
        causationId: params.causationId || null,
      },
    });
  }

  /**
   * Standalone helper to record an event outside an existing transaction.
   */
  async recordStandalone(params: RecordBusinessEventParams) {
    return prisma.$transaction(async (tx) => {
      return this.recordEvent(tx, params);
    });
  }

  /**
   * Organization-wide paginated chronological Business Event stream with filtering.
   */
  async listOrganizationEvents(
    organizationId: string,
    query: BusinessEventQueryInput
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.BusinessEventWhereInput = {
      organizationId,
    };

    if (query.customerId) {
      where.customerId = query.customerId;
    }
    if (query.receivableId) {
      where.receivableId = query.receivableId;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.actorType) {
      where.actorType = query.actorType;
    }
    if (query.source) {
      where.source = query.source;
    }

    if (query.startDate || query.endDate) {
      where.occurredAt = {};
      if (query.startDate) {
        where.occurredAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.occurredAt.lte = new Date(query.endDate);
      }
    }

    const [totalCount, items] = await Promise.all([
      prisma.businessEvent.count({ where }),
      prisma.businessEvent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { occurredAt: 'desc' },
          { recordedAt: 'desc' },
          { id: 'desc' },
        ],
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
          actorUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      items,
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
   * Retrieves the full chronological evidence stream for a specific Customer.
   */
  async getCustomerTimeline(
    organizationId: string,
    customerId: string,
    query: CustomerTimelineQueryInput
  ) {
    if (!organizationId || !customerId) {
      throw new BadRequestException('Organization ID and Customer ID are required');
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId },
      select: { id: true, name: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.BusinessEventWhereInput = {
      organizationId,
      customerId,
    };

    const [totalCount, items] = await Promise.all([
      prisma.businessEvent.count({ where }),
      prisma.businessEvent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { occurredAt: 'desc' },
          { recordedAt: 'desc' },
          { id: 'desc' },
        ],
        include: {
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
          actorUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      customer,
      items,
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
   * Retrieves the full chronological case history for a specific Receivable.
   */
  async getReceivableTimeline(
    organizationId: string,
    receivableId: string,
    query: ReceivableTimelineQueryInput
  ) {
    if (!organizationId || !receivableId) {
      throw new BadRequestException('Organization ID and Receivable ID are required');
    }

    const receivable = await prisma.receivable.findFirst({
      where: { id: receivableId, organizationId },
      select: {
        id: true,
        reference: true,
        description: true,
        originalAmount: true,
        currency: true,
        status: true,
        customerId: true,
        customer: {
          select: { id: true, name: true },
        },
      },
    });

    if (!receivable) {
      throw new NotFoundException('Receivable not found in this organization');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.BusinessEventWhereInput = {
      organizationId,
      receivableId,
    };

    const [totalCount, items] = await Promise.all([
      prisma.businessEvent.count({ where }),
      prisma.businessEvent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { occurredAt: 'desc' },
          { recordedAt: 'desc' },
          { id: 'desc' },
        ],
        include: {
          customer: {
            select: { id: true, name: true },
          },
          actorUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      receivable,
      items,
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
   * Retrieves a single Business Event with strict organization isolation.
   */
  async getEventById(organizationId: string, id: string) {
    if (!organizationId || !id) {
      throw new BadRequestException('Organization ID and Event ID are required');
    }

    const event = await prisma.businessEvent.findFirst({
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
        payment: true,
        collectionActivity: true,
        paymentCommitment: true,
        actorUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Business event not found in this organization');
    }

    return event;
  }
}
