import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  prisma,
  AICapability,
  AIRequestStatus,
  AIRecommendationAction,
  AIRecommendationStatus,
  AIUrgencyLevel,
  AIConfidenceLevel,
} from '@netify/database';
import { OpenAIProvider } from '@netify/ai';
import {
  CustomerExplainInput,
  CustomerRecommendationInput,
  CustomerSummaryInput,
  DraftMessageInput,
  BusinessQAInput,
  UpdateRecommendationStatusInput,
  CustomerExplanationOutput,
  CustomerExplanationOutputSchema,
  CollectionRecommendationOutput,
  CollectionRecommendationOutputSchema,
  CollectionMessageDraftOutput,
  CollectionMessageDraftOutputSchema,
  CustomerSummaryOutput,
  CustomerSummaryOutputSchema,
  BusinessQAOutput,
  BusinessQAOutputSchema,
  DailyBriefingOutput,
} from '@netify/validation';
import { AIContextBuilder } from './ai-context-builder';
import { CollectionAttentionService } from './collection-attention.service';
import { BusinessQAService } from './business-qa.service';
import { AI_SYSTEM_INSTRUCTIONS, PROMPT_VERSIONS } from './ai-prompts';

@Injectable()
export class AIService {
  private openaiProvider: OpenAIProvider;
  private defaultModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly contextBuilder: AIContextBuilder,
    private readonly attentionService: CollectionAttentionService,
    private readonly qaService: BusinessQAService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.defaultModel =
      this.configService.get<string>('AI_MODEL_DEFAULT') || 'gpt-4o-mini';
    this.openaiProvider = new OpenAIProvider(apiKey, this.defaultModel);
  }

  /**
   * Explains why a customer requires collection attention with verified evidence references.
   */
  async explainCustomer(
    organizationId: string,
    userId: string | null,
    customerId: string,
    input: CustomerExplainInput
  ): Promise<CustomerExplanationOutput> {
    const context = await this.contextBuilder.buildCustomerContext(
      organizationId,
      customerId,
      { receivableId: input.receivableId }
    );

    const prompt = `Analyze the following customer financial state, active memories, and recent events.
Explain why this customer requires collection attention today.

${context.formattedPromptContext}

Provide a structured JSON response:
- summary: concise summary of debt status
- whyItMatters: behavioral explanation based on memories/commitments
- recentHistory: summary of recent contact and payment actions
- recommendation: next actionable step
- confidence: "HIGH" | "MEDIUM" | "LOW"
- evidenceMemoryIds: list of exact memory IDs cited from ACTIVE_BUSINESS_MEMORIES_EVIDENCE (or empty array)
- evidenceEventIds: list of exact event IDs cited from RECENT_BUSINESS_EVENTS_TIMELINE (or empty array)`;

    const startTime = Date.now();
    try {
      const result = await this.openaiProvider.structuredOutputWithMetrics<CustomerExplanationOutput>(
        prompt,
        CustomerExplanationOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.CUSTOMER_EXPLANATION}`,
        }
      );

      // Filter evidence IDs to only those present in authorized context (grounding guarantee)
      const sanitizedMemoryIds = result.data.evidenceMemoryIds.filter((id) =>
        context.validMemoryIds.has(id)
      );
      const sanitizedEventIds = result.data.evidenceEventIds.filter((id) =>
        context.validEventIds.has(id)
      );

      const responseData: CustomerExplanationOutput = {
        ...result.data,
        evidenceMemoryIds: sanitizedMemoryIds,
        evidenceEventIds: sanitizedEventIds,
      };

      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.CUSTOMER_EXPLANATION,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.CUSTOMER_EXPLANATION,
        status: AIRequestStatus.SUCCESS,
        latencyMs: result.metrics.latencyMs,
        inputTokens: result.metrics.inputTokens,
        outputTokens: result.metrics.outputTokens,
      });

      return responseData;
    } catch (error: any) {
      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.CUSTOMER_EXPLANATION,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.CUSTOMER_EXPLANATION,
        status: AIRequestStatus.FAILED,
        latencyMs: Date.now() - startTime,
        errorMessage: error.message,
      });

      throw new ServiceUnavailableException(
        `AI Explanation is temporarily unavailable: ${error.message}`
      );
    }
  }

  /**
   * Generates a grounded, high-leverage collection recommendation and stores an AIRecommendation record.
   */
  async recommendAction(
    organizationId: string,
    userId: string | null,
    customerId: string,
    input: CustomerRecommendationInput
  ): Promise<CollectionRecommendationOutput & { recommendationId: string }> {
    const context = await this.contextBuilder.buildCustomerContext(
      organizationId,
      customerId,
      { receivableId: input.receivableId }
    );

    const prompt = `Review the following customer profile and recommend the most appropriate collection action.
Preferred channel: ${input.preferredChannel || 'Auto-detect from history'}

${context.formattedPromptContext}

Provide a structured JSON response:
- action: "FOLLOW_UP_NOW" | "FOLLOW_UP_LATER" | "REQUEST_PAYMENT_DATE" | "REQUEST_PARTIAL_PAYMENT" | "REVIEW_COMMITMENT" | "CHANGE_COLLECTION_CHANNEL" | "ESCALATE" | "NO_ACTION"
- urgency: "HIGH" | "MEDIUM" | "LOW"
- title: concise title for recommendation
- reasoningSummary: concise explanation of why this action is recommended
- suggestedChannel: "WHATSAPP" | "SMS" | "PHONE_CALL" | "IN_PERSON" | "EMAIL"
- suggestedMessage: 1-sentence prompt on what to ask the customer
- confidence: "HIGH" | "MEDIUM" | "LOW"
- evidenceMemoryIds: list of exact memory IDs cited (or empty)
- evidenceEventIds: list of exact event IDs cited (or empty)`;

    const startTime = Date.now();
    try {
      const result = await this.openaiProvider.structuredOutputWithMetrics<CollectionRecommendationOutput>(
        prompt,
        CollectionRecommendationOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.COLLECTION_RECOMMENDATION}`,
        }
      );

      const sanitizedMemoryIds = result.data.evidenceMemoryIds.filter((id) =>
        context.validMemoryIds.has(id)
      );
      const sanitizedEventIds = result.data.evidenceEventIds.filter((id) =>
        context.validEventIds.has(id)
      );

      // Persist recommendation in DB
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry
      const recRecord = await prisma.aIRecommendation.create({
        data: {
          organizationId,
          userId,
          customerId,
          receivableId: input.receivableId || null,
          capability: AICapability.COLLECTION_RECOMMENDATION,
          action: result.data.action as AIRecommendationAction,
          urgency: result.data.urgency as AIUrgencyLevel,
          title: result.data.title,
          reasoningSummary: result.data.reasoningSummary,
          suggestedChannel: result.data.suggestedChannel,
          suggestedMessage: result.data.suggestedMessage,
          evidenceMemoryIds: sanitizedMemoryIds,
          evidenceEventIds: sanitizedEventIds,
          confidence: result.data.confidence as AIConfidenceLevel,
          status: AIRecommendationStatus.ACTIVE,
          expiresAt,
        },
      });

      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.COLLECTION_RECOMMENDATION,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.COLLECTION_RECOMMENDATION,
        status: AIRequestStatus.SUCCESS,
        latencyMs: result.metrics.latencyMs,
        inputTokens: result.metrics.inputTokens,
        outputTokens: result.metrics.outputTokens,
      });

      return {
        ...result.data,
        recommendationId: recRecord.id,
        evidenceMemoryIds: sanitizedMemoryIds,
        evidenceEventIds: sanitizedEventIds,
      };
    } catch (error: any) {
      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.COLLECTION_RECOMMENDATION,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.COLLECTION_RECOMMENDATION,
        status: AIRequestStatus.FAILED,
        latencyMs: Date.now() - startTime,
        errorMessage: error.message,
      });

      throw new ServiceUnavailableException(
        `AI Recommendation is temporarily unavailable: ${error.message}`
      );
    }
  }

  /**
   * Drafts a culturally respectful collection message for user review.
   */
  async draftMessage(
    organizationId: string,
    userId: string | null,
    customerId: string,
    input: DraftMessageInput
  ): Promise<CollectionMessageDraftOutput> {
    const context = await this.contextBuilder.buildCustomerContext(
      organizationId,
      customerId,
      { receivableId: input.receivableId }
    );

    const verifiedAmount = context.financial.totalOutstanding;
    const currency = context.financial.currency;

    const prompt = `Draft a collection message for the following customer.
Requested Channel: ${input.channel}
Requested Tone: ${input.tone}
Custom Note from Collector: ${input.customNote || 'None'}
Verified Outstanding Amount: ${currency} ${verifiedAmount.toLocaleString()}

${context.formattedPromptContext}

Provide a structured JSON response:
- channel: "${input.channel}"
- tone: "${input.tone}"
- recipientName: customer name
- recipientContact: phone number or email if available
- subject: email subject (if channel is EMAIL, else optional)
- messageBody: the exact message text (formatted for WhatsApp/SMS with clean line breaks)
- callScriptPoints: array of 3 bullet talking points (if channel is PHONE_CALL or IN_PERSON)
- culturalNotes: optional reminder on etiquette (e.g. "Polite reminder acknowledging past relationship")
- verifiedOutstandingAmount: ${verifiedAmount}
- currency: "${currency}"`;

    const startTime = Date.now();
    try {
      const result = await this.openaiProvider.structuredOutputWithMetrics<CollectionMessageDraftOutput>(
        prompt,
        CollectionMessageDraftOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.COLLECTION_MESSAGE_DRAFT}`,
        }
      );

      // Invariant: Override any hallucinated financial numbers with verified truth
      const finalizedData: CollectionMessageDraftOutput = {
        ...result.data,
        verifiedOutstandingAmount: verifiedAmount,
        currency,
      };

      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.COLLECTION_MESSAGE_DRAFT,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.COLLECTION_MESSAGE_DRAFT,
        status: AIRequestStatus.SUCCESS,
        latencyMs: result.metrics.latencyMs,
        inputTokens: result.metrics.inputTokens,
        outputTokens: result.metrics.outputTokens,
      });

      return finalizedData;
    } catch (error: any) {
      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.COLLECTION_MESSAGE_DRAFT,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.COLLECTION_MESSAGE_DRAFT,
        status: AIRequestStatus.FAILED,
        latencyMs: Date.now() - startTime,
        errorMessage: error.message,
      });

      throw new ServiceUnavailableException(
        `AI Message Drafting is temporarily unavailable: ${error.message}`
      );
    }
  }

  /**
   * Generates a 360-degree customer summary.
   */
  async summarizeCustomer(
    organizationId: string,
    userId: string | null,
    customerId: string,
    input: CustomerSummaryInput
  ): Promise<CustomerSummaryOutput> {
    const context = await this.contextBuilder.buildCustomerContext(
      organizationId,
      customerId,
      { timeWindowDays: input.timeWindowDays }
    );

    const prompt = `Generate a concise customer overview based on verified facts and memories:

${context.formattedPromptContext}

Provide a structured JSON response:
- balanceOverview: summary of balance and overdue state
- paymentBehaviorSummary: payment timeliness and consistency trends
- commitmentHistorySummary: fulfillment vs broken promises
- keyMemories: array of key memory statements
- keyEvents: array of major recent events
- strategicRecommendation: strategic advice on credit terms
- confidence: "HIGH" | "MEDIUM" | "LOW"`;

    const startTime = Date.now();
    try {
      const result = await this.openaiProvider.structuredOutputWithMetrics<CustomerSummaryOutput>(
        prompt,
        CustomerSummaryOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.CUSTOMER_SUMMARY}`,
        }
      );

      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.CUSTOMER_SUMMARY,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.CUSTOMER_SUMMARY,
        status: AIRequestStatus.SUCCESS,
        latencyMs: result.metrics.latencyMs,
        inputTokens: result.metrics.inputTokens,
        outputTokens: result.metrics.outputTokens,
      });

      return result.data;
    } catch (error: any) {
      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.CUSTOMER_SUMMARY,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.CUSTOMER_SUMMARY,
        status: AIRequestStatus.FAILED,
        latencyMs: Date.now() - startTime,
        errorMessage: error.message,
      });

      throw new ServiceUnavailableException(
        `Customer Summary is temporarily unavailable: ${error.message}`
      );
    }
  }

  /**
   * Business Q&A with controlled intent execution and verified factual narration.
   */
  async askQA(
    organizationId: string,
    userId: string | null,
    input: BusinessQAInput
  ): Promise<BusinessQAOutput> {
    const queryResult = await this.qaService.executeDeterministicQuery(
      organizationId,
      input
    );

    const prompt = `User Question: "${input.query}"
Classified Intent: ${queryResult.intent}
Verified Database Query Results:
${JSON.stringify(queryResult.data, null, 2)}

Context Summary: ${queryResult.contextSummary}

Instructions:
Explain these results clearly to the business owner in 2 to 4 sentences.
Highlight specific numbers and cite relevant customer names.
Provide 2 suggested follow-up questions.

Return valid JSON:
- intent: "${queryResult.intent}"
- answer: concise conversational explanation
- keyFigures: key numbers formatted as object
- citations: array of cited customer/invoice names
- suggestedFollowUps: array of 2 suggested questions
- confidence: "HIGH" | "MEDIUM" | "LOW"`;

    const startTime = Date.now();
    try {
      const result = await this.openaiProvider.structuredOutputWithMetrics<BusinessQAOutput>(
        prompt,
        BusinessQAOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.BUSINESS_QA}`,
        }
      );

      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.BUSINESS_QA,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.BUSINESS_QA,
        status: AIRequestStatus.SUCCESS,
        latencyMs: result.metrics.latencyMs,
        inputTokens: result.metrics.inputTokens,
        outputTokens: result.metrics.outputTokens,
      });

      return result.data;
    } catch (error: any) {
      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.BUSINESS_QA,
        model: this.defaultModel,
        promptVersion: PROMPT_VERSIONS.BUSINESS_QA,
        status: AIRequestStatus.FAILED,
        latencyMs: Date.now() - startTime,
        errorMessage: error.message,
      });

      throw new ServiceUnavailableException(
        `Business Q&A is temporarily unavailable: ${error.message}`
      );
    }
  }

  /**
   * Updates the status of an AI recommendation (accept / dismiss).
   */
  async updateRecommendationStatus(
    organizationId: string,
    userId: string | null,
    recommendationId: string,
    input: UpdateRecommendationStatusInput
  ) {
    const rec = await prisma.aIRecommendation.findFirst({
      where: { id: recommendationId, organizationId },
    });

    if (!rec) {
      throw new NotFoundException(
        `AI recommendation with ID "${recommendationId}" not found.`
      );
    }

    const updated = await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: input.status as AIRecommendationStatus,
      },
    });

    return updated;
  }

  /**
   * Internal telemetry helper to record AI cost, latency, and capability usage.
   */
  private async logAIRequest(data: {
    organizationId: string;
    userId?: string | null;
    capability: AICapability;
    model: string;
    promptVersion: string;
    status: AIRequestStatus;
    latencyMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    errorMessage?: string;
  }) {
    try {
      await prisma.aIRequest.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId || null,
          capability: data.capability,
          model: data.model,
          promptVersion: data.promptVersion,
          status: data.status,
          latencyMs: data.latencyMs,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          errorMessage: data.errorMessage,
          completedAt: new Date(),
        },
      });
    } catch (err: any) {
      console.warn(`[logAIRequest] Non-blocking telemetry error: ${err.message}`);
    }
  }
}
