import { Injectable } from '@nestjs/common';
import {
  prisma,
  ReceivableStatus,
  CommitmentStatus,
  MemoryCategory,
  MemoryType,
  MemoryStatus,
} from '@netify/database';
import {
  PriorityCustomerQueryInput,
  AIUrgencyLevelEnum,
} from '@netify/validation';

export type AIUrgency = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CustomerPriorityProfile {
  customerId: string;
  customerName: string;
  phone?: string | null;
  email?: string | null;
  currency: string;
  totalOutstanding: number;
  totalOverdue: number;
  oldestOverdueDays: number;
  openReceivablesCount: number;
  pendingCommitmentsCount: number;
  missedCommitmentsCount: number;
  priorityScore: number;
  urgency: AIUrgency;
  reasons: string[];
  lastPaymentAt?: Date | null;
  lastActivityAt?: Date | null;
}

@Injectable()
export class CollectionPriorityService {
  /**
   * Calculates deterministic priority scores and ranks all customers for an organization.
   * Does NOT use LLMs for calculation. Pure deterministic business mathematics.
   */
  async getPrioritizedCustomers(
    organizationId: string,
    query: PriorityCustomerQueryInput
  ): Promise<{
    items: CustomerPriorityProfile[];
    totalCount: number;
    highUrgencyCount: number;
    mediumUrgencyCount: number;
    lowUrgencyCount: number;
  }> {
    const now = new Date();

    // 1. Fetch active customers with financial receivables, commitments, memories, activities
    const customers = await prisma.customer.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        currency: true,
        receivables: {
          where: {
            status: { in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIALLY_PAID] },
          },
          select: {
            id: true,
            originalAmount: true,
            currency: true,
            dueDate: true,
            status: true,
            payments: {
              where: { status: 'CONFIRMED' },
              select: { amount: true, paidAt: true },
            },
          },
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
        collectionActivities: {
          select: {
            id: true,
            channel: true,
            outcome: true,
            occurredAt: true,
          },
          orderBy: { occurredAt: 'desc' },
          take: 5,
        },
        businessMemories: {
          where: { status: MemoryStatus.ACTIVE },
          select: {
            category: true,
            type: true,
            statement: true,
            value: true,
          },
        },
      },
    });

    const profiles: CustomerPriorityProfile[] = [];

    for (const cust of customers) {
      // Calculate financial balances
      let totalOutstanding = 0;
      let totalOverdue = 0;
      let oldestOverdueDays = 0;
      let lastPaymentDate: Date | null = null;

      for (const rec of cust.receivables) {
        const paidSum = rec.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const rem = Math.max(0, Number(rec.originalAmount) - paidSum);
        totalOutstanding += rem;

        if (rec.dueDate < now && rem > 0) {
          totalOverdue += rem;
          const days = Math.floor(
            (now.getTime() - rec.dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (days > oldestOverdueDays) {
            oldestOverdueDays = days;
          }
        }

        for (const p of rec.payments) {
          if (p.paidAt && (!lastPaymentDate || p.paidAt > lastPaymentDate)) {
            lastPaymentDate = p.paidAt;
          }
        }
      }

      // Count commitment states
      const pendingCommitments = cust.paymentCommitments.filter(
        (c) => c.status === CommitmentStatus.PENDING
      );
      const missedCommitments = cust.paymentCommitments.filter(
        (c) => c.status === CommitmentStatus.MISSED
      );

      const lastActivity = cust.collectionActivities[0]?.occurredAt || null;

      // Check for commitments due today or overdue
      const commitmentsDueSoon = pendingCommitments.filter((c) => {
        const diffDays =
          (c.promisedFor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 1; // Due today or overdue
      });

      // If customer owes 0 and has no commitments due, skip from priority queue
      if (totalOutstanding <= 0 && pendingCommitments.length === 0) {
        continue;
      }

      // ----------------------------------------------------
      // DETERMINISTIC SCORING ENGINE (0 - 100)
      // ----------------------------------------------------
      const reasons: string[] = [];

      // Dimension 1: Financial Urgency (Weight 35%)
      let urgencyScore = 0;
      if (totalOverdue > 0) {
        const overdueRatio = totalOutstanding > 0 ? totalOverdue / totalOutstanding : 1;
        urgencyScore = Math.min(100, 50 + overdueRatio * 35 + Math.min(25, oldestOverdueDays * 2));
        reasons.push(
          `${cust.currency} ${totalOverdue.toLocaleString()} overdue`
        );
        if (oldestOverdueDays > 0) {
          reasons.push(`${oldestOverdueDays} days overdue`);
        }
      } else if (totalOutstanding > 0) {
        urgencyScore = 20; // Outstanding but not yet overdue
      }

      // Dimension 2: Commitment Risk (Weight 25%)
      let commitmentScore = 0;
      if (missedCommitments.length > 0) {
        commitmentScore = Math.min(100, 65 + missedCommitments.length * 20);
        reasons.push(
          `Missed ${missedCommitments.length} payment commitment${
            missedCommitments.length > 1 ? 's' : ''
          }`
        );
      } else if (commitmentsDueSoon.length > 0) {
        commitmentScore = 70;
        reasons.push(`Commitment due today`);
      } else if (pendingCommitments.length > 0) {
        commitmentScore = 30;
      }

      // Dimension 3: Business Memory & Behavior (Weight 15%)
      let memoryScore = 0;
      const missedRateMem = cust.businessMemories.find(
        (m) => m.type === MemoryType.PAYMENT_COMMITMENT_MISSED_RATE
      );
      if (missedRateMem && (missedRateMem.value as any)?.missedRate > 40) {
        memoryScore += 40;
      }
      const timelinessMem = cust.businessMemories.find(
        (m) => m.type === MemoryType.PAYMENT_TIMELINESS
      );
      if (timelinessMem && (timelinessMem.value as any)?.averageDelayDays > 7) {
        memoryScore += 40;
      }

      // Dimension 4: Inaction / Recency (Weight 15%)
      let recencyScore = 0;
      if (lastPaymentDate) {
        const daysSincePayment = Math.floor(
          (now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSincePayment > 30) {
          recencyScore += 50;
          reasons.push(`No payment in ${daysSincePayment} days`);
        }
      } else if (totalOutstanding > 0) {
        recencyScore += 75;
        reasons.push(`No confirmed payments on record`);
      }

      if (lastActivity) {
        const daysSinceActivity = Math.floor(
          (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceActivity > 14 && totalOverdue > 0) {
          recencyScore += 40;
        }
      }

      // Dimension 5: Magnitude Bonus (Weight 10%)
      let magnitudeScore = 0;
      if (totalOutstanding >= 1000000) {
        magnitudeScore = 100;
      } else if (totalOutstanding >= 400000) {
        magnitudeScore = 75;
      } else if (totalOutstanding >= 100000) {
        magnitudeScore = 50;
      } else {
        magnitudeScore = 25;
      }

      // Composite weighted score (0 - 100)
      const rawScore =
        urgencyScore * 0.35 +
        commitmentScore * 0.25 +
        memoryScore * 0.15 +
        recencyScore * 0.15 +
        magnitudeScore * 0.1;

      const priorityScore = Math.min(100, Math.max(0, Math.round(rawScore)));

      let urgency: AIUrgency = 'LOW';
      if (priorityScore >= 70) {
        urgency = 'HIGH';
      } else if (priorityScore >= 40) {
        urgency = 'MEDIUM';
      }

      profiles.push({
        customerId: cust.id,
        customerName: cust.name,
        phone: cust.phone,
        email: cust.email,
        currency: cust.currency || 'NGN',
        totalOutstanding,
        totalOverdue,
        oldestOverdueDays,
        openReceivablesCount: cust.receivables.length,
        pendingCommitmentsCount: pendingCommitments.length,
        missedCommitmentsCount: missedCommitments.length,
        priorityScore,
        urgency,
        reasons: reasons.slice(0, 4), // Top 4 deterministic reasons
        lastPaymentAt: lastPaymentDate,
        lastActivityAt: lastActivity,
      });
    }

    // Sort descending by priorityScore
    profiles.sort((a, b) => b.priorityScore - a.priorityScore);

    // Filter by query parameters if supplied
    let filtered = profiles;
    if (query.urgency) {
      filtered = filtered.filter((p) => p.urgency === query.urgency);
    }
    if (query.minScore !== undefined) {
      filtered = filtered.filter((p) => p.priorityScore >= (query.minScore || 0));
    }
    if (query.currency) {
      filtered = filtered.filter((p) => p.currency === query.currency);
    }

    const highUrgencyCount = profiles.filter((p) => p.urgency === 'HIGH').length;
    const mediumUrgencyCount = profiles.filter((p) => p.urgency === 'MEDIUM').length;
    const lowUrgencyCount = profiles.filter((p) => p.urgency === 'LOW').length;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      totalCount: filtered.length,
      highUrgencyCount,
      mediumUrgencyCount,
      lowUrgencyCount,
    };
  }
}
