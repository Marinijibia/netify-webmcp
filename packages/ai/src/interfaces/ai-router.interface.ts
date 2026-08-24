import { AIProvider } from './ai-provider.interface';
import { AppLanguage } from '@netify/validation';

export interface AIRoutingOptions {
  language?: AppLanguage;
  taskType?: 'chat' | 'extraction' | 'reasoning' | 'embedding' | 'message_draft';
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AIRoutingDecision {
  selectedProvider: AIProvider;
  providerName: string;
  targetLanguage: AppLanguage;
  isFallback: boolean;
  reason: string;
}

export interface AIRouterConfig {
  defaultProvider: 'gemini' | 'openai' | 'inna';
  enableInnaForAfricanLanguages?: boolean;
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  innaApiKey?: string;
  innaBaseUrl?: string;
  innaModel?: string;
}
