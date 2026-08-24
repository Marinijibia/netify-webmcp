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
  AIDraftMessageResponse,
  AIInvestigationRequest,
  AIInvestigationResponse,
} from '@netify/types';

export interface AIServiceConfig extends Partial<AIRouterConfig> {
  provider?: 'gemini' | 'openai' | 'inna';
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
      defaultProvider: config.provider || 'gemini',
      enableInnaForAfricanLanguages: config.enableInnaForAfricanLanguages ?? true,
      geminiApiKey: config.geminiApiKey,
      geminiModel: config.geminiModel,
      openaiApiKey: config.openaiApiKey,
      openaiModel: config.openaiModel,
      innaApiKey: config.innaApiKey,
      innaBaseUrl: config.innaBaseUrl,
      innaModel: config.innaModel,
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

  resolveProvider(options?: AIRoutingOptions): AIRoutingDecision {
    return this.factory.resolveProvider(options);
  }

  getProviderName(): string {
    return this.defaultProvider.name;
  }

  async detectIntent(
    query: string,
    preferredLanguage?: AppLanguage
  ): Promise<StructuredBusinessIntent> {
    return this.intent.detectIntentAndLanguage(query, preferredLanguage);
  }

  async extractCommitment(input: ExtractCommitmentInput): Promise<ExtractedCommitmentOutput> {
    return this.extraction.extractCommitment(input);
  }

  async explainRisk(
    signals: DeterministicRiskSignals,
    context?: string
  ): Promise<AIRiskReasoningResponse> {
    return this.risk.explainRisk(signals, context);
  }

  async draftFollowupMessage(input: {
    customerId: string;
    customerName: string;
    totalOutstanding: number;
    currency: string;
    suggestedPaymentAmount?: number;
    tone: 'polite_reminder' | 'firm_followup' | 'urgent_escalation' | 'payment_plan';
    channel: 'whatsapp' | 'sms' | 'email';
    daysOverdue?: number;
    recentCommitmentSummary?: string;
  }): Promise<AIDraftMessageResponse> {
    return this.messaging.draftFollowupMessage({
      customerId: input.customerId,
      customerName: input.customerName,
      currency: input.currency,
      totalOutstanding: input.totalOutstanding,
      suggestedPaymentAmount: input.suggestedPaymentAmount,
      tone: input.tone,
      channel: input.channel,
      daysOverdue: input.daysOverdue,
      recentCommitmentSummary: input.recentCommitmentSummary,
    });
  }

  async investigate(
    request: AIInvestigationRequest,
    context: {
      structuredFacts: string;
      semanticExcerpts: string;
      customerDetails?: string;
    }
  ): Promise<AIInvestigationResponse> {
    return this.investigation.investigate(request, context);
  }

  async embed(text: string): Promise<number[]> {
    return this.memory.generateMemoryEmbedding(text);
  }
}
