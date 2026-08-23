import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  prisma,
  Prisma,
  ReceivableSource,
  ReceivableStatus,
  BusinessEventType,
  ActorType,
  EventSource,
} from '@netify/database';
import {
  CreateReceivableInput,
  UpdateReceivableInput,
  ReceivableQueryInput,
} from '@netify/validation';
import { BusinessEventService } from '../business-event/business-event.service';

export function isPastDueDate(dueDate: Date | string, timezone: string = 'UTC'): boolean {
  try {
    const due = new Date(dueDate);
    const now = new Date();

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const dueStr = formatter.format(due);
    const nowStr = formatter.format(now);

    const [dMonth, dDay, dYear] = dueStr.split('/').map(Number);
    const [nMonth, nDay, nYear] = nowStr.split('/').map(Number);

    const dueNum = dYear * 10000 + dMonth * 100 + dDay;
    const nowNum = nYear * 10000 + nMonth * 100 + nDay;

    return nowNum > dueNum;
  } catch {
    return new Date().getTime() > new Date(dueDate).getTime();
  }
}

export function getDaysOverdue(dueDate: Date | string, timezone: string = 'UTC'): number {
  if (!isPastDueDate(dueDate, timezone)) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

@Injectable()
export class ReceivableService {
  constructor(private readonly businessEventService: BusinessEventService) {}

  /**
   * Derive authoritative financial balance, overdue status, and days overdue.
   */
  private deriveFinancialState(
    receivable: any,
    confirmedPayments: any[],
    orgTimezone: string = 'Africa/Lagos'
  ) {
    const originalAmount = new Prisma.Decimal(receivable.originalAmount);
    const amountPaid = confirmedPayments.reduce(
      (acc, p) => acc.add(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0)
    );
    const balance = originalAmount.sub(amountPaid);

    const overdue =
      balance.greaterThan(0) &&
      receivable.status !== ReceivableStatus.CANCELLED &&
      isPastDueDate(receivable.dueDate, orgTimezone);

    const daysOverdue = overdue
      ? getDaysOverdue(receivable.dueDate, orgTimezone)
      : 0;

    return {
      ...receivable,
      originalAmount: originalAmount.toString(),
      amountPaid: amountPaid.toString(),
      balance: balance.toString(),
      isOverdue: overdue,
      daysOverdue,
    };
  }

  async create(
    organizationId: string,
    input: CreateReceivableInput,
    actorUserId?: string | null
  ) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, currency: true, timezone: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (input.currency && input.currency.toUpperCase() !== org.currency.toUpperCase()) {
      throw new BadRequestException(
        `Receivable currency (${input.currency}) must match organization currency (${org.currency})`
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const numAmount = typeof input.amount === 'number' ? input.amount : parseFloat(input.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Receivable amount must be greater than zero');
    }

    const decimalAmount = new Prisma.Decimal(numAmount.toFixed(2));

    const receivable = await prisma.$transaction(async (tx) => {
      const rec = await tx.receivable.create({
        data: {
          organizationId,
          customerId: input.customerId,
          reference: input.reference?.trim() || null,
          description: input.description?.trim() || null,
          originalAmount: decimalAmount,
          currency: org.currency,
          issuedAt: input.issuedAt ? new Date(input.issuedAt) : new Date(),
          dueDate: new Date(input.dueDate),
          source: input.source || ReceivableSource.MANUAL,
          status: ReceivableStatus.OPEN,
          notes: input.notes?.trim() || null,
        },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      });

      // Record canonical RECEIVABLE_CREATED Business Event within same transaction
      await this.businessEventService.recordEvent(tx, {
        organizationId,
        customerId: rec.customerId,
        receivableId: rec.id,
        type: BusinessEventType.RECEIVABLE_CREATED,
        occurredAt: rec.issuedAt,
        actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
        actorUserId: actorUserId || null,
        source: EventSource.USER_ACTION,
        data: {
          reference: rec.reference,
          description: rec.description,
          originalAmount: rec.originalAmount.toString(),
          currency: rec.currency,
          dueDate: rec.dueDate.toISOString(),
        },
        version: 1,
      });

      return rec;
    });

    return this.deriveFinancialState(receivable, [], org.timezone);
  }

  async list(organizationId: string, query: ReceivableQueryInput) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true },
    });
    const timezone = org?.timezone || 'Africa/Lagos';

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReceivableWhereInput = { organizationId };

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const search = query.search.trim();
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [totalCount, items] = await Promise.all([
      prisma.receivable.count({ where }),
      prisma.receivable.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          payments: {
            where: { status: 'CONFIRMED' },
            select: { id: true, amount: true, status: true, paidAt: true },
          },
        },
      }),
    ]);

    let formatted = items.map((r) =>
      this.deriveFinancialState(r, r.payments || [], timezone)
    );

    if (query.isOverdue !== undefined) {
      formatted = formatted.filter((r) => r.isOverdue === query.isOverdue);
    }

    return {
      items: formatted,
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
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true },
    });
    const timezone = org?.timezone || 'Africa/Lagos';

    const receivable = await prisma.receivable.findFirst({
      where: { id, organizationId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            status: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!receivable) {
      throw new NotFoundException('Receivable not found');
    }

    const confirmedPayments = (receivable.payments || []).filter(
      (p) => p.status === 'CONFIRMED'
    );

    return this.deriveFinancialState(receivable, confirmedPayments, timezone);
  }

  async update(organizationId: string, id: string, input: UpdateReceivableInput) {
    const existing = await prisma.receivable.findFirst({
      where: { id, organizationId },
      include: {
        payments: { where: { status: 'CONFIRMED' } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Receivable not found');
    }

    if (existing.status === ReceivableStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled receivable');
    }

    const updateData: Prisma.ReceivableUpdateInput = {};
    if (input.dueDate) updateData.dueDate = new Date(input.dueDate);
    if (input.description !== undefined)
      updateData.description = input.description?.trim() || null;
    if (input.reference !== undefined)
      updateData.reference = input.reference?.trim() || null;
    if (input.notes !== undefined)
      updateData.notes = input.notes?.trim() || null;

    const updated = await prisma.receivable.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        payments: { where: { status: 'CONFIRMED' } },
      },
    });

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true },
    });

    return this.deriveFinancialState(updated, updated.payments || [], org?.timezone || 'Africa/Lagos');
  }

  async cancel(organizationId: string, id: string, actorUserId?: string | null) {
    return prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findFirst({
        where: { id, organizationId },
      });

      if (!receivable) {
        throw new NotFoundException('Receivable not found');
      }

      if (receivable.status === ReceivableStatus.CANCELLED) {
        return receivable;
      }

      const confirmedPayments = await tx.payment.findMany({
        where: { receivableId: id, status: 'CONFIRMED' },
      });

      if (confirmedPayments.length > 0) {
        throw new BadRequestException(
          'Cannot cancel a receivable that has confirmed payments. Reverse payments first.'
        );
      }

      const cancelled = await tx.receivable.update({
        where: { id },
        data: { status: ReceivableStatus.CANCELLED },
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
        },
      });

      // Record canonical RECEIVABLE_CANCELLED Business Event
      await this.businessEventService.recordEvent(tx, {
        organizationId,
        customerId: cancelled.customerId,
        receivableId: cancelled.id,
        type: BusinessEventType.RECEIVABLE_CANCELLED,
        occurredAt: new Date(),
        actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
        actorUserId: actorUserId || null,
        source: EventSource.USER_ACTION,
        data: {
          reference: cancelled.reference,
          originalAmount: cancelled.originalAmount.toString(),
          currency: cancelled.currency,
        },
        version: 1,
      });

      return {
        ...cancelled,
        originalAmount: cancelled.originalAmount.toString(),
        amountPaid: '0.00',
        balance: '0.00',
        isOverdue: false,
        daysOverdue: 0,
      };
    });
  }
}
