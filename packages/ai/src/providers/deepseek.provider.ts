import OpenAI from 'openai';
import { z } from 'zod';
import {
  AIProvider,
  AIGenerateOptions,
  StructuredAIResult,
} from '../interfaces/ai-provider.interface';

export class DeepSeekProvider implements AIProvider {
  public readonly name = 'deepseek';
  private client: OpenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'deepseek-chat', baseUrl: string = 'https://api.deepseek.com') {
    this.modelName = modelName;
    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'mock_prod_deepseek_key') {
      this.client = new OpenAI({
        apiKey: apiKey.trim(),
        baseURL: baseUrl,
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    if (!this.client) {
      throw new Error('DeepSeek provider is not configured. DEEPSEEK_API_KEY is missing or invalid.');
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (options?.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create(
        {
          model: this.modelName,
          messages,
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 2048,
        },
        { timeout: options?.timeoutMs ?? 15000 }
      );

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error(`[DeepSeekProvider.generate error]: ${error.message}`);
      throw new Error(`DeepSeek request failed: ${error.message}`);
    }
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
      throw new Error('DeepSeek provider is not configured. DEEPSEEK_API_KEY is missing or invalid.');
    }

    const startTime = Date.now();
    const systemPrompt = `${options?.systemInstruction || ''}\nIMPORTANT: You must respond ONLY with valid JSON matching the requested structure. Do not include markdown codeblocks or surrounding conversational text.`;

    try {
      const response = await this.client.chat.completions.create(
        {
          model: this.modelName,
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
      const validated = schema.parse(parsed);

      return {
        data: validated,
        metrics: {
          model: this.modelName,
          latencyMs: Date.now() - startTime,
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        },
      };
    } catch (error: any) {
      console.error(`[DeepSeekProvider.structuredOutput error]: ${error.message}`);
      throw new Error(`DeepSeek structured output failed: ${error.message}`);
    }
  }

  async embed(text: string): Promise<number[]> {
    throw new Error('DeepSeek embeddings not supported directly; use OpenAI text-embedding-3-small or Gemini.');
  }

  async summarize(content: string, options?: { maxWords?: number }): Promise<string> {
    const prompt = `Summarize the following business context in ${options?.maxWords ?? 60} words or less:\n\n${content}`;
    return this.generate(prompt, { temperature: 0.1 });
  }
}
