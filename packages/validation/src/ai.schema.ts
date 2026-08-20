import { z } from 'zod';
import { ConfidenceLevel } from '@netify/types';

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
  promisedDate: z.string().nullable().optional(), // YYYY-MM-DD
  description: z.string(),
  confidence: z.nativeEnum(ConfidenceLevel),
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

export type ExtractCommitmentInput = z.infer<typeof extractCommitmentInputSchema>;
export type ExtractedCommitmentOutput = z.infer<typeof extractedCommitmentOutputSchema>;
export type DraftMessageInput = z.infer<typeof draftMessageInputSchema>;
export type AIInvestigationInput = z.infer<typeof aiInvestigationInputSchema>;
