import { AIProvider } from '../interfaces/ai-provider.interface';
import {
  StructuredBusinessIntent,
  StructuredBusinessIntentSchema,
  AppLanguage,
} from '@netify/validation';

export class IntentRoutingCapability {
  constructor(private provider: AIProvider) {}

  async detectIntentAndLanguage(
    query: string,
    preferredLanguage?: AppLanguage
  ): Promise<StructuredBusinessIntent> {
    // 1. Fast deterministic heuristic classification (0ms)
    const fastResult = this.fastIntentClassification(query, preferredLanguage);
    if (fastResult) {
      return fastResult;
    }

    const prompt = `You are the intent classification and language detection engine for Netify (an AI Collections & Business Intelligence platform for African SMEs).

Analyze the user's business query carefully. The user might speak in:
- English ("en")
- Hausa ("ha") e.g. "Waɗanne customers ne suka fi bin mu bashi?", "Mene ne ya faru da Ahmed?"
- Yoruba ("yo") e.g. "Awọn alabara wo ni o jẹ mi ni gbese julọ?", "Kini o yẹ ki n ṣe loni?"
- Igbo ("ig") e.g. "Kedu ndị ahịa ji m ụgwọ kacha?", "Gịnị ka m kwesịrị ime taa?"
- Nigerian Pidgin ("pcm") e.g. "Who dey owe me pass?", "Abeg draft message for Musa", "Show me customers wey never pay"
- Code-switched / Mixed language e.g. "Show me waɗanda suka overdue", "Send reminder to Ahmed jare"

Query: "${query}"
User Preferred Language (Context): "${preferredLanguage || 'en'}"

Classify into one of the following Intent Types:
- COLLECTION_PRIORITY: Questions about who to collect from, who owes the most, who is high priority, overdue rankings.
- CUSTOMER_LOOKUP: Looking up specific customer balance, status, details, or contact information.
- RECEIVABLE_SUMMARY: Total outstanding amount, overdue totals, collection rate summary.
- COLLECTION_HISTORY: Past collection attempts, previous notes, call logs.
- PAYMENT_ANALYSIS: Payment history, who paid recently, payment breakdown.
- BUSINESS_TREND: Month-over-month receivables, trends, why collections are improving or deteriorating.
- DRAFT_COLLECTION_MESSAGE: Requests to write, generate, or compose a follow-up, reminder, or WhatsApp message.
- CREATE_FOLLOW_UP: Request to schedule a reminder, set a task, or arrange a follow-up date.
- BUSINESS_EXPLANATION: Why a specific debt happened, why someone is high risk, explanation of metrics.
- GENERAL_QA: General business questions, greeting, or advice.

Extract relevant parameters:
- customerQuery: Any mentioned customer name or fragment (e.g. "Ahmed", "Musa Trading", "Emeka").
- timeWindowDays: If specified (e.g. 7, 30, 90).
- tone: If specified for message drafting (e.g. "polite", "firm", "urgent").
- channel: If specified (e.g. "whatsapp", "sms", "call").
- targetDueDate: If a promised or follow-up date is mentioned.

Detect:
- detectedLanguage: "en" | "ha" | "yo" | "ig" | "pcm"
- isCodeSwitched: boolean
- confidence: number between 0.0 and 1.0

Return JSON matching the schema.`;

    try {
      const result = await this.provider.structuredOutput<StructuredBusinessIntent>(
        prompt,
        StructuredBusinessIntentSchema,
        {
          temperature: 0.1,
          systemInstruction:
            'You are an expert NLP intent classifier specializing in West African languages, Nigerian Pidgin, and SME commerce context.',
        }
      );
      return result;
    } catch (err: any) {
      // Deterministic rule-based fallback if LLM structured output fails
      return this.fallbackIntentClassification(query, preferredLanguage);
    }
  }

