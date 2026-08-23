import { z } from 'zod';

export const AIUrgencyLevelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const AIConfidenceLevelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const AIRecommendationActionEnum = z.enum([
  'FOLLOW_UP_NOW',
  'FOLLOW_UP_LATER',
  'REQUEST_PAYMENT_DATE',
  'REQUEST_PARTIAL_PAYMENT',
  'REVIEW_COMMITMENT',
  'CHANGE_COLLECTION_CHANNEL',
  'ESCALATE',
  'NO_ACTION',
]);
export const AIRecommendationStatusEnum = z.enum([
  'ACTIVE',
  'ACCEPTED',
  'DISMISSED',
  'EXPIRED',
]);
export const CollectionChannelEnum = z.enum([
  'WHATSAPP',
  'SMS',
  'PHONE_CALL',
  'IN_PERSON',
  'EMAIL',
]);
export const CollectionToneEnum = z.enum([
  'RESPECTFUL_REMINDER',
  'DIRECT_FOLLOWUP',
  'URGENT_ESCALATION',
  'PARTIAL_PAYMENT_PROPOSAL',
]);

// ==========================================
// REQUEST QUERY / BODY SCHEMAS
// ==========================================

export const PriorityCustomerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  urgency: AIUrgencyLevelEnum.optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  currency: z.string().optional(),
});

export const CustomerExplainInputSchema = z.object({
  receivableId: z.string().uuid().optional(),
});

export const CustomerRecommendationInputSchema = z.object({
  receivableId: z.string().uuid().optional(),
  preferredChannel: CollectionChannelEnum.optional(),
});

export const CustomerSummaryInputSchema = z.object({
  timeWindowDays: z.coerce.number().int().positive().default(90),
});

export const DraftMessageInputSchema = z.object({
  channel: CollectionChannelEnum.default('WHATSAPP'),
  tone: CollectionToneEnum.default('RESPECTFUL_REMINDER'),
  receivableId: z.string().uuid().optional(),
  customNote: z.string().max(500).optional(),
});

export const BusinessQAInputSchema = z.object({
  query: z.string().min(2, 'Question must be at least 2 characters').max(500, 'Question too long'),
  customerId: z.string().uuid().optional(),
  timeWindowDays: z.coerce.number().int().positive().default(30),
});

export const UpdateRecommendationStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DISMISSED']),
  dismissalReason: z.string().max(300).optional(),
});

export const TodayAttentionQuerySchema = z.object({
  currency: z.string().optional(),
});

// Legacy schemas kept for backward compatibility
export const extractCommitmentInputSchema = z.object({
  text: z.string().min(3, 'Text is required for extraction'),
  customerId: z.string().uuid().optional(),
  currentDate: z.string().optional(),
  context: z.string().optional(),
});

export const extractedCommitmentOutputSchema = z.object({
  hasCommitment: z.boolean(),
  amount: z.number().nullable().optional(),
  currency: z.string().default('NGN'),
  promisedDate: z.string().nullable().optional(),
  description: z.string(),
  confidence: AIConfidenceLevelEnum,
  quoteEvidence: z.string(),
  reasoning: z.string(),
});

