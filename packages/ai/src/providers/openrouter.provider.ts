import OpenAI from 'openai';
import { z } from 'zod';
import {
  AIProvider,
  AIGenerateOptions,
  StructuredAIResult,
} from '../interfaces/ai-provider.interface';

export class OpenRouterProvider implements AIProvider {
  public readonly name = 'openrouter';
  private client: OpenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'openai/gpt-5.6-luna', baseUrl: string = 'https://openrouter.ai/api/v1') {
    this.modelName = modelName;
    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'mock_prod_openrouter_key') {
      this.client = new OpenAI({
        apiKey: apiKey.trim(),
        baseURL: baseUrl,
        defaultHeaders: {
          'HTTP-Referer': 'https://app.netify.ng',
          'X-Title': 'Netify AI Debt Collections',
        },
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  setModel(modelName: string): void {
    this.modelName = modelName;
  }

  private getCandidateModels(): string[] {
    return Array.from(new Set([
      this.modelName,
      // 🥇 Frontier OpenAI Series
      'openai/gpt-5.6-luna',
      'openai/gpt-5.6-luna-pro',
      'openai/gpt-chat-latest',
      'openai/gpt-5.6-terra',
      'openai/gpt-4o-mini',
      // 🥈 Frontier Google Gemini Series
      'google/gemini-3.8-flash',
      'google/gemini-3.7-flash',
      'google/gemini-3.5-flash-lite',
      // 🥉 Frontier DeepSeek Series
      'deepseek/deepseek-v4-flash',
      'deepseek/deepseek-v4-pro',
      'deepseek/deepseek-v3.2',
    ])).filter(Boolean);
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    if (!this.client) {
      throw new Error('OpenRouter provider is not configured. OPENROUTER_API_KEY is missing or invalid.');
    }

    const candidateModels = this.getCandidateModels();
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (options?.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.client.chat.completions.create(
          {
            model: candidate,
            messages,
            temperature: options?.temperature ?? 0.2,
            max_tokens: options?.maxTokens ?? 2048,
          },
          { timeout: options?.timeoutMs ?? 15000 }
        );

        return response.choices[0]?.message?.content || '';
      } catch (error: any) {
        lastError = error;
        console.warn(`[OpenRouterProvider.generate] Candidate ${candidate} failed, attempting next available... Error: ${error.message}`);
      }
    }

    throw new Error(`OpenRouter request failed across all candidates. Last error: ${lastError?.message || 'Unknown'}`);
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
    if (!this.client) {
      throw new Error('OpenRouter provider is not configured. OPENROUTER_API_KEY is missing or invalid.');
    }

    const startTime = Date.now();
    const systemPrompt = `${options?.systemInstruction || ''}\nIMPORTANT: You must respond ONLY with valid JSON matching the requested structure. Do not include markdown codeblocks or surrounding conversational text.`;
    const candidateModels = this.getCandidateModels();
    let lastError: any = null;

    for (const candidate of candidateModels) {
      try {
        const response = await this.client.chat.completions.create(
          {
            model: candidate,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: options?.temperature ?? 0.1,
            response_format: { type: 'json_object' },
          },
          { timeout: options?.timeoutMs ?? 20000 }
        );

        const raw = response.choices[0]?.message?.content || '{}';
        const cleanJson = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);
        const validatedData = schema.parse(parsed);

        return {
          data: validatedData,
          metrics: {
            model: candidate,
            latencyMs: Date.now() - startTime,
            inputTokens: response.usage?.prompt_tokens,
            outputTokens: response.usage?.completion_tokens,
          },
        };
      } catch (error: any) {
        lastError = error;
        console.warn(`[OpenRouterProvider.structuredOutput] Candidate ${candidate} failed, attempting next available... Error: ${error.message}`);
      }
    }

    throw new Error(`OpenRouter structured output failed across all candidates: ${lastError?.message || 'Unknown'}`);
  }

  async embed(text: string): Promise<number[]> {
    throw new Error('OpenRouter embeddings not supported directly; use OpenAI text-embedding-3-small or Gemini.');
  }

  async summarize(content: string, options?: { maxWords?: number }): Promise<string> {
    const prompt = `Summarize the following business context in ${options?.maxWords ?? 60} words or less:\n\n${content}`;
    return this.generate(prompt, { temperature: 0.1 });
  }
}
