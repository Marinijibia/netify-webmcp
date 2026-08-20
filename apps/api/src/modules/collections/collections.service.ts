import { Injectable } from '@nestjs/common';
import { prisma } from '@netify/database';
import {
  CollectionQueueItem,
  CollectionSummary,
  CollectionPriorityCategory,
  RiskLevel,
} from '@netify/types';
import { DeterministicInvoiceService } from '../invoice/deterministic-invoice.service';

@Injectable()
export class CollectionsService {
  async getCollectionSummary(organizationId: string): Promise<CollectionSummary> {
    const [org, customers] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { currency: true },
      }),
      prisma.customer.findMany({
        where: { organizationId, status: 'ACTIVE' },
        include: {
          invoices: {
            where: { balance: { gt: 0 } },
            orderBy: { dueDate: 'asc' },
          },
          commitments: {
            where: { status: { in: ['PENDING', 'MISSED'] } },
            orderBy: { promisedDate: 'asc' },
          },
          riskAssessments: {
            take: 1,
            orderBy: { evaluatedAt: 'desc' },
          },
        },
      }),
    ]);

    const currency = org?.currency || 'NGN';
    const now = new Date();
    const queueItems: CollectionQueueItem[] = [];

    let totalOutstanding = 0;
    let totalNeedsAttention = 0;
    let commitmentsThisWeek = 0;
    let overdueCount = 0;
    let missedCommitmentCount = 0;

    for (const customer of customers) {
      const customerOutstanding = customer.invoices.reduce((sum, inv) => sum + inv.balance, 0);
      totalOutstanding += customerOutstanding;

      if (customerOutstanding === 0 && customer.commitments.length === 0) {
        continue;
      }

      const overdueInvoices = customer.invoices.filter(
        (inv) => DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate) > 0
      );

      const oldestOverdueDays = overdueInvoices.reduce((max, inv) => {
        return Math.max(max, DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate));
      }, 0);

      const pendingCommitments = customer.commitments.filter((c) => c.status === 'PENDING');
      const missedCommitments = customer.commitments.filter((c) => c.status === 'MISSED');

      // Count stats
      if (overdueInvoices.length > 0) overdueCount += overdueInvoices.length;
      if (missedCommitments.length > 0) missedCommitmentCount += missedCommitments.length;

      // Count promises this week
      const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      pendingCommitments.forEach((comm) => {
        if (new Date(comm.promisedDate) <= endOfWeek) {
          commitmentsThisWeek++;
        }
      });

      // Determine Priority Category
      let category = CollectionPriorityCategory.NEEDS_FOLLOW_UP;
      if (missedCommitments.length > 0) {
        category = CollectionPriorityCategory.MISSED_COMMITMENT;
      } else if (oldestOverdueDays >= 14) {
        category = CollectionPriorityCategory.OVERDUE;
      } else if (oldestOverdueDays > 0) {
        category = CollectionPriorityCategory.DUE_TODAY;
      } else if (customer.riskAssessments[0]?.riskLevel === 'HIGH' || customer.riskAssessments[0]?.riskLevel === 'CRITICAL') {
        category = CollectionPriorityCategory.HIGH_RISK;
      }

      // Calculate Priority Score (0-100)
      const amountFactor = Math.min(40, (customerOutstanding / 1_000_000) * 40);
      const overdueFactor = Math.min(30, (oldestOverdueDays / 30) * 30);
      const missedFactor = missedCommitments.length > 0 ? 20 : 0;
      const riskFactor = (customer.riskAssessments[0]?.riskScore || 20) * 0.1;

      const priorityScore = Math.min(100, Math.round(amountFactor + overdueFactor + missedFactor + riskFactor));

      if (priorityScore >= 35 || missedCommitments.length > 0 || oldestOverdueDays > 0) {
        totalNeedsAttention += customerOutstanding;
      }

      // Recommended Action
      let recommendedAction = {
        type: 'FOLLOW_UP_CALL',
        title: 'Call customer today',
        description: 'Check in on payment schedule and request invoice status.',
        actionLabel: 'Call Customer',
        suggestedAmount: customerOutstanding,
      };

      if (missedCommitments.length > 0) {
        recommendedAction = {
          type: 'SEND_PAYMENT_REMINDER',
          title: `Follow up on missed promise (${currency} ${missedCommitments[0].amount.toLocaleString()})`,
          description: `Customer missed their promise on ${new Date(missedCommitments[0].promisedDate).toLocaleDateString()}. Send polite reminder.`,
          actionLabel: 'Draft WhatsApp',
          suggestedAmount: missedCommitments[0].amount,
        };
      } else if (oldestOverdueDays >= 14) {
        recommendedAction = {
          type: 'OFFER_PAYMENT_PLAN',
          title: `Request partial payment of ${currency} ${Math.round(customerOutstanding * 0.5).toLocaleString()}`,
          description: `Invoice is ${oldestOverdueDays} days overdue. Offer a structured 2-part settlement.`,
          actionLabel: 'Offer Plan',
          suggestedAmount: Math.round(customerOutstanding * 0.5),
        };
      }

      const riskLevel: RiskLevel = (customer.riskAssessments[0]?.riskLevel as RiskLevel) || RiskLevel.LOW;
      const riskScore = customer.riskAssessments[0]?.riskScore || 20;

      queueItems.push({
        id: customer.id,
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone || undefined,
        email: customer.email || undefined,
        currency: customer.currency || currency,
        totalOutstanding: customerOutstanding,
        oldestDueDate: overdueInvoices[0]?.dueDate ? new Date(overdueInvoices[0].dueDate).toISOString() : undefined,
        daysOverdue: oldestOverdueDays,
        riskLevel,
        riskScore,
        category,
        priorityScore,
        nextCommitmentDate: pendingCommitments[0]?.promisedDate ? new Date(pendingCommitments[0].promisedDate).toISOString() : undefined,
        missedCommitmentsCount: missedCommitments.length,
        recommendedAction,
      });
    }

    // Sort queue by priority score descending
    queueItems.sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      totalOutstanding,
      totalNeedsAttention,
      commitmentsThisWeek,
      overdueCount,
      missedCommitmentCount,
      currency,
      priorityQueue: queueItems,
    };
  }
}
