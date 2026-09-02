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
import { BusinessQAService, GroundedQAResult } from './business-qa.service';
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
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const geminiModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
    const deepseekKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    const deepseekModel = this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
    const deepseekBaseUrl = this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com';
    const openrouterKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const openrouterModel = this.configService.get<string>('OPENROUTER_MODEL') || 'openai/gpt-4o-mini';
    const defaultProvider = (this.configService.get<string>('AI_PROVIDER') as any) || 'openai';

    this.providerFactory = new AIProviderFactory({
      defaultProvider,
      openaiApiKey: openaiKey,
      openaiModel,
      geminiApiKey: geminiKey,
      geminiModel,
      deepseekApiKey: deepseekKey,
      deepseekModel,
      deepseekBaseUrl,
      openrouterApiKey: openrouterKey,
      openrouterModel,
    });

    this.aiPackage = new AIPackageService({
      provider: defaultProvider,
      openaiApiKey: openaiKey,
      openaiModel,
      geminiApiKey: geminiKey,
      geminiModel,
      deepseekApiKey: deepseekKey,
      deepseekModel,
      deepseekBaseUrl,
      openrouterApiKey: openrouterKey,
      openrouterModel,
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

    // 5. Fetch Recent Conversation History for Context Continuity
    const recentMessages = await prisma.aIMessage.findMany({
      where: { conversationId: targetConversationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    const formattedHistory = recentMessages
      .reverse()
      .map((m) => `${m.sender === 'USER' ? 'User' : 'Copilot'}: ${m.content}`)
      .join('\n');
    const isSubsequentTurn = recentMessages.length > 2;

    // 6. Detect if query is Casual/Conversational vs Financial Inquiry
    const isConversationalQuery =
      (detected.intentType === 'GENERAL_QA' || detected.intentType === 'BUSINESS_EXPLANATION') &&
      !detected.extractedParameters?.customerId &&
      !detected.extractedParameters?.targetDueDate &&
      /^(hi|hello|hey|good\s*(morning|afternoon|evening|day)|how\s*are\s*you|talk|let'?s\s*talk|i\s*need\s*us\s*to\s*talk|what'?s\s*up|howdy|sup)\b/i.test(
        input.content.trim()
      );

    // 7. Resolve AI Provider for the target language
    const routingDecision = this.providerFactory.resolveProvider({
      language: targetLanguage,
      taskType: 'chat',
    });

    const provider = routingDecision.selectedProvider;

    // 8. Build Intelligent Multilingual Prompt
    const prompt = `User Query: "${input.content}"
Detected Intent: ${detected.intentType}
Detected Language: ${targetLanguage} (Code-switched: ${detected.isCodeSwitched})
Is Conversational Opening / Greeting: ${isConversationalQuery}
Is Ongoing Multi-Turn Conversation: ${isSubsequentTurn}

--- RECENT CONVERSATION HISTORY ---
${formattedHistory || 'New conversation'}

--- AUTHORITATIVE BUSINESS DATA (FACTS) ---
${JSON.stringify(qaResult.data, null, 2)}
Context Summary: ${qaResult.contextSummary}

--- INSTRUCTIONS & RESPONSE DIRECTIVES ---
Respond in the language requested: "${targetLanguage}" (English: "en", Hausa: "ha", Yoruba: "yo", Igbo: "ig", Nigerian Pidgin: "pcm").
If Pidgin ("pcm") is requested or code-switched, use natural, professional Nigerian business Pidgin.

${
  isConversationalQuery
    ? `🎯 CASUAL & CONVERSATIONAL MODE:
- The user is greeting you, opening a dialogue, or saying "let's talk first".
- Respond warmly, conversationally, and helpfully in 1-2 natural sentences.
- DO NOT list unprompted debtor balances or recite overdue accounts.
- Set "facts": [], "inferences": [], and "suggestedActions": [] to empty arrays [].
- Propose 2-3 helpful conversational suggestions in "suggestedFollowUps" (e.g. "Who owes me the most?", "Show overdue accounts", "Draft a WhatsApp reminder").`
    : `🎯 FINANCIAL & DEBT RECOVERY ANALYSIS MODE:
- The user is asking about debtor balances, overdue accounts, collection priorities, or message drafting.
- Ground your response in the Authoritative Business Data.
- Populate "facts", "inferences", and "suggestedActions" with exact verified numbers.`
}

${
  isSubsequentTurn
    ? `⚠️ MULTI-TURN CONTINUITY:
- This is an ongoing conversation. DO NOT introduce yourself as "Hello! I am Netify Copilot...". Continue the conversation naturally from the previous messages.`
    : ''
}

Respond strictly in JSON format matching this schema:
{
  "content": "Conversational reply in ${targetLanguage} (1-3 sentences)",
  "facts": [
    { "title": "Fact title", "detail": "Specific detail with real numbers", "metric": "₦450,000" }
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
  "suggestedFollowUps": ["Suggested question 1", "Suggested question 2"]
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

      try {
        parsedResult = JSON.parse(cleanJson);
        // Normalize alternative field names
        if (!parsedResult.content && (parsedResult.message || parsedResult.reply || parsedResult.response || parsedResult.summary || parsedResult.text || parsedResult.answer)) {
          parsedResult.content = parsedResult.message || parsedResult.reply || parsedResult.response || parsedResult.summary || parsedResult.text || parsedResult.answer;
        }
        // Handle object content
        if (typeof parsedResult.content === 'object' && parsedResult.content !== null) {
          parsedResult.content = parsedResult.content.message || parsedResult.content.text || parsedResult.content.summary || JSON.stringify(parsedResult.content);
        }
        // Handle nested JSON string inside content
        if (typeof parsedResult.content === 'string' && (parsedResult.content.trim().startsWith('{') || parsedResult.content.includes('```json'))) {
          try {
            let innerJson = parsedResult.content.trim();
            if (innerJson.includes('```json')) {
              innerJson = innerJson.replace(/```json\s*/g, '').replace(/```/g, '').trim();
            }
            const nested = JSON.parse(innerJson);
            if (nested.content || nested.message || nested.reply || nested.summary) {
              parsedResult.content = nested.content || nested.message || nested.reply || nested.summary;
              if (nested.facts && (!parsedResult.facts || !parsedResult.facts.length)) parsedResult.facts = nested.facts;
              if (nested.inferences && (!parsedResult.inferences || !parsedResult.inferences.length)) parsedResult.inferences = nested.inferences;
              if (nested.suggestedActions && (!parsedResult.suggestedActions || !parsedResult.suggestedActions.length)) parsedResult.suggestedActions = nested.suggestedActions;
              if (nested.suggestedFollowUps && (!parsedResult.suggestedFollowUps || !parsedResult.suggestedFollowUps.length)) parsedResult.suggestedFollowUps = nested.suggestedFollowUps;
            }
          } catch {}
        }
      } catch {
        // If the LLM returned conversational plain text instead of strict JSON, use the real LLM output
        parsedResult = {
          content: rawResponse.trim(),
          facts: qaResult.contextSummary ? [{ title: 'Business Records', detail: qaResult.contextSummary }] : [],
          inferences: [],
          suggestedActions: [],
          suggestedFollowUps: ['Who should I follow up with today?', 'Show total outstanding receivables'],
        };
      }
    } catch (err: any) {
      this.logger.warn(`Cloud AI Provider unavailable for language ${targetLanguage} (${err?.message}). Activating deterministic Business Memory intelligence synthesis.`);
      parsedResult = this.synthesizeDeterministicResponse(input.content, targetLanguage, qaResult);
    }

    // Auto-enrich suggestedActions with Universal App Navigation & Deep Links
    if (!Array.isArray(parsedResult.suggestedActions)) {
      parsedResult.suggestedActions = [];
    }

    const queryLower = (input.content || '').toLowerCase();
    
    // 1. Collections & Debtor queue navigation
    if (queryLower.includes('collection') || queryLower.includes('debtor') || queryLower.includes('who owe') || queryLower.includes('overdue') || queryLower.includes('aging') || queryLower.includes('priority')) {
      if (!parsedResult.suggestedActions.some((a: any) => a.payload?.url === '/collections')) {
        parsedResult.suggestedActions.unshift({
          actionType: 'NAVIGATE',
          title: '🚀 Open Collections Queue',
          description: 'View prioritized debtor aging list and broken promises',
          payload: { url: '/collections' },
          isConsequential: false,
        });
      }
    }

    // 2. Draft Follow-up / WhatsApp navigation
    if (queryLower.includes('draft') || queryLower.includes('whatsapp') || queryLower.includes('sms') || queryLower.includes('remind') || queryLower.includes('message') || queryLower.includes('follow up')) {
      const targetCustId = (qaResult.citations && qaResult.citations[0]) || (qaResult.data && (qaResult.data as any).customerId);
      const draftUrl = targetCustId ? `/messages/draft?customerId=${targetCustId}` : '/messages/draft';
      if (!parsedResult.suggestedActions.some((a: any) => a.payload?.url?.startsWith('/messages/draft'))) {
        parsedResult.suggestedActions.push({
          actionType: 'DRAFT_MESSAGE',
          title: '💬 Draft Follow-up Reminder',
          description: 'Open omnichannel studio with pre-loaded debtor context',
          payload: { url: draftUrl, customerId: targetCustId },
          isConsequential: false,
        });
      }
    }

    // 3. Customers ledger & create customer navigation
    if (queryLower.includes('add customer') || queryLower.includes('new customer') || queryLower.includes('create customer')) {
      parsedResult.suggestedActions.push({
        actionType: 'CREATE_CUSTOMER',
        title: '➕ Add New Customer Ledger',
        description: 'Register a new customer account and credit limit',
        payload: { url: '/customers/create' },
        isConsequential: false,
      });
    } else if (queryLower.includes('customer') || queryLower.includes('client') || queryLower.includes('ledger')) {
      const targetCustId = (qaResult.citations && qaResult.citations[0]) || (qaResult.data && (qaResult.data as any).customerId);
      const custUrl = targetCustId ? `/customers/${targetCustId}` : '/customers';
      if (!parsedResult.suggestedActions.some((a: any) => a.payload?.url?.startsWith('/customers'))) {
        parsedResult.suggestedActions.push({
          actionType: 'VIEW_CUSTOMER',
          title: targetCustId ? '👁️ Open Customer Ledger' : '👥 View All Customers',
          description: 'Inspect debtor transaction history and business memory',
          payload: { url: custUrl, customerId: targetCustId },
          isConsequential: false,
        });
      }
    }

    // 4. Receivables & Invoices navigation
    if (queryLower.includes('new invoice') || queryLower.includes('create invoice') || queryLower.includes('add receivable') || queryLower.includes('log invoice')) {
      parsedResult.suggestedActions.push({
        actionType: 'CREATE_RECEIVABLE',
        title: '➕ Log New Receivable',
        description: 'Create an invoice with due date and balance',
        payload: { url: '/receivables/create' },
        isConsequential: false,
      });
    } else if (queryLower.includes('invoice') || queryLower.includes('receivable') || queryLower.includes('unpaid') || queryLower.includes('bill')) {
      if (!parsedResult.suggestedActions.some((a: any) => a.payload?.url === '/receivables')) {
        parsedResult.suggestedActions.push({
          actionType: 'NAVIGATE',
          title: '📄 View Receivables & Invoices',
          description: 'Track open, overdue, and partially paid balances',
          payload: { url: '/receivables' },
          isConsequential: false,
        });
      }
    }

    // 5. Commitments & Promises navigation
    if (queryLower.includes('promise') || queryLower.includes('commitment') || queryLower.includes('agreed date')) {
      if (!parsedResult.suggestedActions.some((a: any) => a.payload?.url === '/commitments')) {
        parsedResult.suggestedActions.push({
          actionType: 'NAVIGATE',
          title: '🤝 View Payment Promises',
          description: 'Review pending, fulfilled, and missed debtor commitments',
          payload: { url: '/commitments' },
          isConsequential: false,
        });
      }
    }

    // 6. Settings & Notifications navigation
    if (queryLower.includes('setting') || queryLower.includes('notification') || queryLower.includes('quiet hour') || queryLower.includes('web push') || queryLower.includes('sound') || queryLower.includes('profile')) {
      if (!parsedResult.suggestedActions.some((a: any) => a.payload?.url === '/settings' || a.payload?.url === '/notifications')) {
        parsedResult.suggestedActions.push({
          actionType: 'NAVIGATE',
          title: '⚙️ Open Notification & System Settings',
          description: 'Manage push channels, quiet hours, and business preferences',
          payload: { url: '/settings' },
          isConsequential: false,
        });
      }
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
    try {
      const result = await decision.selectedProvider.structuredOutputWithMetrics<CollectionMessageDraftOutput>(
        prompt,
        CollectionMessageDraftOutputSchema,
        {
          systemInstruction: `${AI_SYSTEM_INSTRUCTIONS.COPILOT_CORE}\n\n${AI_SYSTEM_INSTRUCTIONS.COLLECTION_MESSAGE_DRAFT}`,
        }
      );

      const draftData = result.data as any;
      if (draftData && (draftData.messageBody || draftData.messageText)) {
        if (!draftData.messageBody) draftData.messageBody = draftData.messageText;
        if (!draftData.messageText) draftData.messageText = draftData.messageBody;
        return draftData;
      }
    } catch (err: any) {
      this.logger.warn(`AI Provider failed for draftMessage: ${err.message}. Synthesizing strictly from verified ledger records.`);
    }

    // Deterministic factual synthesis strictly derived from live customer database records:
    const fin = context.financial;
    const custName = fin.customerName || 'Customer';
    const amountStr = `${fin.currency} ${fin.totalOutstanding.toLocaleString()}`;
    const recentPromise = fin.recentCommitments[0];
    const rec = fin.openReceivables[0];

    let toneIntro = 'We kindly follow up regarding';
    if (input.tone === 'URGENT_ESCALATION') {
      toneIntro = 'This is an urgent notice regarding your overdue account balance of';
    } else if (input.tone === 'RESPECTFUL_REMINDER') {
      toneIntro = 'We hope your business is thriving. This is a gentle reminder regarding';
    } else if (input.tone === 'PARTIAL_PAYMENT_PROPOSAL') {
      toneIntro = 'To support your working capital, we propose a flexible installment plan for your balance of';
    }

    let messageBody = `Good day ${custName}. ${toneIntro} ${amountStr}`;
    if (rec) {
      messageBody += ` on invoice ${rec.description || rec.id.slice(0, 8)}`;
      if (rec.daysOverdue > 0) {
        messageBody += ` which is ${rec.daysOverdue} days past due`;
      }
    }
    if (recentPromise) {
      messageBody += `. We reference the previous agreement of ${fin.currency} ${recentPromise.promisedAmount.toLocaleString()} scheduled for ${recentPromise.promisedFor}`;
    }
    messageBody += `. Please confirm receipt and kindly advise your payment timeline.`;

    if (input.customNote) {
      messageBody += ` Note: ${input.customNote}`;
    }

    return {
      channel: input.channel as any,
      tone: input.tone as any,
      recipientName: custName,
      recipientContact: fin.phone || '',
      subject: `Payment Follow-up Notice — ${custName}`,
      messageBody,
      callScriptPoints: [
        `Confirm contact with ${custName}`,
        `Reference verified outstanding balance of ${amountStr}`,
        rec ? `Clarify invoice terms (due: ${rec.dueDate})` : 'Clarify payment schedule',
        recentPromise ? `Reference commitment of ${fin.currency} ${recentPromise.promisedAmount.toLocaleString()}` : 'Agree on definite payment date',
      ],
      culturalNotes: `Respectful, professional business outreach tailored for ${custName} based on live account balance of ${amountStr}.`,
      verifiedOutstandingAmount: fin.totalOutstanding,
      currency: fin.currency,
    };
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

  private synthesizeDeterministicResponse(
    query: string,
    language: AppLanguage,
    qaResult: GroundedQAResult
  ): any {
    const data = qaResult.data;
    const intent = qaResult.intent;

    // Check if query is a natural greeting or conversational opener
    const isGreeting = /^(hi|hello|hey|good\s*(morning|afternoon|evening|day)|how\s*are\s*you|talk|let'?s\s*talk|i\s*need\s*us\s*to\s*talk|what'?s\s*up)\b/i.test(
      (query || '').trim()
    );

    if (isGreeting) {
      let content = '';
      if (language === 'pcm') {
        content = 'Hello! I dey ready to help you manage your business records and check customer debts. Wetin you go like make we talk about?';
      } else if (language === 'ha') {
        content = 'Sannu! Ina nan a shirye don taimaka muku duba bayanan bashi da harkokin kasuwancinku. Me kuke so mu tattauna?';
      } else if (language === 'yo') {
        content = 'Ẹ n lẹ o! Mo wa ni imurasilẹ lati ran ọ lọwọ lati ṣayẹwo awọn gbese ati iwe-owo rẹ. Kini o fẹ ki a sọrọ nipa rẹ?';
      } else if (language === 'ig') {
        content = 'Ndewo! Anọ m ebe a iji nyere gị aka nyochaa ndekọ ụgwọ na azụmahịa gị. Kedu ihe ị chọrọ ka anyị kpaa maka ya?';
      } else {
        content = 'Hello! I am ready to assist you with your business accounts, customer balances, and follow-up reminders. What would you like to discuss today?';
      }

      return {
        content,
        facts: [],
        inferences: [],
        suggestedActions: [],
        suggestedFollowUps: [
          'Who owes me the most right now?',
          'Show overdue receivables aging',
          'Draft a follow-up reminder',
        ],
      };
    }

    let content = '';
    const facts: Array<{ title: string; detail: string; metric?: string | number }> = [];
    const inferences: Array<{ title: string; reason: string; urgency?: string }> = [];
    const suggestedActions: Array<any> = [];
    const suggestedFollowUps: string[] = [];

    if (intent === 'TOP_OUTSTANDING' && Array.isArray(data)) {
      if (data.length === 0) {
        content = language === 'pcm'
          ? 'No customer dey owe any outstanding money for your workspace right now. Everything dey balanced!'
          : 'There are currently no customers with outstanding balances recorded in your workspace.';
      } else {
        const top = data[0];
        if (language === 'pcm') {
          content = `According to your live ledger records, you get ${data.length} customer(s) with open receivables. Customer wey dey owe pass na ${top.customerName} with ${top.totalOutstanding} (${top.daysOverdue} days overdue).`;
        } else if (language === 'ha') {
          content = `Bisa bayanan littafin asusunku na yanzu, akwai abokan ciniki ${data.length} da ke bin bashi. Wanda ya fi kowa bashi shi ne ${top.customerName} da ${top.totalOutstanding} (kwanaki ${top.daysOverdue} da wucewa).`;
        } else if (language === 'yo') {
          content = `Gẹgẹ bi akọsilẹ iwe-owo rẹ, awọn onibara ${data.length} lo jẹ ọ lowo. Eni to jẹ ọ julọ ni ${top.customerName} pelu ${top.totalOutstanding} (ọjọ ${top.daysOverdue} ti kọja).`;
        } else if (language === 'ig') {
          content = `Dịka ndekọ ego gị siri gosi, ndị ahịa ${data.length} na-eji gị ụgwọ. Onye kacha ji gị ego bụ ${top.customerName} nwere ${top.totalOutstanding} (ụbọchị ${top.daysOverdue} agafeela).`;
        } else {
          content = `Based on your live verified ledger records, you have ${data.length} customer(s) with active outstanding balances. Top priority is ${top.customerName} owing ${top.totalOutstanding} (${top.daysOverdue} days overdue).`;
        }

        data.slice(0, 4).forEach((d: any) => {
          facts.push({
            title: d.customerName,
            detail: `${d.primaryReason || 'Overdue exposure'} • ${d.daysOverdue} days aging`,
            metric: d.totalOutstanding,
          });
        });

        if (top.daysOverdue > 14) {
          inferences.push({
            title: 'Aging Overdue Alert',
            reason: `${top.customerName} has receivables exceeding ${top.daysOverdue} days without recorded settlement.`,
            urgency: 'HIGH',
          });
        }

        if (top.customerId) {
          suggestedActions.push({
            actionType: 'DRAFT_MESSAGE',
            title: `Draft WhatsApp Reminder for ${top.customerName}`,
            description: `Prepare respectful collection notice referencing ${top.totalOutstanding}`,
            payload: { customerId: top.customerId },
            isConsequential: false,
          });
        }

        suggestedFollowUps.push(
          `What is ${top.customerName}'s payment commitment history?`,
          'Who broke a payment promise this week?',
          'Show total overdue receivables breakdown'
        );
      }
    } else if (intent === 'OVERDUE_RECEIVABLES' && Array.isArray(data)) {
      if (data.length === 0) {
        content = 'Good news! There are currently no overdue receivables in your ledger past their due date.';
      } else {
        const top = data[0];
        content = `Identified ${data.length} overdue receivable invoice(s). The most urgent item is for ${top.customer} amounting to ${top.overdueAmount}, which is ${top.daysOverdue} days past due.`;

        data.slice(0, 4).forEach((d: any) => {
          facts.push({
            title: `${d.customer} Invoice`,
            detail: `Due on ${d.dueDate} (${d.daysOverdue} days overdue)`,
            metric: d.overdueAmount,
          });
        });

        inferences.push({
          title: 'Cash Flow Exposure',
          reason: `${data.length} credit invoices have crossed their credit grace period and require immediate human outreach.`,
          urgency: 'HIGH',
        });

        if (top.customerId) {
          suggestedActions.push({
            actionType: 'DRAFT_MESSAGE',
            title: `Draft Overdue Notice for ${top.customer}`,
            description: `Generate grounded collection message for ${top.overdueAmount}`,
            payload: { customerId: top.customerId },
            isConsequential: false,
          });
        }

        suggestedFollowUps.push(
          'Who owes the most past 30 days?',
          'What payment commitments are scheduled for today?'
        );
      }
    } else {
      content = qaResult.contextSummary
        ? `Here is your verified Business Memory record: ${qaResult.contextSummary}`
        : `Your live business memory records are synchronized. Ask about any debtor or overdue receivables to inspect details.`;

      facts.push({
        title: 'Business Memory Ledger',
        detail: 'Connected to verified tenant database records',
        metric: '100% Grounded',
      });

      suggestedFollowUps.push(
        'Who owes the most past 30 days?',
        'Who broke a payment promise this week?',
        'Give me today collection priority briefing'
      );
    }

    return {
      content,
      facts,
      inferences,
      suggestedActions,
      suggestedFollowUps,
    };
  }
}
