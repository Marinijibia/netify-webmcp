import { ConfidenceLevel, RiskLevel, AIActionType } from './enums';
import { RiskEvidenceItem } from './risk';

export interface AIExtractedCommitment {
  amount: number;
  currency: string;
  promisedDate: string; // ISO date string
  description: string;
  confidence: ConfidenceLevel;
  quoteEvidence: string;
  customerId?: string;
  customerName?: string;
  reasoning: string;
}

export interface AIDraftMessageRequest {
  customerId: string;
  customerName: string;
  currency: string;
  totalOutstanding: number;
  suggestedPaymentAmount?: number;
  tone: 'polite_reminder' | 'firm_followup' | 'urgent_escalation' | 'payment_plan';
  channel: 'whatsapp' | 'sms' | 'email';
  recentCommitmentSummary?: string;
  daysOverdue?: number;
}

export interface AIDraftMessageResponse {
  messageText: string;
  channel: 'whatsapp' | 'sms' | 'email';
  tone: string;
  suggestedAction: string;
  evidenceUsed: string[];
}

export interface AIInvestigationRequest {
  query: string;
  customerId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export type KnowledgeClassification = 'KNOWN' | 'OBSERVED' | 'PREDICTED' | 'RECOMMENDED';

export interface AIInvestigationResponse {
  answer: string;
  classification: KnowledgeClassification;
  evidence: RiskEvidenceItem[];
  suggestedActions: Array<{
    type: AIActionType;
    title: string;
    description: string;
    actionPayload?: Record<string, any>;
  }>;
  insufficientDataNote?: string;
}

export interface AIRiskReasoningResponse {
  summary: string;
  explanation: string;
  keyFactors: string[];
  recommendedAction: string;
  evidenceIds: string[];
}
