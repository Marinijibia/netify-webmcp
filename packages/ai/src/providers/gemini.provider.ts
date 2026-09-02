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

  constructor(apiKey?: string, modelName: string = 'gemini-3.8-flash') {
    this.modelName = modelName;
    const isPlaceholder = !apiKey || apiKey === 'mock_dev_gemini_key' || apiKey.startsWith('your_');
    if (!isPlaceholder) {
      this.genAI = new GoogleGenerativeAI(apiKey!);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.genAI);
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
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-2.0-flash',
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
        console.warn(`[GeminiProvider.generate] Candidate ${candidate} failed, attempting next available... Error: ${error.message}`);
      }
    }

    throw new Error(`All Gemini candidate models failed. Last error: ${lastError?.message || 'Unknown'}`);
  }

  async structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<T> {
    const result = await this.structuredOutputWithMetrics(prompt, schema, options);
    return result.data;
  }

  async structuredOutputWithMetrics<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<StructuredAIResult<T>> {
    if (!this.genAI) {
      throw new Error('Gemini provider is not initialized. Please ensure a valid GEMINI_API_KEY is configured.');
    }

    const startTime = Date.now();
    const candidateModels = this.getCandidateModels();
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        const model = this.getModelForName(candidate, options, true);
        if (!model) continue;

        const systemInstruction = options?.systemInstruction
          ? `${options.systemInstruction}\nOutput valid JSON conforming to the requested schema.`
          : 'Output valid JSON conforming to the requested schema.';

        const fullPrompt = `${systemInstruction}\n\nTask:\n${prompt}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const latencyMs = Date.now() - startTime;
        const text = response.text();

        const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);
        const validatedData = schema.parse(parsed);

        return {
          data: validatedData,
          metrics: {
            model: candidate,
            latencyMs,
            inputTokens: response.usageMetadata?.promptTokenCount,
            outputTokens: response.usageMetadata?.candidatesTokenCount,
          },
        };
      } catch (error: any) {
        lastError = error;
        console.warn(`[GeminiProvider.structuredOutput] Candidate ${candidate} failed, attempting next available... Error: ${error.message}`);
      }
    }

    throw new Error(`Gemini structured generation failed across all candidates: ${lastError?.message || 'Unknown'}`);
  }

  async embed(text: string): Promise<number[]> {
    if (!this.genAI) {
      throw new Error('Gemini provider is not initialized for embeddings.');
    }

    const embeddingModels = ['text-embedding-004', 'embedding-001'];
    let lastError: any = null;

    for (const modelName of embeddingModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(text);
        return result.embedding.values;
      } catch (error: any) {
        lastError = error;
      }
    }

    throw new Error(`Gemini embedding failed: ${lastError?.message || 'Unknown'}`);
  }

  async summarize(content: string, options?: { maxWords?: number }): Promise<string> {
    const prompt = `Summarize the following business context in ${options?.maxWords ?? 60} words or less:\n\n${content}`;
    return this.generate(prompt, { temperature: 0.1 });
  }
}
