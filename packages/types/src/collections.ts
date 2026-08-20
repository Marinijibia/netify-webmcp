import { CollectionPriorityCategory, RiskLevel } from './enums';
import { CustomerRiskDetail } from './risk';

export interface CollectionQueueItem {
  id: string;
  customerId: string;
  customerName: string;
  phone?: string;
  email?: string;
  currency: string;
  totalOutstanding: number;
  oldestDueDate?: string;
  daysOverdue: number;
  riskLevel: RiskLevel;
  riskScore: number;
  category: CollectionPriorityCategory;
  priorityScore: number; // 0 - 100 ranking score
  nextCommitmentDate?: string;
  missedCommitmentsCount: number;
  recommendedAction: {
    type: string;
    title: string;
    description: string;
    actionLabel: string;
    suggestedAmount?: number;
  };
}

export interface CollectionSummary {
  totalOutstanding: number;
  totalNeedsAttention: number;
  commitmentsThisWeek: number;
  overdueCount: number;
  missedCommitmentCount: number;
  currency: string;
  priorityQueue: CollectionQueueItem[];
}
