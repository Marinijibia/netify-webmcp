import { AIProvider } from '../interfaces/ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { OpenRouterProvider } from './openrouter.provider';
import {
  AIRouterConfig,
  AIRoutingOptions,
  AIRoutingDecision,
  AIProviderName,
} from '../interfaces/ai-router.interface';
import { AppLanguage } from '@netify/validation';

export class AIProviderFactory {
  private openaiProvider?: OpenAIProvider;
  private geminiProvider?: GeminiProvider;
  private deepseekProvider?: DeepSeekProvider;
  private openrouterProvider?: OpenRouterProvider;
  private config: AIRouterConfig;

  constructor(config: AIRouterConfig) {
    this.config = config;

    // 1. Initialize Direct OpenAI (ChatGPT)
    if (config.openaiApiKey && config.openaiApiKey.trim().length > 0 && config.openaiApiKey !== 'mock_prod_openai_key') {
      this.openaiProvider = new OpenAIProvider(
        config.openaiApiKey,
        config.openaiModel || 'gpt-4o-mini'
      );
    }

    // 2. Initialize Direct Google Gemini
    if (config.geminiApiKey && config.geminiApiKey.trim().length > 0 && config.geminiApiKey !== 'mock_prod_gemini_key') {
      this.geminiProvider = new GeminiProvider(
        config.geminiApiKey,
        config.geminiModel || 'gemini-1.5-flash'
      );
    }

    // 3. Initialize Direct DeepSeek
    if (config.deepseekApiKey && config.deepseekApiKey.trim().length > 0 && config.deepseekApiKey !== 'mock_prod_deepseek_key') {
      this.deepseekProvider = new DeepSeekProvider(
        config.deepseekApiKey,
        config.deepseekModel || 'deepseek-chat',
        config.deepseekBaseUrl || 'https://api.deepseek.com'
      );
    }

    // 4. Initialize Universal OpenRouter Hub (Fallback when direct keys not provided)
    if (config.openrouterApiKey && config.openrouterApiKey.trim().length > 0 && config.openrouterApiKey !== 'mock_prod_openrouter_key') {
      this.openrouterProvider = new OpenRouterProvider(
        config.openrouterApiKey,
        config.openrouterModel || 'openai/gpt-4o-mini'
      );
    }
  }

  getProvider(name: AIProviderName): AIProvider | undefined {
    switch (name) {
      case 'openai':
        return this.openaiProvider;
      case 'gemini':
        return this.geminiProvider;
      case 'deepseek':
        return this.deepseekProvider;
      case 'openrouter':
        return this.openrouterProvider;
      default:
        return undefined;
    }
  }

  /**
   * Resolves the active AI provider based on available direct API keys or OpenRouter fallback.
   * Priority Cascade:
   * 1. Direct ChatGPT (OpenAI)
   * 2. Direct Google Gemini
   * 3. Direct DeepSeek
   * 4. OpenRouter Universal Hub
   */
  resolveProvider(options?: AIRoutingOptions): AIRoutingDecision {
    const targetLanguage: AppLanguage = options?.language || 'en';

    // Check explicitly configured default first if available
    if (this.config.defaultProvider) {
      const explicit = this.getProvider(this.config.defaultProvider);
      if (explicit) {
        return {
          selectedProvider: explicit,
          providerName: this.config.defaultProvider,
          targetLanguage,
          isFallback: false,
          reason: `Routed to explicitly configured provider: ${this.config.defaultProvider}.`,
        };
      }
    }

    // 1. Direct ChatGPT Primary
    if (this.openaiProvider) {
      return {
        selectedProvider: this.openaiProvider,
        providerName: 'openai',
        targetLanguage,
        isFallback: false,
        reason: 'Routed to Direct ChatGPT (OpenAI) primary intelligence engine.',
      };
    }

    // 2. Direct Gemini Fallback
    if (this.geminiProvider) {
      return {
        selectedProvider: this.geminiProvider,
        providerName: 'gemini',
        targetLanguage,
        isFallback: true,
        reason: 'Routed to Direct Google Gemini high-speed multimodal fallback.',
      };
    }

    // 3. Direct DeepSeek Fallback
    if (this.deepseekProvider) {
      return {
        selectedProvider: this.deepseekProvider,
        providerName: 'deepseek',
        targetLanguage,
        isFallback: true,
        reason: 'Routed to Direct DeepSeek deep financial reasoning fallback.',
      };
    }

    // 4. OpenRouter Universal Hub
    if (this.openrouterProvider) {
      return {
        selectedProvider: this.openrouterProvider,
        providerName: 'openrouter',
        targetLanguage,
        isFallback: true,
        reason: 'Routed to OpenRouter Universal AI Hub (direct API keys not provided).',
      };
    }

    // 5. Ultimate Mock / Standby
    const mock = new OpenAIProvider('mock_prod_openai_key', 'gpt-4o-mini');
    return {
      selectedProvider: mock,
      providerName: 'openai',
      targetLanguage,
      isFallback: true,
      reason: 'No live AI API keys detected; initialized in deterministic standby mode.',
    };
  }

  /**
   * Executes an AI operation with automatic multi-model failover cascade.
   */
  async executeWithCascade<T>(
    operation: (provider: AIProvider) => Promise<T>,
    options?: AIRoutingOptions
  ): Promise<T> {
    const providersToTry: { name: AIProviderName; provider?: AIProvider }[] = [
      { name: 'openai' as AIProviderName, provider: this.openaiProvider },
      { name: 'gemini' as AIProviderName, provider: this.geminiProvider },
      { name: 'deepseek' as AIProviderName, provider: this.deepseekProvider },
      { name: 'openrouter' as AIProviderName, provider: this.openrouterProvider },
    ].filter((p) => Boolean(p.provider));

    let lastError: any = null;

    for (const item of providersToTry) {
      try {
        if (item.provider) {
          return await operation(item.provider);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AIProviderFactory Cascade] Provider ${item.name} failed, cascading to next available provider... Error: ${err.message}`);
      }
    }

    throw new Error(lastError ? `All AI providers in cascade failed. Last error: ${lastError.message}` : 'No AI providers configured');
  }
}
