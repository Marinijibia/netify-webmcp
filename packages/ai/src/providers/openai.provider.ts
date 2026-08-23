import OpenAI from 'openai';
import { z } from 'zod';
import {
  AIProvider,
  AIGenerateOptions,
  StructuredAIResult,
} from '../interfaces/ai-provider.interface';

export class OpenAIProvider implements AIProvider {
  public readonly name = 'openai';
  private openai: OpenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gpt-4o-mini') {
    this.modelName = modelName;
    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'mock_prod_openai_key') {
      this.openai = new OpenAI({ apiKey: apiKey.trim() });
    }
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI provider is not configured. OPENAI_API_KEY is missing or invalid.');
    }

    const startTime = Date.now();
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (options?.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.openai.chat.completions.create(
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
      console.error(`[OpenAIProvider.generate error]: ${error.message}`);
      throw new Error(`OpenAI request failed: ${error.message}`);
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
    if (!this.openai) {
      throw new Error('OpenAI provider is not configured. OPENAI_API_KEY is missing or invalid.');
    }

    const startTime = Date.now();
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `${options?.systemInstruction ?? 'You are an intelligent business analyst for African SMEs.'}\nRespond strictly with valid JSON conforming to the requested schema. Do NOT include markdown code blocks.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.openai.chat.completions.create(
        {
          model: this.modelName,
          messages,
          response_format: { type: 'json_object' },
          temperature: options?.temperature ?? 0.1,
          max_tokens: options?.maxTokens ?? 2048,
        },
        { timeout: options?.timeoutMs ?? 15000 }
      );

      const latencyMs = Date.now() - startTime;
      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      const validatedData = schema.parse(parsed);

      return {
        data: validatedData,
        metrics: {
          model: this.modelName,
          latencyMs,
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        },
      };
    } catch (error: any) {
      console.error(`[OpenAIProvider.structuredOutput error]: ${error.message}`);
      throw new Error(`OpenAI structured generation failed: ${error.message}`);
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI provider is not configured for embeddings.');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536,
      });

      return response.data[0].embedding;
    } catch (error: any) {
      console.error(`[OpenAIProvider.embed error]: ${error.message}`);
      throw new Error(`OpenAI embedding failed: ${error.message}`);
    }
  }

  async summarize(content: string, options?: { maxWords?: number }): Promise<string> {
    const prompt = `Summarize the following business context in ${options?.maxWords ?? 60} words or less:\n\n${content}`;
    return this.generate(prompt, { temperature: 0.1 });
  }
}
