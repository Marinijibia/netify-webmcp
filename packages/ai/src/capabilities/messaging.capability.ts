import { z } from 'zod';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { SYSTEM_PROMPTS } from '../prompts';
import { AIDraftMessageRequest, AIDraftMessageResponse } from '@netify/types';

const draftMessageOutputSchema = z.object({
  messageText: z.string(),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  tone: z.string(),
  suggestedAction: z.string(),
  evidenceUsed: z.array(z.string()),
});

export class MessagingCapability {
  constructor(private readonly provider: AIProvider) {}

  async draftFollowupMessage(request: AIDraftMessageRequest): Promise<AIDraftMessageResponse> {
    const prompt = `Draft a follow-up collection message for an African SME owner:
Customer Name: ${request.customerName}
Channel: ${request.channel.toUpperCase()}
Tone: ${request.tone}
Total Outstanding: ${request.currency} ${request.totalOutstanding.toLocaleString()}
Suggested Payment Amount to Request: ${request.currency} ${(request.suggestedPaymentAmount || request.totalOutstanding).toLocaleString()}
Days Overdue: ${request.daysOverdue || 0}
Recent Commitment / Promise: ${request.recentCommitmentSummary || 'None on record'}

Instructions:
- Keep WhatsApp messages concise, respectful, and formatted with clean line breaks.
- Address the customer politely (e.g. "Good day Mr./Alhaji/Chief [Name]" or standard respectful greeting).
- Mention the specific amount and invite confirmation or bank transfer receipt.
- Do not be abusive or overly aggressive.

Return valid JSON matching:
{
  "messageText": "the exact message text",
  "channel": "${request.channel}",
  "tone": "${request.tone}",
  "suggestedAction": "Send WhatsApp / SMS to customer",
  "evidenceUsed": ["list of facts referenced in the message"]
}`;

    return this.provider.structuredOutput<AIDraftMessageResponse>(
      prompt,
      draftMessageOutputSchema,
      { systemInstruction: SYSTEM_PROMPTS.MESSAGE_DRAFTING }
    );
  }
}
