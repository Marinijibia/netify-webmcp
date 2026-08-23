import { Injectable } from '@nestjs/common';
import {
  prisma,
  ReceivableStatus,
  CommitmentStatus,
} from '@netify/database';
import { BusinessQAInput, BusinessQAOutput } from '@netify/validation';
import { CollectionPriorityService } from './collection-priority.service';
import { formatUntrustedContext } from './ai-prompts';

export type QAIntent =
  | 'TOP_OUTSTANDING'
  | 'OVERDUE_RECEIVABLES'
  | 'RECENT_PAYMENTS'
  | 'MISSED_COMMITMENTS'
  | 'COLLECTION_ACTIVITY'
  | 'CUSTOMER_HISTORY'
  | 'PAYMENT_SUMMARY'
  | 'COLLECTION_SUMMARY'
  | 'GENERAL_QUERY';

export interface GroundedQAResult {
  intent: QAIntent;
  data: any;
  contextSummary: string;
  citations: string[];
}

@Injectable()
export class BusinessQAService {
  constructor(private readonly priorityService: CollectionPriorityService) {}

  /**
   * Classifies user natural language query into a controlled, safe query intent.
   * NEVER executes dynamic or model-generated SQL.
   */
  classifyIntent(query: string, customerId?: string): QAIntent {
    if (customerId) {
      return 'CUSTOMER_HISTORY';
    }

    const lower = query.toLowerCase();

    if (
      lower.includes('owe') ||
      lower.includes('highest') ||
      lower.includes('most') ||
      lower.includes('debtor') ||
      lower.includes('outstanding')
    ) {
      return 'TOP_OUTSTANDING';
    }

    if (
      lower.includes('overdue') ||
      lower.includes('late') ||
      lower.includes('past due') ||
      lower.includes('expired')
    ) {
      return 'OVERDUE_RECEIVABLES';
    }

    if (
      lower.includes('commitment') ||
      lower.includes('promise') ||
      lower.includes('missed') ||
      lower.includes('broken')
    ) {
      return 'MISSED_COMMITMENTS';
    }

    if (
      lower.includes('collect') ||
      lower.includes('paid') ||
      lower.includes('payment') ||
      lower.includes('received') ||
      lower.includes('revenue')
    ) {
      return 'RECENT_PAYMENTS';
    }

    if (
      lower.includes('activity') ||
      lower.includes('call') ||
      lower.includes('contact') ||
      lower.includes('whatsapp') ||
      lower.includes('follow-up') ||
      lower.includes('outreach')
    ) {
      return 'COLLECTION_ACTIVITY';
    }

    if (lower.includes('summary') || lower.includes('overview') || lower.includes('health')) {
      return 'COLLECTION_SUMMARY';
    }

    return 'TOP_OUTSTANDING';
  }

