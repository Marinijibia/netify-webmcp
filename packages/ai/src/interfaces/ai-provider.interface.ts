import { z } from 'zod';

export interface AIGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

export interface AIProvider {
  name: string;

  /**
   * Generates plain text response given a prompt and optional system instructions.
   */
  generate(prompt: string, options?: AIGenerateOptions): Promise<string>;

  /**
   * Generates strictly validated structured output matching a Zod schema.
   */
  structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: AIGenerateOptions
  ): Promise<T>;

  /**
   * Generates dense vector embeddings for semantic business memory search.
   */
  embed(text: string): Promise<number[]>;

  /**
   * Summarizes unstructured business notes, transcripts, or conversations.
   */
  summarize(content: string, options?: { maxWords?: number }): Promise<string>;
}
