import { z } from 'zod';

export const AppLanguageEnum = z.enum(['en', 'ha', 'yo', 'ig', 'pcm']);
export type AppLanguage = z.infer<typeof AppLanguageEnum>;

export const UpdateLanguagePreferenceSchema = z.object({
  language: AppLanguageEnum,
});
export type UpdateLanguagePreferenceInput = z.infer<typeof UpdateLanguagePreferenceSchema>;

export const CommandCenterAttentionQuerySchema = z.object({
  currency: z.string().optional(),
  language: AppLanguageEnum.optional().default('en'),
});
export type CommandCenterAttentionQueryInput = z.infer<typeof CommandCenterAttentionQuerySchema>;

export const CommandCenterPrioritiesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  currency: z.string().optional(),
  language: AppLanguageEnum.optional().default('en'),
});
export type CommandCenterPrioritiesQueryInput = z.infer<typeof CommandCenterPrioritiesQuerySchema>;

export const CommandCenterBriefingQuerySchema = z.object({
  language: AppLanguageEnum.optional().default('en'),
  currency: z.string().optional(),
});
export type CommandCenterBriefingQueryInput = z.infer<typeof CommandCenterBriefingQuerySchema>;

export const AIConversationCreateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  language: AppLanguageEnum.optional().default('en'),
  initialMessage: z.string().min(1).max(2000).optional(),
});
export type AIConversationCreateInput = z.infer<typeof AIConversationCreateSchema>;

export const AISendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  language: AppLanguageEnum.optional().default('en'),
  customerId: z.string().uuid().optional(),
});
export type AISendMessageInput = z.infer<typeof AISendMessageSchema>;

export const ActionProposalStatusEnum = z.enum([
  'SUGGESTED',
  'CONFIRMED',
  'EXECUTED',
  'REJECTED',
  'EXPIRED',
]);
export type ActionProposalStatus = z.infer<typeof ActionProposalStatusEnum>;

export const AIActionConfirmSchema = z.object({
  actionProposalId: z.string().uuid(),
  confirm: z.boolean(),
  notes: z.string().max(500).optional(),
});
export type AIActionConfirmInput = z.infer<typeof AIActionConfirmSchema>;

export const StructuredBusinessIntentTypeEnum = z.enum([
  'COLLECTION_PRIORITY',
  'CUSTOMER_LOOKUP',
  'RECEIVABLE_SUMMARY',
  'COLLECTION_HISTORY',
  'PAYMENT_ANALYSIS',
  'BUSINESS_TREND',
  'DRAFT_COLLECTION_MESSAGE',
  'CREATE_FOLLOW_UP',
  'BUSINESS_EXPLANATION',
  'GENERAL_QA',
]);
export type StructuredBusinessIntentType = z.infer<typeof StructuredBusinessIntentTypeEnum>;

export const StructuredBusinessIntentSchema = z.object({
  intentType: StructuredBusinessIntentTypeEnum,
  confidence: z.number().min(0).max(1),
  detectedLanguage: AppLanguageEnum,
  isCodeSwitched: z.boolean().default(false),
  extractedParameters: z.object({
    customerQuery: z.string().optional(),
    customerId: z.string().uuid().optional(),
    receivableId: z.string().uuid().optional(),
    timeWindowDays: z.number().optional(),
    tone: z.string().optional(),
    channel: z.string().optional(),
    targetDueDate: z.string().optional(),
  }),
});
export type StructuredBusinessIntent = z.infer<typeof StructuredBusinessIntentSchema>;
