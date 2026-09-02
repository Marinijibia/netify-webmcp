import { AIProvider } from './interfaces/ai-provider.interface';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { ExtractionCapability } from './capabilities/extraction.capability';
import { RiskReasoningCapability } from './capabilities/risk-reasoning.capability';
import { MessagingCapability } from './capabilities/messaging.capability';
import { InvestigationCapability } from './capabilities/investigation.capability';
import { MemoryCapability } from './capabilities/memory.capability';
import { IntentRoutingCapability } from './capabilities/intent-routing.capability';
import {
  AIRouterConfig,
  AIRoutingOptions,
  AIRoutingDecision,
  AIProviderName,
} from './interfaces/ai-router.interface';
import {
  ExtractCommitmentInput,
  ExtractedCommitmentOutput,
  StructuredBusinessIntent,
  AppLanguage,
} from '@netify/validation';
import {
  DeterministicRiskSignals,
  AIRiskReasoningResponse,
  AIDraftMessageRequest,
  AIDraftMessageResponse,
  AIInvestigationRequest,
  AIInvestigationResponse,
} from '@netify/types';

export interface AIServiceConfig extends Partial<AIRouterConfig> {
  provider?: AIProviderName;
}

export class AIService {
  private factory: AIProviderFactory;
  private defaultProvider: AIProvider;
  public readonly extraction: ExtractionCapability;
  public readonly risk: RiskReasoningCapability;
  public readonly messaging: MessagingCapability;
  public readonly investigation: InvestigationCapability;
  public readonly memory: MemoryCapability;
  public readonly intent: IntentRoutingCapability;

  constructor(config: AIServiceConfig) {
    const routerConfig: AIRouterConfig = {
      defaultProvider: config.provider || config.defaultProvider || 'openai',
      openaiApiKey: config.openaiApiKey,
      openaiModel: config.openaiModel,
      geminiApiKey: config.geminiApiKey,
      geminiModel: config.geminiModel,
      deepseekApiKey: config.deepseekApiKey,
      deepseekModel: config.deepseekModel,
      deepseekBaseUrl: config.deepseekBaseUrl,
      openrouterApiKey: config.openrouterApiKey,
      openrouterModel: config.openrouterModel,
    };

    this.factory = new AIProviderFactory(routerConfig);
    const initialDecision = this.factory.resolveProvider({ language: 'en' });
    this.defaultProvider = initialDecision.selectedProvider;

    this.extraction = new ExtractionCapability(this.defaultProvider);
    this.risk = new RiskReasoningCapability(this.defaultProvider);
    this.messaging = new MessagingCapability(this.defaultProvider);
    this.investigation = new InvestigationCapability(this.defaultProvider);
    this.memory = new MemoryCapability(this.defaultProvider);
    this.intent = new IntentRoutingCapability(this.defaultProvider);
  }

  getFactory(): AIProviderFactory {
    return this.factory;
  }

  resolveProvider(options?: AIRoutingOptions): AIRoutingDecision {
    return this.factory.resolveProvider(options);
  }

  getProvider(name: AIProviderName): AIProvider | undefined {
    return this.factory.getProvider(name);
  }

  getProviderName(): string {
    return this.defaultProvider.name;
  }

  async embed(text: string): Promise<number[]> {
    return this.defaultProvider.embed(text);
  }

  async summarize(content: string, options?: { maxWords?: number }): Promise<string> {
    return this.defaultProvider.summarize(content, options);
  }

  async extractCommitment(
    input: ExtractCommitmentInput,
    options?: AIRoutingOptions
  ): Promise<ExtractedCommitmentOutput> {
    const provider = this.factory.resolveProvider(options).selectedProvider;
    const capability = new ExtractionCapability(provider);
    return capability.extractCommitment(input);
  }

  async detectIntent(
    query: string,
    preferredLanguage?: AppLanguage,
    options?: AIRoutingOptions
  ): Promise<StructuredBusinessIntent> {
    const provider = this.factory.resolveProvider(options).selectedProvider;
    const capability = new IntentRoutingCapability(provider);
    return capability.detectIntentAndLanguage(query, preferredLanguage);
  }

  async detectIntentAndLanguage(
    query: string,
    preferredLanguage?: AppLanguage,
    options?: AIRoutingOptions
  ): Promise<StructuredBusinessIntent> {
    const provider = this.factory.resolveProvider(options).selectedProvider;
    const capability = new IntentRoutingCapability(provider);
    return capability.detectIntentAndLanguage(query, preferredLanguage);
  }

  async explainRisk(
    signals: DeterministicRiskSignals,
    context?: string,
    options?: AIRoutingOptions
  ): Promise<AIRiskReasoningResponse> {
    const provider = this.factory.resolveProvider(options).selectedProvider;
    const capability = new RiskReasoningCapability(provider);
    return capability.explainRisk(signals, context);
  }

  async draftFollowupMessage(
    request: AIDraftMessageRequest,
    options?: AIRoutingOptions
  ): Promise<AIDraftMessageResponse> {
    const provider = this.factory.resolveProvider(options).selectedProvider;
    const capability = new MessagingCapability(provider);
    return capability.draftFollowupMessage(request);
  }

  async investigate(
    request: AIInvestigationRequest,
    context: {
      structuredFacts: string;
      semanticExcerpts: string;
      customerDetails?: string;
    },
    options?: AIRoutingOptions
  ): Promise<AIInvestigationResponse> {
    const provider = this.factory.resolveProvider(options).selectedProvider;
    const capability = new InvestigationCapability(provider);
    return capability.investigate(request, context);
  }
}
