import { z } from 'zod';
import {
  AIProvider,
  AIGenerateOptions,
  StructuredAIResult,
} from '../interfaces/ai-provider.interface';

export class InnaProvider implements AIProvider {
  public readonly name = 'inna';
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey?: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey || process.env.INNA_API_KEY || '';
    this.baseUrl = baseUrl || process.env.INNA_BASE_URL || 'https://api.inna.ai/v1';
    this.model = model || process.env.INNA_MODEL || 'inna-sme-multilingual-v1';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('InnaProvider is not configured with an API key');
    }

    const startTime = Date.now();
    const systemPrompt =
      options?.systemInstruction ||
      'You are Netify AI Copilot, a helpful business intelligence assistant for African SMEs.';

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Inna API returned HTTP ${response.status}: ${errorText}`);
      }

      const result: any = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      return content.trim();
    } catch (err: any) {
      throw new Error(`Inna generation failed: ${err.message}`);
    }
  }

  async structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<T> {
    const res = await this.structuredOutputWithMetrics(prompt, schema, options);
    return res.data;
  }

  async structuredOutputWithMetrics<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<StructuredAIResult<T>> {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include markdown codeblocks or conversational text.`;
    const startTime = Date.now();
    const raw = await this.generate(jsonPrompt, options);
    const latencyMs = Date.now() - startTime;

    let cleanJson = raw.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanJson);
      const data = schema.parse(parsed);
      return {
        data,
        metrics: {
          model: this.model,
          latencyMs,
        },
      };
    } catch (err: any) {
      throw new Error(`Inna structured JSON validation failed: ${err.message}. Raw: ${cleanJson}`);
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.isConfigured()) {
      throw new Error('InnaProvider is not configured for embeddings');
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'inna-embed-v1',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Inna embeddings failed with HTTP ${response.status}`);
    }

    const json: any = await response.json();
    return json.data?.[0]?.embedding || [];
  }

  async summarize(content: string, options?: { maxWords?: number }): Promise<string> {
    const maxWords = options?.maxWords ?? 150;
    const prompt = `Summarize the following business context concisely in ${maxWords} words or less:\n\n${content}`;
    return this.generate(prompt, { temperature: 0.1 });
  }
}
