import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
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
  AppLanguage as DbAppLanguage,
} from '@netify/database';
import {
  AIService as AIPackageService,
  AIProviderFactory,
} from '@netify/ai';
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
  AISendMessageInput,
  AppLanguage,
} from '@netify/validation';
import { AIContextBuilder } from './ai-context-builder';
import { CollectionAttentionService } from './collection-attention.service';
import { BusinessQAService } from './business-qa.service';
import { ConversationService } from './conversation.service';
import { ActionExecutionService } from './action-execution.service';
import { AI_SYSTEM_INSTRUCTIONS, PROMPT_VERSIONS } from './ai-prompts';

export interface ChatResponseOutput {
  conversationId: string;
  messageId: string;
  sender: 'COPILOT';
  content: string;
  detectedLanguage: AppLanguage;
  intent: string;
  facts: Array<{ title: string; detail: string; metric?: string | number }>;
  inferences: Array<{ title: string; reason: string; urgency?: string }>;
  evidence: {
    memoryIds: string[];
    eventIds: string[];
    customerIds: string[];
    receivableIds: string[];
  };
  suggestedActions: Array<{
    id?: string;
    actionType: string;
    title: string;
    description: string;
    payload: Record<string, any>;
    isConsequential: boolean;
  }>;
  suggestedFollowUps: string[];
  metrics: {
    latencyMs: number;
    provider: string;
  };
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private aiPackage: AIPackageService;
  private providerFactory: AIProviderFactory;

  constructor(
    private readonly configService: ConfigService,
    private readonly contextBuilder: AIContextBuilder,
    private readonly attentionService: CollectionAttentionService,
    private readonly qaService: BusinessQAService,
    private readonly conversationService: ConversationService,
    private readonly actionService: ActionExecutionService
  ) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const geminiModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const innaKey = this.configService.get<string>('INNA_API_KEY');
    const innaBaseUrl = this.configService.get<string>('INNA_BASE_URL');
    const innaModel = this.configService.get<string>('INNA_MODEL');
    const defaultProvider = (this.configService.get<string>('AI_PROVIDER') as any) || 'gemini';

    this.providerFactory = new AIProviderFactory({
      defaultProvider,
      geminiApiKey: geminiKey,
      geminiModel,
      openaiApiKey: openaiKey,
      openaiModel,
      innaApiKey: innaKey,
      innaBaseUrl,
      innaModel,
      enableInnaForAfricanLanguages: true,
    });

