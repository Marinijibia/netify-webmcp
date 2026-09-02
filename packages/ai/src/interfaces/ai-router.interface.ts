import { AIProvider } from './ai-provider.interface';
import { AppLanguage } from '@netify/validation';

export type AIProviderName = 'openai' | 'gemini' | 'deepseek' | 'openrouter';

export interface AIRoutingOptions {
  language?: AppLanguage;
  taskType?: 'chat' | 'extraction' | 'reasoning' | 'embedding' | 'message_draft';
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AIRoutingDecision {
  selectedProvider: AIProvider;
  providerName: AIProviderName;
  targetLanguage: AppLanguage;
  isFallback: boolean;
  reason: string;
}

export interface AIRouterConfig {
  defaultProvider?: AIProviderName;
  // Direct Provider Keys
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  deepseekApiKey?: string;
  deepseekModel?: string;
  deepseekBaseUrl?: string;
  // OpenRouter Universal Fallback Key
  openrouterApiKey?: string;
  openrouterModel?: string;
}
