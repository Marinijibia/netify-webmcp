import { AIProvider } from './interfaces/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ExtractionCapability } from './capabilities/extraction.capability';
import { RiskReasoningCapability } from './capabilities/risk-reasoning.capability';
import { MessagingCapability } from './capabilities/messaging.capability';
import { InvestigationCapability } from './capabilities/investigation.capability';
import { MemoryCapability } from './capabilities/memory.capability';
import {
  ExtractCommitmentInput,
  ExtractedCommitmentOutput,
  DraftMessageInput,
} from '@netify/validation';
import {
  DeterministicRiskSignals,
  AIRiskReasoningResponse,
  AIDraftMessageResponse,
  AIInvestigationRequest,
  AIInvestigationResponse,
} from '@netify/types';

export interface AIServiceConfig {
  provider: 'gemini' | 'openai';
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
}

export class AIService {
  private provider: AIProvider;
  public readonly extraction: ExtractionCapability;
  public readonly risk: RiskReasoningCapability;
  public readonly messaging: MessagingCapability;
  public readonly investigation: InvestigationCapability;
  public readonly memory: MemoryCapability;

  constructor(config: AIServiceConfig) {
    if (config.provider === 'openai') {
      this.provider = new OpenAIProvider(config.openaiApiKey, config.openaiModel);
    } else {
      this.provider = new GeminiProvider(config.geminiApiKey, config.geminiModel);
    }

    this.extraction = new ExtractionCapability(this.provider);
    this.risk = new RiskReasoningCapability(this.provider);
    this.messaging = new MessagingCapability(this.provider);
    this.investigation = new InvestigationCapability(this.provider);
    this.memory = new MemoryCapability(this.provider);
  }

  getProviderName(): string {
    return this.provider.name;
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