  /**
   * Executes safe, parameterized Prisma queries corresponding to the classified intent.
   */
  async executeDeterministicQuery(
    organizationId: string,
    input: BusinessQAInput
  ): Promise<GroundedQAResult> {
    const intent = this.classifyIntent(input.query, input.customerId);
    const now = new Date();
    const windowDays = input.timeWindowDays || 30;
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const citations: string[] = [];

    switch (intent) {
      case 'TOP_OUTSTANDING': {
        const priorityData = await this.priorityService.getPrioritizedCustomers(organizationId, {
          page: 1,
          limit: 10,
        });

        const topCustomers = priorityData.items.map((p) => {
          citations.push(p.customerName);
          return {
            customerName: p.customerName,
            totalOutstanding: `${p.currency} ${p.totalOutstanding.toLocaleString()}`,
            totalOverdue: `${p.currency} ${p.totalOverdue.toLocaleString()}`,
            daysOverdue: p.oldestOverdueDays,
            priority: p.urgency,
            primaryReason: p.reasons[0] || 'Open debt',
          };
        });

        return {
          intent,
          data: topCustomers,
          contextSummary: `Top ${topCustomers.length} customers with outstanding balances in the organization.`,
          citations,
        };
      }

      case 'OVERDUE_RECEIVABLES': {
        const overdueReceivables = await prisma.receivable.findMany({
          where: {
            organizationId,
            dueDate: { lt: now },
            status: { in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIALLY_PAID] },
          },
          select: {
            id: true,
            originalAmount: true,
            currency: true,
            dueDate: true,
            customer: { select: { id: true, name: true, phone: true } },
            payments: {
              where: { status: 'CONFIRMED' },
              select: { amount: true },
            },
          },
          orderBy: { dueDate: 'asc' },
          take: 15,
        });

        const results = overdueReceivables.map((rec) => {
          const paidSum = rec.payments.reduce((s, p) => s + Number(p.amount), 0);
          const rem = Math.max(0, Number(rec.originalAmount) - paidSum);
          const days = Math.floor((now.getTime() - rec.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          citations.push(rec.customer.name);

          return {
            customer: rec.customer.name,
            overdueAmount: `${rec.currency} ${rem.toLocaleString()}`,
            dueDate: rec.dueDate.toISOString().split('T')[0],
            daysOverdue: days,
          };
        });

        return {
          intent,
          data: results,
          contextSummary: `Identified ${results.length} overdue receivable items.`,
          citations: Array.from(new Set(citations)),
        };
      }

      case 'RECENT_PAYMENTS': {
        const payments = await prisma.payment.findMany({
          where: {
            organizationId,
            status: 'CONFIRMED',
            paidAt: { gte: windowStart },
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            paidAt: true,
            method: true,
            customer: { select: { name: true } },
          },
          orderBy: { paidAt: 'desc' },
          take: 20,
        });

        let totalCollected = 0;
        const paymentList = payments.map((p) => {
          totalCollected += Number(p.amount);
          citations.push(p.customer.name);
          return {
            customer: p.customer.name,
            amount: `${p.currency} ${Number(p.amount).toLocaleString()}`,
            method: p.method,
            date: p.paidAt ? p.paidAt.toISOString().split('T')[0] : '',
          };
        });

        return {
          intent,
          data: {
            totalPaymentsCount: payments.length,
            totalCollectedAmount: totalCollected,
            recentPayments: paymentList,
          },
          contextSummary: `Collected ${payments.length} confirmed payments in the last ${windowDays} days.`,
          citations: Array.from(new Set(citations)),
        };
      }

      case 'MISSED_COMMITMENTS': {
        const missed = await prisma.paymentCommitment.findMany({
          where: {
            organizationId,
            status: CommitmentStatus.MISSED,
            promisedFor: { gte: windowStart },
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            promisedFor: true,
            customer: { select: { name: true } },
          },
          orderBy: { promisedFor: 'desc' },
          take: 15,
        });

        const list = missed.map((c) => {
          citations.push(c.customer.name);
          return {
            customer: c.customer.name,
            promisedAmount: `${c.currency} ${Number(c.amount).toLocaleString()}`,
            promisedDate: c.promisedFor.toISOString().split('T')[0],
          };
        });

        return {
          intent,
          data: list,
          contextSummary: `Identified ${list.length} missed payment commitments in the last ${windowDays} days.`,
          citations: Array.from(new Set(citations)),
        };
      }

      case 'COLLECTION_ACTIVITY': {
        const activities = await prisma.collectionActivity.findMany({
          where: {
            organizationId,
            occurredAt: { gte: windowStart },
          },
          select: {
            id: true,
            channel: true,
            outcome: true,
            occurredAt: true,
            notes: true,
            customer: { select: { name: true } },
          },
          orderBy: { occurredAt: 'desc' },
          take: 15,
        });

        const list = activities.map((a) => {
          citations.push(a.customer.name);
          return {
            customer: a.customer.name,
            channel: a.channel,
            outcome: a.outcome,
            date: a.occurredAt.toISOString().split('T')[0],
          };
        });

        return {
          intent,
          data: list,
          contextSummary: `Logged ${list.length} collection activities in the last ${windowDays} days.`,
          citations: Array.from(new Set(citations)),
        };
      }

      case 'CUSTOMER_HISTORY':
      case 'COLLECTION_SUMMARY':
      default: {
        const priorityData = await this.priorityService.getPrioritizedCustomers(organizationId, {
          page: 1,
          limit: 10,
        });

        return {
          intent,
          data: {
            highUrgencyCustomers: priorityData.highUrgencyCount,
            mediumUrgencyCustomers: priorityData.mediumUrgencyCount,
            totalActiveInQueue: priorityData.totalCount,
            topPriorities: priorityData.items.slice(0, 5).map((p) => ({
              name: p.customerName,
              outstanding: `${p.currency} ${p.totalOutstanding.toLocaleString()}`,
              overdue: `${p.currency} ${p.totalOverdue.toLocaleString()}`,
            })),
          },
          contextSummary: `Organization collection overview with ${priorityData.totalCount} active accounts.`,
          citations: priorityData.items.slice(0, 5).map((p) => p.customerName),
        };
      }
    }
  }
}
