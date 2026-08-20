import { AIProvider } from '../interfaces/ai-provider.interface';

export class MemoryCapability {
  constructor(private readonly provider: AIProvider) {}

  async generateMemoryEmbedding(content: string): Promise<number[]> {
    return this.provider.embed(content);
  }

  async summarizeMemoryChunk(content: string): Promise<string> {
    return this.provider.summarize(content, { maxWords: 50 });
  }
}
