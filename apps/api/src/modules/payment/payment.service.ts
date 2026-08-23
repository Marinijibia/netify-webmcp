import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  prisma,
  Prisma,
  PaymentStatus,
  ReceivableStatus,
  BusinessEventType,
  ActorType,
  EventSource,
} from '@netify/database';
import { CreatePaymentInput, PaymentQueryInput } from '@netify/validation';
import { CommitmentService } from '../commitment/commitment.service';
import { BusinessEventService } from '../business-event/business-event.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly commitmentService: CommitmentService,
    private readonly businessEventService: BusinessEventService
  ) {}

  async recordPayment(
    organizationId: string,
    input: CreatePaymentInput,
    actorUserId?: string | null
  ) {
    if (!input.receivableId) {
      throw new BadRequestException('receivableId is required');
    }

    const numAmount = typeof input.amount === 'number' ? input.amount : parseFloat(input.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
    const paymentAmount = new Prisma.Decimal(numAmount.toFixed(2));

    return prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      if (input.idempotencyKey && input.idempotencyKey.trim()) {
        const existingPayment = await tx.payment.findUnique({
          where: { idempotencyKey: input.idempotencyKey.trim() },
          include: {
            customer: { select: { id: true, name: true } },
            receivable: { select: { id: true, reference: true, currency: true } },
          },
        });

        if (existingPayment) {
          if (existingPayment.organizationId !== organizationId) {
            throw new BadRequestException('Idempotency key collision across organizations');
          }
          return {
            ...existingPayment,
            amount: existingPayment.amount.toString(),
            isDuplicate: true,
          };
        }
      }

      // 2. Fetch & Row-Lock the Receivable for strict concurrency protection
      const rawReceivables = await tx.$queryRaw<any[]>`
        SELECT * FROM receivables 
        WHERE id = ${input.receivableId} AND "organizationId" = ${organizationId}
        FOR UPDATE
      `;

      if (!rawReceivables || rawReceivables.length === 0) {
        throw new NotFoundException('Receivable not found in this organization');
      }

      const receivable = rawReceivables[0];

      // 3. Invariant: Cannot record payment on Cancelled Receivable
      if (receivable.status === ReceivableStatus.CANCELLED) {
        throw new BadRequestException('Cannot record payment for a cancelled receivable');
      }

      // 4. Invariant: Payment Customer must match Receivable Customer
      if (input.customerId && input.customerId !== receivable.customerId) {
        throw new BadRequestException('Payment customer does not match receivable customer');
      }

      // 5. Invariant: Currency must match Receivable Currency
      if (input.currency && input.currency.toUpperCase() !== receivable.currency.toUpperCase()) {
        throw new BadRequestException(
          `Payment currency (${input.currency}) must match receivable currency (${receivable.currency})`
        );
      }

      // 6. Calculate existing confirmed payments
      const confirmedPayments = await tx.payment.findMany({
        where: {
          receivableId: input.receivableId,
          status: PaymentStatus.CONFIRMED,
        },
      });

      const currentPaid = confirmedPayments.reduce(
        (acc, p) => acc.add(new Prisma.Decimal(p.amount)),
        new Prisma.Decimal(0)
      );
      const originalAmount = new Prisma.Decimal(receivable.originalAmount);
      const remainingBalance = originalAmount.sub(currentPaid);

      // 7. Invariant: Cannot pay an already fully paid receivable
      if (remainingBalance.isZero() || currentPaid.gte(originalAmount)) {
        throw new BadRequestException('Receivable is already fully paid');
      }

      // 8. Invariant: Overpayment rejection
      if (paymentAmount.greaterThan(remainingBalance)) {
        throw new BadRequestException(
          `Payment amount (${paymentAmount.toString()}) exceeds remaining balance (${remainingBalance.toString()})`
        );
      }

      const paidAt = input.paidAt
        ? new Date(input.paidAt)
        : input.paymentDate
        ? new Date(input.paymentDate)
        : new Date();

      const method = input.method || input.paymentMethod || 'BANK_TRANSFER';

      // 9. Create Confirmed Payment Record
      const payment = await tx.payment.create({
        data: {
          organizationId,
          customerId: receivable.customerId,
          receivableId: receivable.id,
          invoiceId: input.invoiceId || null,
          amount: paymentAmount,
          currency: receivable.currency,
          paidAt,
          method,
          reference: input.reference?.trim() || null,
          status: PaymentStatus.CONFIRMED,
          idempotencyKey: input.idempotencyKey?.trim() || null,
          notes: input.notes?.trim() || null,
          source: input.source?.trim() || null,
        },
        include: {
          customer: { select: { id: true, name: true } },
          receivable: {
            select: {
              id: true,
              reference: true,
              originalAmount: true,
              currency: true,
              status: true,
            },
          },
        },
      });

      const correlationId = 'corr_pay_' + payment.id;

      // 10. Record canonical PAYMENT_CONFIRMED Business Event
      await this.businessEventService.recordEvent(tx, {
        organizationId,
        customerId: receivable.customerId,
        receivableId: receivable.id,
        paymentId: payment.id,
        type: BusinessEventType.PAYMENT_CONFIRMED,
        occurredAt: payment.paidAt,
        actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
        actorUserId: actorUserId || null,
        source: EventSource.PAYMENT_PROCESS,
        data: {
          amount: payment.amount.toString(),
          currency: payment.currency,
          method: payment.method,
          reference: payment.reference,
        },
        correlationId,
        version: 1,
      });

      // 11. Update Receivable Status deterministically
      const newTotalPaid = currentPaid.add(paymentAmount);
      const newBalance = originalAmount.sub(newTotalPaid);
      const newStatus =
        newBalance.isZero() || newTotalPaid.gte(originalAmount)
          ? ReceivableStatus.PAID
          : ReceivableStatus.PARTIALLY_PAID;

      await tx.receivable.update({
        where: { id: receivable.id },
        data: { status: newStatus },
      });

      // Emit status event if receivable became fully paid or partially paid
      if (newStatus === ReceivableStatus.PAID) {
        await this.businessEventService.recordEvent(tx, {
          organizationId,
          customerId: receivable.customerId,
          receivableId: receivable.id,
          paymentId: payment.id,
          type: BusinessEventType.RECEIVABLE_PAID,
          occurredAt: payment.paidAt,
          actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
          actorUserId: actorUserId || null,
          source: EventSource.PAYMENT_PROCESS,
          data: {
            originalAmount: originalAmount.toString(),
            totalPaid: newTotalPaid.toString(),
            currency: receivable.currency,
          },
          correlationId,
          causationId: payment.id,
          version: 1,
        });
      } else if (receivable.status !== ReceivableStatus.PARTIALLY_PAID) {
        await this.businessEventService.recordEvent(tx, {
          organizationId,
          customerId: receivable.customerId,
          receivableId: receivable.id,
          paymentId: payment.id,
          type: BusinessEventType.RECEIVABLE_PARTIALLY_PAID,
          occurredAt: payment.paidAt,
          actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
          actorUserId: actorUserId || null,
          source: EventSource.PAYMENT_PROCESS,
          data: {
            originalAmount: originalAmount.toString(),
            totalPaid: newTotalPaid.toString(),
            remainingBalance: newBalance.toString(),
            currency: receivable.currency,
          },
          correlationId,
          causationId: payment.id,
          version: 1,
        });
      }

      // 12. Authoritative Engine: Evaluate Payment Commitments
      await this.commitmentService.evaluateCommitmentsForPayment(
        organizationId,
        receivable.id,
        tx,
        correlationId,
        payment.id,
        actorUserId
      );

      return {
        ...payment,
        amount: payment.amount.toString(),
        receivable: payment.receivable
          ? {
              ...payment.receivable,
              originalAmount: payment.receivable.originalAmount.toString(),
              amountPaid: newTotalPaid.toString(),
              balance: newBalance.toString(),
              status: newStatus,
            }
          : undefined,
      };
    });
  }

  async reversePayment(
    organizationId: string,
    paymentId: string,
    actorUserId?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, organizationId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found in this organization');
      }

      if (payment.status !== PaymentStatus.CONFIRMED) {
        throw new BadRequestException(
          `Only CONFIRMED payments can be reversed. Current status: ${payment.status}`
        );
      }

      if (!payment.receivableId) {
        throw new BadRequestException('Payment is not linked to a receivable');
      }

      // Row-lock the receivable
      const rawReceivables = await tx.$queryRaw<any[]>`
        SELECT * FROM receivables 
        WHERE id = ${payment.receivableId} AND "organizationId" = ${organizationId}
        FOR UPDATE
      `;

      if (!rawReceivables || rawReceivables.length === 0) {
        throw new NotFoundException('Linked receivable not found');
      }

      const receivable = rawReceivables[0];

      // Mark payment REVERSED
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REVERSED },
        include: {
          customer: { select: { id: true, name: true } },
          receivable: { select: { id: true, reference: true, currency: true } },
        },
      });

      // Record canonical PAYMENT_REVERSED Business Event
      await this.businessEventService.recordEvent(tx, {
        organizationId,
        customerId: payment.customerId,
        receivableId: payment.receivableId,
        paymentId: payment.id,
        type: BusinessEventType.PAYMENT_REVERSED,
        occurredAt: new Date(),
        actorType: actorUserId ? ActorType.USER : ActorType.SYSTEM,
        actorUserId: actorUserId || null,
        source: EventSource.USER_ACTION,
        data: {
          amount: payment.amount.toString(),
          currency: payment.currency,
          originalReference: payment.reference,
        },
        version: 1,
      });

      // Recalculate remaining confirmed payments
      const remainingConfirmed = await tx.payment.findMany({
        where: {
          receivableId: payment.receivableId,
          status: PaymentStatus.CONFIRMED,
        },
      });

      const newTotalPaid = remainingConfirmed.reduce(
        (acc, p) => acc.add(new Prisma.Decimal(p.amount)),
        new Prisma.Decimal(0)
      );
      const originalAmount = new Prisma.Decimal(receivable.originalAmount);
      const newBalance = originalAmount.sub(newTotalPaid);

      let newStatus: ReceivableStatus = ReceivableStatus.OPEN;
      if (newBalance.isZero() || newTotalPaid.gte(originalAmount)) {
        newStatus = ReceivableStatus.PAID;
      } else if (newTotalPaid.gt(0)) {
        newStatus = ReceivableStatus.PARTIALLY_PAID;
      }

      await tx.receivable.update({
        where: { id: receivable.id },
        data: { status: newStatus },
      });

      // Recalculate Payment Commitments after reversal
      await this.commitmentService.evaluateCommitmentsForPayment(
        organizationId,
        receivable.id,
        tx
      );

      return {
        ...updatedPayment,
        amount: updatedPayment.amount.toString(),
        receivableRemainingBalance: newBalance.toString(),
        receivableStatus: newStatus,
      };
    });
  }

  async list(organizationId: string, query: PaymentQueryInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.PaymentWhereInput = { organizationId };

    if (query.customerId) where.customerId = query.customerId;
    if (query.receivableId) where.receivableId = query.receivableId;
    if (query.status) where.status = query.status;
    if (query.method || query.paymentMethod) {
      where.method = (query.method || query.paymentMethod) as any;
    }

    const [totalCount, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { paidAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
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
        },
      }),
    ]);

    return {
      items: payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
        receivable: p.receivable
          ? {
              ...p.receivable,
              originalAmount: p.receivable.originalAmount.toString(),
            }
          : null,
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

  async getById(organizationId: string, id: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, organizationId },
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
            dueDate: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      ...payment,
      amount: payment.amount.toString(),
      receivable: payment.receivable
        ? {
            ...payment.receivable,
            originalAmount: payment.receivable.originalAmount.toString(),
          }
        : null,
    };
  }
}
