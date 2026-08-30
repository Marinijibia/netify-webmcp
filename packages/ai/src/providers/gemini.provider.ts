import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';
import {
  AIProvider,
  AIGenerateOptions,
  StructuredAIResult,
} from '../interfaces/ai-provider.interface';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-3.5-flash') {
    this.modelName = modelName;
    const isPlaceholder = !apiKey || apiKey === 'mock_dev_gemini_key' || apiKey.startsWith('your_');
    if (!isPlaceholder) {
      this.genAI = new GoogleGenerativeAI(apiKey!);
    }
  }

  private getModelForName(name: string, options?: AIGenerateOptions, isJson: boolean = false): GenerativeModel | null {
    if (!this.genAI) return null;
    return this.genAI.getGenerativeModel({
      model: name,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 2048,
        ...(isJson ? { responseMimeType: 'application/json' } : {}),
      },
      systemInstruction: options?.systemInstruction,
    });
  }

  private getCandidateModels(): string[] {
    return Array.from(new Set([
      this.modelName,
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.7-flash',
    ])).filter(Boolean);
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini provider is not initialized. Please ensure a valid GEMINI_API_KEY is configured.');
    }

    const candidateModels = this.getCandidateModels();
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        const model = this.getModelForName(candidate, options, false);
        if (!model) continue;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        lastError = error;
        console.warn(`[GeminiProvider] Model ${candidate} failed: ${error.message}. Trying next candidate...`);
      }
    }

    throw new Error(`Gemini generation failed: ${lastError?.message || 'Unknown error'}`);
  }

  async structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Output ONLY valid JSON matching the requested schema. Ensure all keys match the requested format.`;

    if (!this.genAI) {
      throw new Error('Gemini API is not initialized. Please ensure GEMINI_API_KEY is configured.');
    }

    const candidateModels = this.getCandidateModels();
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        const model = this.getModelForName(candidate, options, true);
        if (!model) continue;

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
        lastError = error;
        console.warn(`[GeminiProvider.structuredOutput] Model ${candidate} failed: ${error.message}. Trying next candidate...`);
      }
    }

    throw new Error(`Gemini structured output failed: ${lastError?.message || 'Unknown error'}`);
  }


  async structuredOutputWithMetrics<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<StructuredAIResult<T>> {
    const startTime = Date.now();
    const data = await this.structuredOutput(prompt, schema, options);
    return {
      data,
      metrics: {
        model: this.modelName,
        latencyMs: Date.now() - startTime,
      },
    };
  }

  async embed(text: string): Promise<number[]> {
    if (!this.genAI) {
      // Return deterministic mock 1536-dim embedding vector
      return Array.from({ length: 1536 }, (_, i) => Math.sin(i + text.length) * 0.05);
    }

    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
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
}
