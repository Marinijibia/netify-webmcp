import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma, BusinessEventType } from '@netify/database';
import { AIService as CoreAIService } from '@netify/ai';
import {
  ExtractCommitmentInput,
  DraftMessageInput,
  AIInvestigationInput,
  ExtractedCommitmentOutput,
} from '@netify/validation';
import {
  AIInvestigationResponse,
  AIDraftMessageResponse,
  RiskEvidenceItem,
  ConfidenceLevel,
} from '@netify/types';
import { DeterministicInvoiceService } from '../invoice/deterministic-invoice.service';

@Injectable()
export class AIServiceWrapper {
  private ai: CoreAIService;

  constructor(private readonly configService: ConfigService) {
    const provider = (this.configService.get<string>('AI_PROVIDER') as any) || 'gemini';
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    this.ai = new CoreAIService({
      provider,
      geminiApiKey,
      openaiApiKey,
    });
  }

  /**
   * Natural Language Investigation using Hybrid RAG (Structured SQL + Semantic Context).
   */
  async investigate(organizationId: string, input: AIInvestigationInput): Promise<AIInvestigationResponse> {
    // 1. Gather all tenant customers and current financial summaries
    const [customers, org] = await Promise.all([
      prisma.customer.findMany({
        where: { organizationId },
        include: {
          invoices: { where: { balance: { gt: 0 } }, orderBy: { dueDate: 'asc' } },
          commitments: { orderBy: { promisedDate: 'desc' }, take: 3 },
          riskAssessments: { orderBy: { evaluatedAt: 'desc' }, take: 1 },
          conversations: {
            take: 2,
            include: {
              messages: { take: 3, orderBy: { timestamp: 'desc' } },
            },
          },
        },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
      }),
    ]);

    const currency = org?.currency || 'NGN';

    // 2. Build Structured Facts from authoritative DB
    const structuredFacts = customers
      .map((c) => {
        const totalBal = c.invoices.reduce((sum, inv) => sum + inv.balance, 0);
        const overdueInvs = c.invoices.filter(
          (inv) => DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate) > 0
        );
        const oldestDays = overdueInvs.reduce(
          (max, inv) => Math.max(max, DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate)),
          0
        );
        const missed = c.commitments.filter((cm) => cm.status === 'MISSED');
        const pending = c.commitments.filter((cm) => cm.status === 'PENDING');
        const risk = c.riskAssessments[0]?.riskLevel || 'LOW';

        return `- Customer "${c.name}" (ID: ${c.id}): Total Outstanding: ${currency} ${totalBal.toLocaleString()}, Overdue Invoices: ${overdueInvs.length} (Oldest: ${oldestDays} days late), Missed Promises: ${missed.length}, Pending Promises: ${pending.length}, Risk Level: ${risk}.`;
      })
      .join('\n');

    // 3. Build Semantic / Conversation Excerpts
    const semanticExcerpts = customers
      .flatMap((c) =>
        c.conversations.flatMap((conv) =>
          conv.messages.map((m) => `[${c.name} - ${m.senderName} (${new Date(m.timestamp).toLocaleDateString()})]: "${m.content}"`)
        )
      )
      .join('\n');

    // 4. Target Customer details if scoped
    let customerDetails = '';
    if (input.customerId) {
      const target = customers.find((c) => c.id === input.customerId);
      if (target) {
        customerDetails = `Target Customer: ${target.name}\nNotes: ${target.notes || 'None'}\nPhone: ${target.phone || 'N/A'}`;
      }
    }

    // 5. Call Core AI
    return this.ai.investigate(
      { query: input.query, customerId: input.customerId, conversationHistory: input.conversationHistory },
      { structuredFacts, semanticExcerpts, customerDetails }
    );
  }

  /**
   * Extract Payment Commitment from text/message.
   */
  async extractCommitment(organizationId: string, input: ExtractCommitmentInput): Promise<ExtractedCommitmentOutput> {
    let context = input.context;
    if (input.customerId) {
      const cust = await prisma.customer.findFirst({
        where: { id: input.customerId, organizationId },
      });
      if (cust) {
        context = `${cust.name} (Currency: ${cust.currency})`;
      }
    }

    return this.ai.extractCommitment({
      text: input.text,
      customerId: input.customerId,
      currentDate: input.currentDate || new Date().toISOString().split('T')[0],
      context,
    });
  }

  /**
   * Drafts a culturally respectful collection message tailored for African SME relationships.
   */
  async draftFollowupMessage(organizationId: string, input: DraftMessageInput): Promise<AIDraftMessageResponse> {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId },
      include: {
        invoices: { where: { balance: { gt: 0 } }, orderBy: { dueDate: 'asc' } },
        commitments: { orderBy: { promisedDate: 'desc' }, take: 1 },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const totalOutstanding = customer.invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const oldestOverdueDays = customer.invoices.reduce(
      (max, inv) => Math.max(max, DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate)),
      0
    );

    let recentCommitmentSummary: string | undefined = undefined;
    if (customer.commitments.length > 0) {
      const comm = customer.commitments[0];
      recentCommitmentSummary = `Promised ${comm.currency} ${comm.amount.toLocaleString()} on ${new Date(comm.promisedDate).toLocaleDateString()} (${comm.status})`;
    }

    return this.ai.draftFollowupMessage({
      ...input,
      customerName: customer.name,
      currency: customer.currency || 'NGN',
      totalOutstanding,
      daysOverdue: oldestOverdueDays,
      recentCommitmentSummary,
    });
  }
}
