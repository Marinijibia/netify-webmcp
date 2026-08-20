import { AIProvider } from '../interfaces/ai-provider.interface';
import { SYSTEM_PROMPTS } from '../prompts';
import {
  extractedCommitmentOutputSchema,
  ExtractedCommitmentOutput,
  ExtractCommitmentInput,
} from '@netify/validation';

export class ExtractionCapability {
  constructor(private readonly provider: AIProvider) {}

  async extractCommitment(input: ExtractCommitmentInput): Promise<ExtractedCommitmentOutput> {
    const today = input.currentDate || new Date().toISOString().split('T')[0];

    const prompt = `Analyze this text for payment commitments or promises:
Text: "${input.text}"
Context/Customer: "${input.context || 'General Customer Communication'}"
Current Reference Date: ${today}

Identify if a payment commitment was made. If so, calculate the exact ISO promised date relative to ${today}.
Format as valid JSON matching:
{
  "hasCommitment": boolean,
  "amount": number or null,
  "currency": string (e.g. "NGN"),
  "promisedDate": "YYYY-MM-DD" or null,
  "description": string,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "quoteEvidence": string,
  "reasoning": string
}`;

    return this.provider.structuredOutput<ExtractedCommitmentOutput>(
      prompt,
      extractedCommitmentOutputSchema,
      { systemInstruction: SYSTEM_PROMPTS.COMMITMENT_EXTRACTION }
    );
  }
}
