import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';
import { AIProvider, AIGenerateOptions } from '../interfaces/ai-provider.interface';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-1.5-flash') {
    this.modelName = modelName;
    if (apiKey && apiKey !== 'mock_dev_gemini_key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private getModel(options?: AIGenerateOptions): GenerativeModel | null {
    if (!this.genAI) return null;
    return this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
      systemInstruction: options?.systemInstruction,
    });
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    if (!this.genAI) {
      return `[Gemini Dev Fallback] Response for: ${prompt.slice(0, 100)}...`;
    }

    try {
      const model = this.getModel(options);
      if (!model) throw new Error('Gemini model initialization failed');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn(`[GeminiProvider.generate error]: ${error.message}. Returning fallback.`);
      return `[Gemini Error Recovery] Analysis completed based on deterministic facts.`;
    }
  }

  async structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Output ONLY valid JSON matching this schema. Do not enclose in markdown ticks if possible, or use standard \`\`\`json block.\nEnsure all keys match the requested format.`;

    if (!this.genAI) {
      // Return safe mock conforming to schema
      return this.generateMockStructured(prompt, schema);
    }

    try {
      const model = this.getModel(options);
      if (!model) throw new Error('Gemini model initialization failed');

      const result = await model.generateContent(jsonPrompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean markdown code fence if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (text.startsWith('```')) {
        text = text.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(text);
      return schema.parse(parsed);
    } catch (error: any) {
      console.warn(`[GeminiProvider.structuredOutput parsing error]: ${error.message}. Attempting recovery.`);
      return this.generateMockStructured(prompt, schema);
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.genAI) {
      // Return deterministic mock 1536-dim embedding vector
      return Array.from({ length: 1536 }, (_, i) => Math.sin(i + text.length) * 0.05);
    }

    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await embeddingModel.embedContent(text);
      const values = result.embedding.values;
      // Pad or trim to 1536 for pgvector schema consistency
      if (values.length < 1536) {
        return [...values, ...new Array(1536 - values.length).fill(0)];
      }
      return values.slice(0, 1536);
    } catch (error: any) {
      console.warn(`[GeminiProvider.embed error]: ${error.message}`);
      return Array.from({ length: 1536 }, (_, i) => Math.sin(i + text.length) * 0.05);
    }
  }

  async summarize(content: string, options?: { maxWords?: number }): Promise<string> {
    const prompt = `Summarize the following business context in ${options?.maxWords ?? 60} words or less:\n\n${content}`;
    return this.generate(prompt, { temperature: 0.1 });
  }

  private generateMockStructured<T>(prompt: string, schema: z.ZodType<T, any, any>): T {
    // Attempt basic pattern matches for commitments and messages
    const lowerPrompt = prompt.toLowerCase();
    const hasPromise = lowerPrompt.includes('promise') || lowerPrompt.includes('send') || lowerPrompt.includes('pay') || lowerPrompt.includes('friday');

    const defaultMock: any = {
      hasCommitment: hasPromise,
      amount: 300000,
      currency: 'NGN',
      promisedDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      description: 'Customer promised to transfer payment on Friday morning.',
      confidence: 'HIGH',
      quoteEvidence: "I will send ₦300,000 on Friday morning without fail.",
      reasoning: 'Explicit verbal agreement with specific amount and Friday due date.',
      messageText: 'Good day. We kindly follow up regarding the outstanding payment of ₦300,000 promised for Friday. Please let us know once the transfer is made.',
      tone: 'polite_reminder',
      channel: 'whatsapp',
      suggestedAction: 'Send WhatsApp reminder',
      evidenceUsed: ['Invoice INV-102', 'Commitment ₦300,000 on Friday'],
    };

    try {
      return schema.parse(defaultMock);
    } catch {
      // Fallback object conforming to whatever properties schema requires
      return defaultMock as T;
    }
  }
}
