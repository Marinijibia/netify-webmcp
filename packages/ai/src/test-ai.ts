import { AIService } from './ai.service';

async function testAIAbstraction() {
  console.log('🧪 Testing Netify AI Provider Abstraction...');

  const aiService = new AIService({
    provider: 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY,
  });

  console.log(`Active Provider: ${aiService.getProviderName()}`);

  // 1. Test Commitment Extraction
  console.log('\n--- 1. Testing Informal Commitment Extraction ---');
  const sampleMessage = "Hello Alhaji, I will send ₦300,000 on Friday morning for invoice INV-102.";
  const extracted = await aiService.extractCommitment({
    text: sampleMessage,
    context: 'ABC Stores',
  });
  console.log('Extracted Promise:', JSON.stringify(extracted, null, 2));

  // 2. Test Risk Reasoning
  console.log('\n--- 2. Testing Risk Explanation ---');
  const riskExplanation = await aiService.explainRisk({
    customerId: 'cust-abc-1',
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
  });
  console.log('AI Risk Explanation:', JSON.stringify(riskExplanation, null, 2));

  // 3. Test Message Drafting
  console.log('\n--- 3. Testing Follow-up Message Generation ---');
  const messageDraft = await aiService.draftFollowupMessage({
    customerId: 'cust-abc-1',
    customerName: 'ABC Stores',
    currency: 'NGN',
    totalOutstanding: 850000,
    suggestedPaymentAmount: 300000,
    tone: 'polite_reminder',
    channel: 'whatsapp',
    daysOverdue: 21,
    recentCommitmentSummary: 'Promised ₦300,000 on Friday (MISSED)',
  });
  console.log('Draft Message:', JSON.stringify(messageDraft, null, 2));

  console.log('\n✅ AI Provider Abstraction verified successfully!');
}

testAIAbstraction().catch(console.error);
