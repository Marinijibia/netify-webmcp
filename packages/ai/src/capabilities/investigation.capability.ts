import { z } from 'zod';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { SYSTEM_PROMPTS } from '../prompts';
import { AIInvestigationRequest, AIInvestigationResponse, AIActionType } from '@netify/types';

const investigationOutputSchema = z.object({
  answer: z.string(),
  classification: z.enum(['KNOWN', 'OBSERVED', 'PREDICTED', 'RECOMMENDED']),
  evidence: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['INVOICE', 'COMMITMENT', 'PAYMENT', 'CONVERSATION', 'HISTORICAL']),
      title: z.string(),
      description: z.string(),
      amount: z.number().optional(),
      currency: z.string().optional(),
      date: z.string().optional(),
      status: z.string().optional(),
      sourceReference: z.string().optional(),
    })
  ),
  suggestedActions: z.array(
    z.object({
      type: z.nativeEnum(AIActionType),
      title: z.string(),
      description: z.string(),
      actionPayload: z.record(z.any()).optional(),
    })
  ),
  insufficientDataNote: z.string().optional(),
});

export class InvestigationCapability {
  constructor(private readonly provider: AIProvider) {}

  async investigate(
    request: AIInvestigationRequest,
    context: {
      structuredFacts: string;
      semanticExcerpts: string;
      customerDetails?: string;
    }
  ): Promise<AIInvestigationResponse> {
    const prompt = `User Query: "${request.query}"

=== STRUCTURED DATABASE FACTS (Authoritative) ===
${context.structuredFacts}

=== BUSINESS MEMORY EXCERPTS (Semantic Context) ===
${context.semanticExcerpts}

=== CUSTOMER PROFILE ===
${context.customerDetails || 'Not customer-specific'}

=== INSTRUCTIONS ===
1. Answer the user's question clearly, concisely, and factually.
2. Explicitly classify your knowledge state as KNOWN, OBSERVED, PREDICTED, or RECOMMENDED.
3. List the exact verified evidence items from the structured facts or business memory.
4. Suggest 1-2 concrete, high-value actions (e.g. FOLLOW_UP_CALL, SEND_PAYMENT_REMINDER).
5. If the evidence does not support answering the question, state what is missing in "insufficientDataNote".

Return valid JSON conforming to the schema.`;

    return this.provider.structuredOutput<AIInvestigationResponse>(
      prompt,
      investigationOutputSchema,
      { systemInstruction: SYSTEM_PROMPTS.BASE_ASSISTANT }
    );
  }
}
