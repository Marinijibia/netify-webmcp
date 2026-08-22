import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, BusinessEventType, TransactionType } from '@netify/database';
import { CreatePaymentInput, PaymentQueryInput } from '@netify/validation';
import { DeterministicInvoiceService } from '../invoice/deterministic-invoice.service';

@Injectable()
export class PaymentService {
  async list(organizationId: string, query: PaymentQueryInput) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId };

    if (query.customerId) where.customerId = query.customerId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

    const [totalCount, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true, total: true, balance: true } },
        },
      }),
    ]);

    return {
      items: payments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
    };
  }

  async recordPayment(organizationId: string, input: CreatePaymentInput) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          organizationId,
          customerId: input.customerId,
          invoiceId: input.invoiceId,
          amount: input.amount,
          currency: input.currency || 'NGN',
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          reference: input.reference,
          notes: input.notes,
          source: input.source,
        },
      });

      // 2. If applied to an Invoice, verify invoice ownership and update paid amount, balance & status
      if (input.invoiceId) {
        const invoice = await tx.invoice.findFirst({
          where: { id: input.invoiceId, organizationId, customerId: input.customerId },
        });

        if (!invoice) {
          throw new NotFoundException('Invoice not found or does not belong to this customer');
        }

        const newPaidAmount = invoice.paidAmount + input.amount;
        const newBalance = DeterministicInvoiceService.calculateBalance(invoice.total, newPaidAmount);
        const newStatus = DeterministicInvoiceService.determineStatus(
          invoice.total,
          newPaidAmount,
          invoice.dueDate,
          invoice.status
        );

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus,
          },
        });
      }

      // 3. Create Transaction Ledger Entry
      await tx.transaction.create({
        data: {
          organizationId,
          customerId: input.customerId,
          type: TransactionType.CREDIT,
          amount: input.amount,
          currency: input.currency || 'NGN',
          balanceAfter: 0, // Ledger entry
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          description: `Payment received via ${input.paymentMethod}${input.reference ? ` (${input.reference})` : ''}`,
          date: input.paymentDate,
        },
      });

      // 4. Record Business Event
      await tx.businessEvent.create({
        data: {
          organizationId,
          customerId: input.customerId,
          eventType: BusinessEventType.PAYMENT_RECEIVED,
          summary: `Payment of ${payment.currency} ${payment.amount.toLocaleString()} received from ${customer.name}`,
          payload: {
            paymentId: payment.id,
            amount: payment.amount,
            method: payment.paymentMethod,
            invoiceId: input.invoiceId,
          },
        },
      });

      return payment;
    });
  }
}
