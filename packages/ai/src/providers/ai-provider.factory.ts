import { AIProvider } from '../interfaces/ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { InnaProvider } from './inna.provider';
import {
  AIRouterConfig,
  AIRoutingOptions,
  AIRoutingDecision,
} from '../interfaces/ai-router.interface';
import { AppLanguage } from '@netify/validation';

export class AIProviderFactory {
  private geminiProvider?: GeminiProvider;
  private openaiProvider?: OpenAIProvider;
  private innaProvider?: InnaProvider;
  private config: AIRouterConfig;

  constructor(config: AIRouterConfig) {
    this.config = config;

    // Initialize Gemini
    if (config.geminiApiKey) {
      this.geminiProvider = new GeminiProvider(
        config.geminiApiKey,
        config.geminiModel || 'gemini-1.5-flash'
      );
    }

    // Initialize OpenAI
    if (config.openaiApiKey) {
      this.openaiProvider = new OpenAIProvider(
        config.openaiApiKey,
        config.openaiModel || 'gpt-4o-mini'
      );
    }

    // Initialize Inna
    if (config.innaApiKey) {
      this.innaProvider = new InnaProvider(
        config.innaApiKey,
        config.innaBaseUrl,
        config.innaModel
      );
    }
  }

  getProvider(name: 'gemini' | 'openai' | 'inna'): AIProvider | undefined {
    switch (name) {
      case 'gemini':
        return this.geminiProvider;
      case 'openai':
        return this.openaiProvider;
      case 'inna':
        return this.innaProvider;
      default:
        return undefined;
    }
  }

  resolveProvider(options?: AIRoutingOptions): AIRoutingDecision {
    const targetLanguage: AppLanguage = options?.language || 'en';
    const isAfricanLanguage = ['ha', 'yo', 'ig', 'pcm'].includes(targetLanguage);

    // 1. If African language and Inna is enabled and configured, route to Inna
    if (
      isAfricanLanguage &&
      this.config.enableInnaForAfricanLanguages &&
      this.innaProvider?.isConfigured()
    ) {
      return {
        selectedProvider: this.innaProvider,
        providerName: 'inna',
        targetLanguage,
        isFallback: false,
        reason: `Routed to Inna provider for native African language support (${targetLanguage}).`,
      };
    }

    // 2. Otherwise route to configured default provider
    const defaultName = this.config.defaultProvider || 'gemini';
    let primary = this.getProvider(defaultName);

    if (primary) {
      return {
        selectedProvider: primary,
        providerName: defaultName,
        targetLanguage,
        isFallback: isAfricanLanguage && defaultName !== 'inna',
        reason: isAfricanLanguage
          ? `Routed to ${defaultName} multilingual capability for language ${targetLanguage}.`
          : `Routed to primary configured provider (${defaultName}).`,
      };
    }

    // 3. Fallback to any available configured provider
    if (this.geminiProvider) {
      return {
        selectedProvider: this.geminiProvider,
        providerName: 'gemini',
        targetLanguage,
        isFallback: true,
        reason: 'Fallback to Gemini provider (primary provider unavailable).',
      };
    }

    if (this.openaiProvider) {
      return {
        selectedProvider: this.openaiProvider,
        providerName: 'openai',
        targetLanguage,
        isFallback: true,
        reason: 'Fallback to OpenAI provider (primary provider unavailable).',
      };
    }

    // 4. Default instance as last resort
    const fallbackGemini = new GeminiProvider(this.config.geminiApiKey);
    return {
      selectedProvider: fallbackGemini,
      providerName: 'gemini',
      targetLanguage,
      isFallback: true,
      reason: 'Initialized default Gemini fallback provider.',
    };
  }
}
