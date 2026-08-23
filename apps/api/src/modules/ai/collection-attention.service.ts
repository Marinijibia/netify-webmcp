import { Injectable } from '@nestjs/common';
import { prisma, ReceivableStatus, CommitmentStatus } from '@netify/database';
import { CollectionPriorityService, CustomerPriorityProfile } from './collection-priority.service';
import { TodayAttentionQueryInput } from '@netify/validation';

export interface TodayAttentionSummary {
  currency: string;
  totalOutstanding: number;
  totalOverdue: number;
  commitmentsDueCount: number;
  commitmentsDueAmount: number;
  highPriorityCount: number;
  topPriorities: CustomerPriorityProfile[];
  executiveBriefing: string;
  calculatedAt: string;
}

@Injectable()
export class CollectionAttentionService {
  constructor(private readonly priorityService: CollectionPriorityService) {}

  /**
   * Generates deterministic Today's Attention financial snapshot and briefing.
   * All numbers are calculated strictly by database/deterministic logic.
   */
  async getTodayAttention(
    organizationId: string,
    query?: TodayAttentionQueryInput
  ): Promise<TodayAttentionSummary> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Get organization default currency
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { currency: true, name: true },
    });
    const currency = query?.currency || org?.currency || 'NGN';

    // 2. Fetch priority list
    const priorityResult = await this.priorityService.getPrioritizedCustomers(organizationId, {
      page: 1,
      limit: 10,
      currency,
    });

    // 3. Aggregate totals across all open receivables for the organization
    const openReceivables = await prisma.receivable.findMany({
      where: {
        organizationId,
        currency,
        status: { in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIALLY_PAID] },
      },
      select: {
        originalAmount: true,
        dueDate: true,
        payments: {
          where: { status: 'CONFIRMED' },
          select: { amount: true },
        },
      },
    });

    let totalOutstanding = 0;
    let totalOverdue = 0;

    for (const rec of openReceivables) {
      const paidSum = rec.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Math.max(0, Number(rec.originalAmount) - paidSum);
      totalOutstanding += remaining;

      if (rec.dueDate < now && remaining > 0) {
        totalOverdue += remaining;
      }
    }

    // 4. Query commitments due today
    const commitmentsDueToday = await prisma.paymentCommitment.findMany({
      where: {
        organizationId,
        currency,
        status: CommitmentStatus.PENDING,
        promisedFor: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        amount: true,
      },
    });

    const commitmentsDueCount = commitmentsDueToday.length;
    const commitmentsDueAmount = commitmentsDueToday.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    const topPriorities = priorityResult.items.slice(0, 5);

    // 5. Generate deterministic executive narrative
    const hour = now.getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    let executiveBriefing = `${timeGreeting}. You have ${currency} ${totalOutstanding.toLocaleString()} in total outstanding balance`;
    if (totalOverdue > 0) {
      executiveBriefing += `, with ${currency} ${totalOverdue.toLocaleString()} currently overdue.`;
    } else {
      executiveBriefing += `, with zero overdue debt.`;
    }

    if (commitmentsDueCount > 0) {
      executiveBriefing += ` ${commitmentsDueCount} payment commitment${
        commitmentsDueCount > 1 ? 's are' : ' is'
      } due today totaling ${currency} ${commitmentsDueAmount.toLocaleString()}.`;
    }

    if (topPriorities.length > 0) {
      const topName = topPriorities[0].customerName;
      executiveBriefing += ` Primary focus: ${topName} (${topPriorities[0].reasons[0] || 'needs follow-up'}).`;
    }

    return {
      currency,
      totalOutstanding,
      totalOverdue,
      commitmentsDueCount,
      commitmentsDueAmount,
      highPriorityCount: priorityResult.highUrgencyCount,
      topPriorities,
      executiveBriefing,
      calculatedAt: now.toISOString(),
    };
  }
}
