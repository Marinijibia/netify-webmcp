import { RiskLevel } from './enums';

export interface DeterministicRiskSignals {
  customerId: string;
  customerName: string;
  currency: string;
  totalOutstanding: number;
  totalPaidHistorical: number;
  oldestOverdueDays: number;
  overdueInvoicesCount: number;
  totalInvoicesCount: number;
  pendingCommitmentsCount: number;
  missedCommitmentsCount: number;
  fulfilledCommitmentsCount: number;
  commitmentFulfillmentRate: number; // 0 to 100
  averagePaymentDelayDays: number;
  daysSinceLastPayment: number | null;
  outstandingToHistoryRatio: number; // ratio of outstanding to total historic billing
}

export interface RiskScoreResult {
  score: number; // 0 - 100
  level: RiskLevel;
  signals: DeterministicRiskSignals;
  breakdown: {
    overdueScore: number;
    commitmentScore: number;
    exposureScore: number;
    recencyScore: number;
  };
}

export interface RiskEvidenceItem {
  id: string;
  type: 'INVOICE' | 'COMMITMENT' | 'PAYMENT' | 'CONVERSATION' | 'HISTORICAL';
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  date?: string;
  status?: string;
  sourceReference?: string;
}

export interface CustomerRiskDetail {
  customerId: string;
  customerName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  signals: DeterministicRiskSignals;
  aiExplanation: string;
  evidence: RiskEvidenceItem[];
  evaluatedAt: string;
}