  private fastIntentClassification(
    query: string,
    preferredLanguage?: AppLanguage
  ): StructuredBusinessIntent | null {
    const lower = query.toLowerCase();

    let detectedLanguage: AppLanguage = preferredLanguage || 'en';
    let isCodeSwitched = false;
    if (lower.includes('dey') || lower.includes('abeg') || lower.includes('wetin') || lower.includes('jare')) {
      detectedLanguage = 'pcm';
      isCodeSwitched = true;
    } else if (lower.includes('suka') || lower.includes('bashi') || lower.includes('mene')) {
      detectedLanguage = 'ha';
    } else if (lower.includes('gbese') || lower.includes('alabara') || lower.includes('kini')) {
      detectedLanguage = 'yo';
    } else if (lower.includes('ụgwọ') || lower.includes('ahịa') || lower.includes('kedu')) {
      detectedLanguage = 'ig';
    }

    if (
      lower.includes('who dey owe') ||
      lower.includes('who owes') ||
      lower.includes('owe') ||
      lower.includes('debtor') ||
      lower.includes('priority') ||
      lower.includes('highest') ||
      lower.includes('overdue') ||
      lower.includes('suka fi bin mu bashi') ||
      lower.includes('jẹ mi ni gbese') ||
      lower.includes('ji m ụgwọ')
    ) {
      return {
        intentType: 'COLLECTION_PRIORITY',
        confidence: 0.95,
        detectedLanguage,
        isCodeSwitched,
        extractedParameters: {},
      };
    }

    if (
      lower.includes('broken') ||
      lower.includes('promise') ||
      lower.includes('commitment') ||
      lower.includes('missed')
    ) {
      return {
        intentType: 'COLLECTION_PRIORITY',
        confidence: 0.92,
        detectedLanguage,
        isCodeSwitched,
        extractedParameters: {},
      };
    }

    if (
      lower.includes('draft') ||
      lower.includes('message') ||
      lower.includes('reminder') ||
      lower.includes('follow-up') ||
      lower.includes('rubuta sako') ||
      lower.includes('kọ ifiranṣẹ') ||
      lower.includes('dee ozi')
    ) {
      return {
        intentType: 'DRAFT_COLLECTION_MESSAGE',
        confidence: 0.95,
        detectedLanguage,
        isCodeSwitched,
        extractedParameters: {},
      };
    }

    if (
      lower.includes('how much') ||
      lower.includes('total') ||
      lower.includes('summary') ||
      lower.includes('overview') ||
      lower.includes('nawa') ||
      lower.includes('elo') ||
      lower.includes('ole')
    ) {
      return {
        intentType: 'RECEIVABLE_SUMMARY',
        confidence: 0.95,
        detectedLanguage,
        isCodeSwitched,
        extractedParameters: {},
      };
    }

    return null;
  }

  private fallbackIntentClassification(
    query: string,
    preferredLanguage?: AppLanguage
  ): StructuredBusinessIntent {
    const lower = query.toLowerCase();

    // Fast keyword heuristics
    let intentType: StructuredBusinessIntent['intentType'] = 'GENERAL_QA';
    let detectedLanguage: AppLanguage = preferredLanguage || 'en';
    let isCodeSwitched = false;

    if (
      lower.includes('who dey owe') ||
      lower.includes('who owes') ||
      lower.includes('suka fi bin mu bashi') ||
      lower.includes('jẹ mi ni gbese') ||
      lower.includes('ji m ụgwọ') ||
      lower.includes('priority') ||
      lower.includes('overdue')
    ) {
      intentType = 'COLLECTION_PRIORITY';
    } else if (
      lower.includes('draft') ||
      lower.includes('message') ||
      lower.includes('rubuta sako') ||
      lower.includes('kọ ifiranṣẹ') ||
      lower.includes('dee ozi')
    ) {
      intentType = 'DRAFT_COLLECTION_MESSAGE';
    } else if (
      lower.includes('how much') ||
      lower.includes('total') ||
      lower.includes('nawa') ||
      lower.includes('elo') ||
      lower.includes('ole')
    ) {
      intentType = 'RECEIVABLE_SUMMARY';
    }

    if (lower.includes('dey') || lower.includes('abeg') || lower.includes('wetin') || lower.includes('jare')) {
      detectedLanguage = 'pcm';
      isCodeSwitched = true;
    } else if (lower.includes('suka') || lower.includes('bashi') || lower.includes('mene')) {
      detectedLanguage = 'ha';
    } else if (lower.includes('gbese') || lower.includes('alabara') || lower.includes('kini')) {
      detectedLanguage = 'yo';
    } else if (lower.includes('ụgwọ') || lower.includes('ahịa') || lower.includes('kedu')) {
      detectedLanguage = 'ig';
    }

    return {
      intentType,
      confidence: 0.75,
      detectedLanguage,
      isCodeSwitched,
      extractedParameters: {},
    };
  }
}
