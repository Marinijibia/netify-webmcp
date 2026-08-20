import { RiskLevel, DeterministicRiskSignals, RiskScoreResult } from '@netify/types';

export class DeterministicRiskEngine {
  /**
   * Computes a deterministic normalized risk score (0-100) and risk level from verified signals.
   */
  static calculateScore(signals: DeterministicRiskSignals): RiskScoreResult {
    // 1. Overdue Aging Score (Weight: 40%)
    // 0 days overdue = 0 pts; 30 days overdue = 50 pts; 60+ days overdue = 100 pts
    let overdueScore = 0;
    if (signals.oldestOverdueDays > 0) {
      if (signals.oldestOverdueDays >= 60) {
        overdueScore = 100;
      } else if (signals.oldestOverdueDays >= 30) {
        overdueScore = 50 + ((signals.oldestOverdueDays - 30) / 30) * 50;
      } else {
        overdueScore = (signals.oldestOverdueDays / 30) * 50;
      }
    }

    // 2. Commitment Reliability Score (Weight: 30%)
    // Evaluates missed commitments & fulfillment percentage
    let commitmentScore = 0;
    const totalPromises = signals.missedCommitmentsCount + signals.fulfilledCommitmentsCount + signals.pendingCommitmentsCount;
    if (totalPromises > 0) {
      if (signals.missedCommitmentsCount > 0) {
        const failurePenalty = Math.min(100, signals.missedCommitmentsCount * 35);
        const unfulfillmentPenalty = (100 - signals.commitmentFulfillmentRate) * 0.5;
        commitmentScore = Math.min(100, failurePenalty + unfulfillmentPenalty);
      } else if (signals.fulfilledCommitmentsCount > 0) {
        commitmentScore = 10; // Low risk
      } else {
        commitmentScore = 30; // Unknown/neutral
      }
    } else {
      commitmentScore = signals.oldestOverdueDays > 0 ? 40 : 15;
    }

    // 3. Outstanding Exposure Ratio (Weight: 20%)
    // Ratio of current outstanding vs total historical paid
    let exposureScore = 0;
    if (signals.totalOutstanding > 0) {
      if (signals.totalPaidHistorical === 0) {
        exposureScore = 80; // First time / unproven customer with debt
      } else {
        const ratio = signals.totalOutstanding / (signals.totalOutstanding + signals.totalPaidHistorical);
        exposureScore = Math.min(100, Math.round(ratio * 100));
      }
    }

    // 4. Payment Recency & Delay (Weight: 10%)
    let recencyScore = 0;
    if (signals.daysSinceLastPayment !== null) {
      if (signals.daysSinceLastPayment > 60) {
        recencyScore = 100;
      } else if (signals.daysSinceLastPayment > 30) {
        recencyScore = 60;
      } else {
        recencyScore = 10;
      }
    } else if (signals.totalOutstanding > 0) {
      recencyScore = 75;
    }

    // Weighted composite score (0-100)
    const compositeScore = Math.round(
      overdueScore * 0.40 +
      commitmentScore * 0.30 +
      exposureScore * 0.20 +
      recencyScore * 0.10
    );

    const score = Math.max(0, Math.min(100, compositeScore));

    let level: RiskLevel = RiskLevel.LOW;
    if (score >= 76) {
      level = RiskLevel.CRITICAL;
    } else if (score >= 51) {
      level = RiskLevel.HIGH;
    } else if (score >= 26) {
      level = RiskLevel.MEDIUM;
    } else {
      level = RiskLevel.LOW;
    }

    return {
      score,
      level,
      signals,
      breakdown: {
        overdueScore,
        commitmentScore,
        exposureScore,
        recencyScore,
      },
    };
  }
}