    this.aiPackage = new AIPackageService({
      provider: defaultProvider,
      geminiApiKey: geminiKey,
      geminiModel,
      openaiApiKey: openaiKey,
      openaiModel,
      innaApiKey: innaKey,
      innaBaseUrl,
      innaModel,
    });
  }

  /**
   * Main Multilingual AI Copilot conversational endpoint.
   * Integrates language detection, deterministic data retrieval, Business Memory, and action proposal generation.
   */
  async chat(
    organizationId: string,
    userId: string,
    input: AISendMessageInput
  ): Promise<ChatResponseOutput> {
    const startTime = Date.now();

    // 1. Ensure or create conversation
    let targetConversationId = input.conversationId;
    if (!targetConversationId) {
      const conv = await this.conversationService.createConversation(
        organizationId,
        userId,
        {
          title: input.content.slice(0, 40) + '...',
          language: input.language,
        }
      );
      targetConversationId = conv.id;
    }

    // 2. Detect Intent & Language
    const detected = await this.aiPackage.detectIntent(input.content, input.language);
    const targetLanguage = input.language || detected.detectedLanguage;

    // 3. Record User Message
    await this.conversationService.addMessage(
      organizationId,
      userId,
      targetConversationId,
      {
        sender: 'USER',
        content: input.content,
        language: targetLanguage,
        intent: detected.intentType,
      }
    );

    // 4. Retrieve Deterministic Business Data
    const qaResult = await this.qaService.executeDeterministicQuery(organizationId, {
      query: input.content,
      customerId: input.customerId || detected.extractedParameters?.customerId,
      timeWindowDays: detected.extractedParameters?.timeWindowDays || 30,
    });

    // 5. Resolve AI Provider for the target language
    const routingDecision = this.providerFactory.resolveProvider({
      language: targetLanguage,
      taskType: 'chat',
    });

    const provider = routingDecision.selectedProvider;

    // 6. Build Multilingual Prompt with strict factual separation
    const prompt = `User Query: "${input.content}"
Detected Intent: ${detected.intentType}
Detected Language: ${targetLanguage} (Code-switched: ${detected.isCodeSwitched})

--- AUTHORITATIVE BUSINESS DATA (FACTS) ---
${JSON.stringify(qaResult.data, null, 2)}
Context Summary: ${qaResult.contextSummary}

--- INSTRUCTIONS ---
You are Netify AI Copilot, the intelligent financial assistant for African businesses.
Respond in the language requested: "${targetLanguage}" (English: "en", Hausa: "ha", Yoruba: "yo", Igbo: "ig", Nigerian Pidgin: "pcm").
If Pidgin ("pcm") is requested or code-switched, use natural, professional Nigerian business Pidgin (e.g. "Who dey owe pass", "Abeg check", "Nawa for debt").

CRITICAL RULES:
1. NEVER invent or fabricate financial numbers, balances, or transactions. Rely ONLY on the Authoritative Business Data above.
2. Clearly separate FACTS from INFERENCES / RECOMMENDATIONS.
3. If an action is appropriate (e.g. drafting a collection message, setting a follow-up date), propose it in "suggestedActions".
4. If there are zero debts or no records found, explain gently that more business records are needed.

Respond strictly in JSON format matching this schema:
{
  "content": "Conversational reply to the business owner in the requested language (2-4 sentences)",
  "facts": [
    { "title": "Fact title", "detail": "Specific factual detail with real numbers", "metric": "₦450,000" }
  ],
  "inferences": [
    { "title": "Inference title", "reason": "Behavioral deduction or warning", "urgency": "HIGH" | "MEDIUM" | "LOW" }
  ],
  "suggestedActions": [
    {
      "actionType": "CREATE_FOLLOW_UP" | "DRAFT_MESSAGE" | "LOG_ACTIVITY",
      "title": "Action title",
      "description": "Explanation of action",
      "payload": { "customerId": "uuid if available", "dueDate": "YYYY-MM-DD", "amount": 1000 },
      "isConsequential": true
    }
  ],
  "suggestedFollowUps": ["Question 1", "Question 2"]
}`;

    let parsedResult: any;
    try {
      const rawResponse = await provider.generate(prompt, {
        temperature: 0.2,
        systemInstruction: AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE,
      });

      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      parsedResult = JSON.parse(cleanJson);
    } catch (err: any) {
      this.logger.warn(`AI Provider failed for language ${targetLanguage}, using deterministic fallback narration: ${err.message}`);
      parsedResult = {
        content: qaResult.contextSummary || 'Here is what your verified business records show.',
        facts: [{ title: 'Business Records', detail: qaResult.contextSummary }],
        inferences: [],
        suggestedActions: [],
        suggestedFollowUps: ['Who should I follow up with today?', 'Show total outstanding receivables'],
      };
    }

    const latencyMs = Date.now() - startTime;

    // 7. Persist any proposed actions
    const createdActionProposals: any[] = [];
    if (Array.isArray(parsedResult.suggestedActions)) {
      for (const action of parsedResult.suggestedActions) {
        if (action.actionType && action.title) {
          const proposal = await this.actionService.proposeAction({
            organizationId,
            userId,
            conversationId: targetConversationId,
            actionType: action.actionType,
            title: action.title,
            description: action.description || action.title,
            payload: action.payload || {},
            isConsequential: action.isConsequential ?? true,
          });
          createdActionProposals.push({
            id: proposal.id,
            ...action,
          });
        }
      }
    }

    // 8. Record Copilot Message
    const copilotMessage = await this.conversationService.addMessage(
      organizationId,
      userId,
      targetConversationId,
      {
        sender: 'COPILOT',
        content: parsedResult.content || 'Here is your business intelligence summary.',
        language: targetLanguage,
        intent: detected.intentType,
        evidenceCustomerIds: qaResult.citations || [],
        metrics: {
          latencyMs,
          provider: routingDecision.providerName,
        },
      }
    );

    // 9. Telemetry logging
    await this.logAIRequest({
      organizationId,
      userId,
      capability: AICapability.BUSINESS_QA,
      model: routingDecision.providerName,
      promptVersion: 'v2-multilingual',
      status: AIRequestStatus.SUCCESS,
      latencyMs,
    });

    return {
      conversationId: targetConversationId,
      messageId: copilotMessage.id,
      sender: 'COPILOT',
      content: parsedResult.content,
      detectedLanguage: targetLanguage,
      intent: detected.intentType,
      facts: parsedResult.facts || [],
      inferences: parsedResult.inferences || [],
      evidence: {
        memoryIds: [],
        eventIds: [],
        customerIds: qaResult.citations || [],
        receivableIds: [],
      },
      suggestedActions: createdActionProposals,
      suggestedFollowUps: parsedResult.suggestedFollowUps || [],
      metrics: {
        latencyMs,
        provider: routingDecision.providerName,
      },
    };
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
      const decision = this.providerFactory.resolveProvider({ language: 'en' });
      const result = await decision.selectedProvider.structuredOutputWithMetrics<CustomerExplanationOutput>(
        prompt,
        CustomerExplanationOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.CUSTOMER_EXPLANATION}`,
        }
      );

      const sanitizedMemoryIds = result.data.evidenceMemoryIds.filter((id) =>
        context.validMemoryIds.has(id)
      );
      const sanitizedEventIds = result.data.evidenceEventIds.filter((id) =>
        context.validEventIds.has(id)
      );

      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.CUSTOMER_EXPLANATION,
        model: decision.providerName,
        promptVersion: PROMPT_VERSIONS.CUSTOMER_EXPLANATION,
        status: AIRequestStatus.SUCCESS,
        latencyMs: result.metrics.latencyMs,
      });

      return {
        ...result.data,
        evidenceMemoryIds: sanitizedMemoryIds,
        evidenceEventIds: sanitizedEventIds,
      };
    } catch (error: any) {
      await this.logAIRequest({
        organizationId,
        userId,
        capability: AICapability.CUSTOMER_EXPLANATION,
        model: 'fallback',
        promptVersion: PROMPT_VERSIONS.CUSTOMER_EXPLANATION,
        status: AIRequestStatus.FAILED,
        latencyMs: Date.now() - startTime,
        errorMessage: error.message,
      });

      throw new ServiceUnavailableException(
        `Customer Explanation is temporarily unavailable: ${error.message}`
      );
    }
  }

  /**
   * Generates actionable collection recommendation and stores in AIRecommendation ledger.
   */
  async recommendAction(
    organizationId: string,
    userId: string | null,
    customerId: string,
    input: CustomerRecommendationInput
  ): Promise<CollectionRecommendationOutput> {
    const context = await this.contextBuilder.buildCustomerContext(
      organizationId,
      customerId,
      { receivableId: input.receivableId }
    );

    const prompt = `Formulate a strategic collection recommendation for this customer:

${context.formattedPromptContext}

Provide a structured JSON response:
- action: one of ["FOLLOW_UP_NOW", "FOLLOW_UP_LATER", "REQUEST_PAYMENT_DATE", "REQUEST_PARTIAL_PAYMENT", "REVIEW_COMMITMENT", "CHANGE_COLLECTION_CHANNEL", "ESCALATE", "NO_ACTION"]
- urgency: "HIGH" | "MEDIUM" | "LOW"
- title: concise action title
- reasoningSummary: behavioral justification citing promises/history
- suggestedChannel: "WHATSAPP" | "SMS" | "PHONE_CALL" | "IN_PERSON" | "EMAIL"
- suggestedMessage: ready-to-send draft message
- confidence: "HIGH" | "MEDIUM" | "LOW"
- evidenceMemoryIds: cited memory IDs
- evidenceEventIds: cited event IDs`;

    const startTime = Date.now();
    try {
      const decision = this.providerFactory.resolveProvider({ language: 'en' });
      const result = await decision.selectedProvider.structuredOutputWithMetrics<CollectionRecommendationOutput>(
        prompt,
        CollectionRecommendationOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.COLLECTION_RECOMMENDATION}`,
        }
      );

      const savedRecommendation = await prisma.aIRecommendation.create({
        data: {
          organizationId,
          userId: userId || null,
          customerId,
          receivableId: input.receivableId || null,
          capability: AICapability.COLLECTION_RECOMMENDATION,
          action: result.data.action as AIRecommendationAction,
          urgency: result.data.urgency as AIUrgencyLevel,
          title: result.data.title,
          reasoningSummary: result.data.reasoningSummary,
          suggestedChannel: result.data.suggestedChannel || null,
          suggestedMessage: result.data.suggestedMessage || null,
          evidenceMemoryIds: result.data.evidenceMemoryIds,
          evidenceEventIds: result.data.evidenceEventIds,
          confidence: result.data.confidence as AIConfidenceLevel,
          status: AIRecommendationStatus.ACTIVE,
        },
      });

      return result.data;
    } catch (error: any) {
      throw new ServiceUnavailableException(
        `Recommendation generation is temporarily unavailable: ${error.message}`
      );
    }
  }

  /**
   * Drafts culturally respectful, tone-adjusted collection messages.
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

    const prompt = `Draft a collection communication tailored to this African SME debtor:
Target Channel: ${input.channel}
Desired Tone: ${input.tone}
${input.customNote ? `Owner Note: "${input.customNote}"` : ''}

${context.formattedPromptContext}

Provide a structured JSON response matching CollectionMessageDraftOutputSchema.`;

    const decision = this.providerFactory.resolveProvider({ language: 'en' });
    const result = await decision.selectedProvider.structuredOutputWithMetrics<CollectionMessageDraftOutput>(
      prompt,
      CollectionMessageDraftOutputSchema,
      {
        systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.COLLECTION_MESSAGE_DRAFT}`,
      }
    );

    return result.data;
  }

  /**
   * Generates a 360-degree customer overview.
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

Provide a structured JSON response matching CustomerSummaryOutputSchema.`;

    const decision = this.providerFactory.resolveProvider({ language: 'en' });
    const result = await decision.selectedProvider.structuredOutputWithMetrics<CustomerSummaryOutput>(
      prompt,
      CustomerSummaryOutputSchema,
      {
        systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.CUSTOMER_SUMMARY}`,
      }
    );

    return result.data;
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

Explain these results clearly to the business owner in 2 to 4 sentences.
Return valid JSON matching BusinessQAOutputSchema.`;

    const decision = this.providerFactory.resolveProvider({ language: 'en' });
    const result = await decision.selectedProvider.structuredOutputWithMetrics<BusinessQAOutput>(
      prompt,
      BusinessQAOutputSchema,
      {
        systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.BUSINESS_QA}`,
      }
    );

    return result.data;
  }

  /**
   * Updates user's preferred language in database.
   */
  async updateUserLanguage(userId: string, language: AppLanguage) {
    const dbLang = language.toUpperCase() as DbAppLanguage;
    return prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: dbLang },
      select: { id: true, preferredLanguage: true },
    });
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

    return prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: input.status as AIRecommendationStatus,
      },
    });
  }

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
      this.logger.warn(`[logAIRequest] Non-blocking telemetry error: ${err.message}`);
    }
  }
}
