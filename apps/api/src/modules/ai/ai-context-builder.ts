import { Injectable, NotFoundException } from '@nestjs/common';
import {
  prisma,
  ReceivableStatus,
  CommitmentStatus,
  MemoryStatus,
} from '@netify/database';
import { formatUntrustedContext } from './ai-prompts';

export interface CustomerFinancialContext {
  customerId: string;
  customerName: string;
  phone?: string | null;
  email?: string | null;
  currency: string;
  totalOutstanding: number;
  totalOverdue: number;
  openReceivables: Array<{
    id: string;
    description?: string | null;
    originalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    daysOverdue: number;
    status: string;
  }>;
  recentCommitments: Array<{
    id: string;
    promisedAmount: number;
    promisedFor: string;
    status: string;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    paidAt: string;
    status: string;
  }>;
}

export interface GroundedContextPackage {
  financial: CustomerFinancialContext;
  businessMemories: Array<{
    id: string;
    category: string;
    type: string;
    statement: string;
    value: any;
    confidence: number;
    timeWindow: string;
  }>;
  businessEvents: Array<{
    id: string;
    type: string;
    occurredAt: string;
    actorType: string;
    summary: string;
  }>;
  validMemoryIds: Set<string>;
  validEventIds: Set<string>;
  formattedPromptContext: string;
}

@Injectable()
export class AIContextBuilder {
  /**
   * Assembles authorized, scoped, minimized context for a customer.
   * Strictly enforces organization boundary isolation.
   */
  async buildCustomerContext(
    organizationId: string,
    customerId: string,
    options?: { receivableId?: string; timeWindowDays?: number }
  ): Promise<GroundedContextPackage> {
    const now = new Date();
    const windowDays = options?.timeWindowDays || 90;
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // 1. Fetch authorized customer with IDOR check
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        currency: true,
        notes: true,
        receivables: {
          where: {
            status: { in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIALLY_PAID] },
            ...(options?.receivableId ? { id: options.receivableId } : {}),
          },
          select: {
            id: true,
            description: true,
            originalAmount: true,
            currency: true,
            dueDate: true,
            status: true,
            payments: {
              where: { status: 'CONFIRMED' },
              select: { id: true, amount: true, paidAt: true, status: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
        paymentCommitments: {
          select: {
            id: true,
            amount: true,
            promisedFor: true,
            status: true,
            createdAt: true,
          },
          orderBy: { promisedFor: 'desc' },
          take: 10,
        },
        businessMemories: {
          where: { status: MemoryStatus.ACTIVE },
          select: {
            id: true,
            category: true,
            type: true,
            statement: true,
            value: true,
            confidence: true,
            timeWindow: true,
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID "${customerId}" not found or unauthorized for this organization.`
      );
    }

    // 2. Fetch recent Business Events for this customer within the time window
    const recentEvents = await prisma.businessEvent.findMany({
      where: {
        organizationId,
        customerId,
        occurredAt: { gte: windowStart },
      },
      select: {
        id: true,
        type: true,
        occurredAt: true,
        actorType: true,
        data: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: 20,
    });

    // 3. Transform Financial Truth
    let totalOutstanding = 0;
    let totalOverdue = 0;
    const allRecentPayments: Array<{ id: string; amount: number; paidAt: string; status: string }> = [];

    const openReceivables = customer.receivables.map((rec) => {
      const paidSum = rec.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remainingAmount = Math.max(0, Number(rec.originalAmount) - paidSum);
      totalOutstanding += remainingAmount;

      const isOverdue = rec.dueDate < now && remainingAmount > 0;
      const daysOverdue = isOverdue
        ? Math.floor((now.getTime() - rec.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (isOverdue) {
        totalOverdue += remainingAmount;
      }

      for (const p of rec.payments) {
        allRecentPayments.push({
          id: p.id,
          amount: Number(p.amount),
          paidAt: p.paidAt ? p.paidAt.toISOString() : '',
          status: p.status,
        });
      }

      return {
        id: rec.id,
        description: rec.description,
        originalAmount: Number(rec.originalAmount),
        paidAmount: paidSum,
        remainingAmount,
        dueDate: rec.dueDate.toISOString().split('T')[0],
        daysOverdue,
        status: rec.status,
      };
    });

    const recentCommitments = customer.paymentCommitments.map((c) => ({
      id: c.id,
      promisedAmount: Number(c.amount),
      promisedFor: c.promisedFor.toISOString().split('T')[0],
      status: c.status,
      createdAt: c.createdAt.toISOString().split('T')[0],
    }));

    const financial: CustomerFinancialContext = {
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      currency: customer.currency || 'NGN',
      totalOutstanding,
      totalOverdue,
      openReceivables,
      recentCommitments,
      recentPayments: allRecentPayments.slice(0, 5),
    };

    // 4. Map Business Memories and Events
    const validMemoryIds = new Set<string>();
    const businessMemories = customer.businessMemories.map((m) => {
      validMemoryIds.add(m.id);
      return {
        id: m.id,
        category: m.category,
        type: m.type,
        statement: m.statement,
        value: m.value,
        confidence: Number(m.confidence),
        timeWindow: m.timeWindow,
      };
    });

    const validEventIds = new Set<string>();
    const businessEvents = recentEvents.map((e) => {
      validEventIds.add(e.id);
      const dataObj = (e.data as any) || {};
      const summary = `${e.type} by ${e.actorType}${
        dataObj.amount ? ` (Amount: ${dataObj.currency || ''} ${dataObj.amount})` : ''
      }${dataObj.channel ? ` via ${dataObj.channel}` : ''}`;

      return {
        id: e.id,
        type: e.type,
        occurredAt: e.occurredAt.toISOString().split('T')[0],
        actorType: e.actorType,
        summary,
      };
    });

    // 5. Build Safe Formatted Prompt Context with XML Boundaries
    const promptParts = [
      formatUntrustedContext('CUSTOMER_IDENTITY_AND_FINANCIAL_TRUTH', financial),
      formatUntrustedContext('ACTIVE_BUSINESS_MEMORIES_EVIDENCE', businessMemories),
      formatUntrustedContext('RECENT_BUSINESS_EVENTS_TIMELINE', businessEvents),
    ];

    return {
      financial,
      businessMemories,
      businessEvents,
      validMemoryIds,
      validEventIds,
      formattedPromptContext: promptParts.join('\n\n'),
    };
  }
}
