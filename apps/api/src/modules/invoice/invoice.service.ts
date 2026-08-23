import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, BusinessEventType } from '@netify/database';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceQueryInput,
} from '@netify/validation';
import { DeterministicInvoiceService } from './deterministic-invoice.service';

@Injectable()
export class InvoiceService {
  async list(organizationId: string, query: InvoiceQueryInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId };

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.overdueOnly) {
      where.status = 'OVERDUE';
    }

    const [totalCount, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { dueDate: 'asc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          items: true,
          payments: true,
        },
      }),
    ]);

    const enhanced = invoices.map((inv) => {
      const daysOverdue = DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate);
      return {
        ...inv,
        daysOverdue,
      };
    });

    return {
      items: enhanced,
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
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        items: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        commitments: {
          orderBy: { promisedDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const daysOverdue = DeterministicInvoiceService.calculateDaysOverdue(invoice.dueDate);
    return {
      ...invoice,
      daysOverdue,
    };
  }

  async create(organizationId: string, input: CreateInvoiceInput) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const existingInv = await prisma.invoice.findFirst({
      where: { organizationId, invoiceNumber: input.invoiceNumber },
    });

    if (existingInv) {
      throw new BadRequestException(`Invoice number ${input.invoiceNumber} already exists`);
    }

    const subtotal = DeterministicInvoiceService.calculateSubtotal(input.items);
    const total = DeterministicInvoiceService.calculateTotal(subtotal, input.discount, input.tax);
    const balance = total;
    const status = DeterministicInvoiceService.determineStatus(total, 0, input.dueDate, input.status);

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        customerId: input.customerId,
        invoiceNumber: input.invoiceNumber,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        subtotal,
        discount: input.discount,
        tax: input.tax,
        total,
        paidAmount: 0,
        balance,
        currency: input.currency || customer.currency || 'NGN',
        status,
        notes: input.notes,
        items: {
          create: input.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    // Record business event
    await prisma.businessEvent.create({
      data: {
        organizationId,
        customerId: customer.id,
        type: BusinessEventType.INVOICE_CREATED,
        occurredAt: invoice.issueDate || invoice.createdAt,
        data: { invoiceId: invoice.id, total: invoice.total, dueDate: invoice.dueDate },
      },
    });

    return invoice;
  }

  async update(organizationId: string, id: string, input: UpdateInvoiceInput) {
    const existing = await this.getById(organizationId, id);

    return prisma.invoice.update({
      where: { id },
      data: {
        status: input.status,
        dueDate: input.dueDate,
        notes: input.notes,
      },
      include: { items: true },
    });
  }
}