export const draftMessageInputSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  tone: z.enum(['polite_reminder', 'firm_followup', 'urgent_escalation', 'payment_plan']).default('polite_reminder'),
  channel: z.enum(['whatsapp', 'sms', 'email']).default('whatsapp'),
  suggestedPaymentAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const aiInvestigationInputSchema = z.object({
  query: z.string().min(2, 'Query is required'),
  customerId: z.string().uuid().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

// ==========================================
// STRUCTURED OUTPUT SCHEMAS (LLM Grounding)
// ==========================================

export const CustomerExplanationOutputSchema = z.object({
  summary: z.string().min(1),
  whyItMatters: z.string().min(1),
  recentHistory: z.string().min(1),
  recommendation: z.string().min(1),
  confidence: AIConfidenceLevelEnum.default('HIGH'),
  evidenceMemoryIds: z.array(z.string()).default([]),
  evidenceEventIds: z.array(z.string()).default([]),
});

export const CollectionRecommendationOutputSchema = z.object({
  action: AIRecommendationActionEnum,
  urgency: AIUrgencyLevelEnum,
  title: z.string().min(1),
  reasoningSummary: z.string().min(1),
  suggestedChannel: CollectionChannelEnum.default('WHATSAPP'),
  suggestedMessage: z.string().min(1),
  confidence: AIConfidenceLevelEnum.default('HIGH'),
  evidenceMemoryIds: z.array(z.string()).default([]),
  evidenceEventIds: z.array(z.string()).default([]),
});

export const CollectionMessageDraftOutputSchema = z.object({
  channel: CollectionChannelEnum,
  tone: CollectionToneEnum,
  recipientName: z.string(),
  recipientContact: z.string().default(''),
  subject: z.string().optional(),
  messageBody: z.string().min(1),
  callScriptPoints: z.array(z.string()).optional(),
  culturalNotes: z.string().optional(),
  verifiedOutstandingAmount: z.number().nonnegative(),
  currency: z.string(),
});

export const CustomerSummaryOutputSchema = z.object({
  balanceOverview: z.string(),
  paymentBehaviorSummary: z.string(),
  commitmentHistorySummary: z.string(),
  keyMemories: z.array(z.string()).default([]),
  keyEvents: z.array(z.string()).default([]),
  strategicRecommendation: z.string(),
  confidence: AIConfidenceLevelEnum.default('HIGH'),
});

export const BusinessQAOutputSchema = z.object({
  intent: z.string(),
  answer: z.string().min(1),
  keyFigures: z.record(z.any()).default({}),
  citations: z.array(z.string()).default([]),
  suggestedFollowUps: z.array(z.string()).default([]),
  confidence: AIConfidenceLevelEnum.default('HIGH'),
});

export const DailyBriefingOutputSchema = z.object({
  greeting: z.string(),
  executiveSummary: z.string(),
  focusAreas: z.array(z.string()).default([]),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type PriorityCustomerQueryInput = z.input<typeof PriorityCustomerQuerySchema>;
export type PriorityCustomerQueryOutput = z.infer<typeof PriorityCustomerQuerySchema>;

export type CustomerExplainInput = z.input<typeof CustomerExplainInputSchema>;
export type CustomerRecommendationInput = z.input<typeof CustomerRecommendationInputSchema>;
export type CustomerSummaryInput = z.input<typeof CustomerSummaryInputSchema>;
export type DraftMessageInput = z.input<typeof DraftMessageInputSchema>;
export type BusinessQAInput = z.input<typeof BusinessQAInputSchema>;
export type UpdateRecommendationStatusInput = z.input<typeof UpdateRecommendationStatusSchema>;
export type TodayAttentionQueryInput = z.input<typeof TodayAttentionQuerySchema>;

export type CustomerExplanationOutput = z.infer<typeof CustomerExplanationOutputSchema>;
export type CollectionRecommendationOutput = z.infer<typeof CollectionRecommendationOutputSchema>;
export type CollectionMessageDraftOutput = z.infer<typeof CollectionMessageDraftOutputSchema>;
export type CustomerSummaryOutput = z.infer<typeof CustomerSummaryOutputSchema>;
export type BusinessQAOutput = z.infer<typeof BusinessQAOutputSchema>;
export type DailyBriefingOutput = z.infer<typeof DailyBriefingOutputSchema>;

export type ExtractCommitmentInput = z.infer<typeof extractCommitmentInputSchema>;
export type ExtractedCommitmentOutput = z.infer<typeof extractedCommitmentOutputSchema>;
export type AIInvestigationInput = z.infer<typeof aiInvestigationInputSchema>;
