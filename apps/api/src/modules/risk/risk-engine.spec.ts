import { DeterministicRiskEngine } from './deterministic-risk.service';
import { DeterministicRiskSignals, RiskLevel } from '@netify/types';

describe('DeterministicRiskEngine', () => {
  it('should score a prompt payer with zero overdue invoices as LOW risk', () => {
    const signals: DeterministicRiskSignals = {
      customerId: 'cust-1',
      customerName: 'Greenfield Supplies',
      currency: 'NGN',
      totalOutstanding: 0,
      totalPaidHistorical: 2500000,
      oldestOverdueDays: 0,
      overdueInvoicesCount: 0,
      totalInvoicesCount: 4,
      pendingCommitmentsCount: 0,
      missedCommitmentsCount: 0,
      fulfilledCommitmentsCount: 3,
      commitmentFulfillmentRate: 100,
      averagePaymentDelayDays: 0,
      daysSinceLastPayment: 5,
      outstandingToHistoryRatio: 0,
    };

    const result = DeterministicRiskEngine.calculateScore(signals);
    expect(result.level).toBe(RiskLevel.LOW);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it('should score a customer with multiple overdue invoices and missed commitments as HIGH or CRITICAL risk', () => {
    const signals: DeterministicRiskSignals = {
      customerId: 'cust-2',
      customerName: 'ABC Stores',
      currency: 'NGN',
      totalOutstanding: 850000,
      totalPaidHistorical: 500000,
      oldestOverdueDays: 21,
      overdueInvoicesCount: 2,
      totalInvoicesCount: 3,
      pendingCommitmentsCount: 0,
      missedCommitmentsCount: 1,
      fulfilledCommitmentsCount: 0,
      commitmentFulfillmentRate: 0,
      averagePaymentDelayDays: 14,
      daysSinceLastPayment: null,
      outstandingToHistoryRatio: 0.63,
    };

    const result = DeterministicRiskEngine.calculateScore(signals);
    expect(result.level === RiskLevel.HIGH || result.level === RiskLevel.CRITICAL).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(51);
  });
});
