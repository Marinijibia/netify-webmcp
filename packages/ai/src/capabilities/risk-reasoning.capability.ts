import { z } from 'zod';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { SYSTEM_PROMPTS } from '../prompts';
import { DeterministicRiskSignals, AIRiskReasoningResponse } from '@netify/types';

const riskReasoningSchema = z.object({
  summary: z.string(),
  explanation: z.string(),
  keyFactors: z.array(z.string()),
  recommendedAction: z.string(),
  evidenceIds: z.array(z.string()).default([]),
});

export class RiskReasoningCapability {
  constructor(private readonly provider: AIProvider) {}

  async explainRisk(
    signals: DeterministicRiskSignals,
    context?: string
  ): Promise<AIRiskReasoningResponse> {
    const prompt = `Explain the financial risk score for this SME customer:
Customer: ${signals.customerName} (ID: ${signals.customerId})
Total Outstanding: ${signals.currency} ${signals.totalOutstanding.toLocaleString()}
Total Historical Paid: ${signals.currency} ${signals.totalPaidHistorical.toLocaleString()}
Oldest Overdue: ${signals.oldestOverdueDays} days late (${signals.overdueInvoicesCount} overdue invoices)
Missed Commitments: ${signals.missedCommitmentsCount}
Fulfilled Commitments: ${signals.fulfilledCommitmentsCount} (Fulfillment Rate: ${signals.commitmentFulfillmentRate}%)
Average Payment Delay: ${signals.averagePaymentDelayDays} days
Days Since Last Payment: ${signals.daysSinceLastPayment !== null ? `${signals.daysSinceLastPayment} days ago` : 'No recorded payments'}
Additional Context: ${context || 'None'}

Return a JSON object with:
- summary: 1-sentence risk summary
- explanation: 2-3 sentence clear explanation of why this risk score was assigned
- keyFactors: 3-4 bullet points highlighting the deterministic signals
- recommendedAction: concrete next step the owner should take
- evidenceIds: list of relevant invoice or commitment reference tags`;

    return this.provider.structuredOutput<AIRiskReasoningResponse>(
      prompt,
      riskReasoningSchema,
      { systemInstruction: SYSTEM_PROMPTS.RISK_EXPLANATION }
    );
  }
}
