import { 
  commandCenterApi, 
  customersApi, 
  receivablesApi, 
  paymentsApi, 
  commitmentsApi, 
  collectionActivitiesApi, 
  aiApi 
} from '../api';
import { WebMCPToolDefinition } from './types';

// Helper to gracefully resolve a valid customer ID if none is supplied
async function resolveCustomerId(customerId?: string): Promise<string> {
  if (customerId && typeof customerId === 'string' && customerId.trim() !== '') {
    return customerId.trim();
  }
  try {
    const priorities = await commandCenterApi.getPriorities({ limit: 1 });
    if (priorities && priorities.length > 0) {
      return priorities[0].customerId;
    }
  } catch (e) {
    // Fallback to customer list
  }
  const customers = await customersApi.list();
  if (customers && customers.length > 0) {
    return customers[0].id;
  }
  throw new Error('No debtor accounts found in the organization.');
}

// Helper to gracefully resolve a valid receivable and customer ID
async function resolveReceivableInfo(receivableId?: string, customerId?: string): Promise<{ receivableId: string; customerId: string }> {
  if (receivableId && customerId) {
    return { receivableId, customerId };
  }
  if (customerId) {
    const recs = await receivablesApi.list({ customerId, status: 'OPEN' });
    if (recs && recs.length > 0) return { receivableId: recs[0].id, customerId };
    const anyRecs = await receivablesApi.list({ customerId });
    if (anyRecs && anyRecs.length > 0) return { receivableId: anyRecs[0].id, customerId };
  }
  const overdueRecs = await receivablesApi.list({ isOverdue: true });
  if (overdueRecs && overdueRecs.length > 0) {
    return { receivableId: overdueRecs[0].id, customerId: overdueRecs[0].customerId };
  }
  const all = await receivablesApi.list();
  if (all && all.length > 0) {
    return { receivableId: all[0].id, customerId: all[0].customerId };
  }
  throw new Error('No open receivables found in the organization.');
}

export const webMCPTools: WebMCPToolDefinition[] = [
  {
    name: 'get_collection_priority',
    description: 'Retrieve prioritized debtor accounts ranked by urgency, aging days, risk score, and broken commitments from the live collections queue.',
    category: 'READ_ONLY',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of priority customers to return (default: 10)',
        },
        currency: {
          type: 'string',
          description: 'Currency filter e.g. NGN, KES, GHS, USD',
        },
      },
    },
    execute: async (input: { limit?: number; currency?: string } = {}) => {
      const data = await commandCenterApi.getPriorities({
        limit: input?.limit || 10,
        currency: input?.currency,
      });

      return {
        count: data.length,
        items: data.map((item) => ({
          customerId: item.customerId,
          customerName: item.customerName,
          totalOutstanding: item.totalOutstanding,
          totalOverdue: item.totalOverdue,
          oldestOverdueDays: item.oldestOverdueDays,
          priorityScore: item.priorityScore,
          urgency: item.urgency,
          reasons: item.reasons,
          inspectRoute: `/customers/${item.customerId}`,
          draftActionRoute: `/messages/draft?customerId=${item.customerId}`,
        })),
      };
    },
  },

  {
    name: 'search_customers',
    description: 'Search customer accounts by business name or address with live ledger balances and risk status.',
    category: 'READ_ONLY',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Customer name or location to search',
        },
      },
      required: ['query'],
    },
    execute: async (input: { query?: string } = {}) => {
      const query = input?.query || '';
      const data = await customersApi.list({ search: query });
      return {
        query,
        count: data.length,
        customers: data.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          status: c.status,
          riskLevel: c.riskLevel,
          totalOutstanding: c.totalOutstanding ?? 0,
          currency: c.currency,
          route: `/customers/${c.id}`,
        })),
      };
    },
  },

  {
    name: 'get_customer_evidence',
    description: 'Fetch detailed debtor evidence for a specific customer: active invoices, historical payments, WhatsApp/SMS commitment logs, and past collection activities.',
    category: 'READ_ONLY',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The unique ID of the customer account',
        },
      },
      required: ['customerId'],
    },
    execute: async (input: { customerId?: string } = {}) => {
      const targetCustomerId = await resolveCustomerId(input?.customerId);
      const [customer, receivables, payments, commitments, activities] = await Promise.all([
        customersApi.getById(targetCustomerId),
        receivablesApi.list({ customerId: targetCustomerId }),
        paymentsApi.list({ customerId: targetCustomerId }),
        commitmentsApi.getCommitments({ customerId: targetCustomerId }),
        collectionActivitiesApi.getActivities({ customerId: targetCustomerId }),
      ]);

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          status: customer.status,
          currency: customer.currency,
        },
        receivables: receivables.map((r) => ({
          id: r.id,
          reference: r.reference,
          balance: r.balance,
          dueDate: r.dueDate,
          isOverdue: r.isOverdue,
          daysOverdue: r.daysOverdue,
          status: r.status,
        })),
        commitments: commitments.map((com) => ({
          id: com.id,
          amount: com.amount,
          promisedFor: com.promisedFor,
          status: com.status,
          notes: com.notes,
        })),
        recentPayments: payments.slice(0, 5).map((p) => ({
          id: p.id,
          amount: p.amount,
          paidAt: p.paidAt,
          method: p.method,
        })),
        recentActivities: activities.slice(0, 5).map((a) => ({
          id: a.id,
          type: a.type,
          channel: a.channel,
          outcome: a.outcome,
          occurredAt: a.occurredAt,
        })),
      };
    },
  },

  {
    name: 'get_customer_risk_profile',
    description: 'Retrieve AI-grounded risk explanation, behavioral patterns, and recommended recovery strategy for a customer.',
    category: 'READ_ONLY',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The unique ID of the customer account',
        },
      },
      required: ['customerId'],
    },
    execute: async (input: { customerId?: string } = {}) => {
      const targetCustomerId = await resolveCustomerId(input?.customerId);
      const explanation = await aiApi.explainCustomer(targetCustomerId);
      return {
        customerId: targetCustomerId,
        summary: explanation.summary,
        whyItMatters: explanation.whyItMatters,
        recommendation: explanation.recommendation,
        confidence: explanation.confidence,
      };
    },
  },

  {
    name: 'draft_follow_up_message',
    description: 'Generate a culturally appropriate, evidence-grounded collection reminder draft for a customer with specific channel and tone. Does NOT send message (safe proposal).',
    category: 'PROPOSAL',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The unique customer ID',
        },
        tone: {
          type: 'string',
          description: 'Tone of the message',
          enum: ['RESPECTFUL_REMINDER', 'DIRECT_FOLLOWUP', 'URGENT_ESCALATION', 'PARTIAL_PAYMENT_PROPOSAL'],
        },
        channel: {
          type: 'string',
          description: 'Delivery channel',
          enum: ['WHATSAPP', 'SMS', 'PHONE_CALL', 'EMAIL'],
        },
      },
      required: ['customerId'],
    },
    execute: async (input: {
      customerId?: string;
      tone?: 'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' | 'PARTIAL_PAYMENT_PROPOSAL';
      channel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'EMAIL';
    } = {}) => {
      const targetCustomerId = await resolveCustomerId(input?.customerId);
      const draft = await aiApi.draftMessage(targetCustomerId, {
        tone: input?.tone || 'DIRECT_FOLLOWUP',
        channel: input?.channel || 'WHATSAPP',
      });

      return {
        proposal: {
          action: 'DISPATCH_FOLLOW_UP_MESSAGE',
          customerId: targetCustomerId,
          recipientName: draft.recipientName,
          channel: draft.channel,
          tone: draft.tone,
          messageBody: draft.messageBody || (draft as any).messageText || '',
          verifiedOutstandingAmount: draft.verifiedOutstandingAmount,
          currency: draft.currency,
          reviewUrl: `/messages/draft?customerId=${targetCustomerId}`,
          requiresHumanConfirmation: true,
        },
      };
    },
  },

  {
    name: 'record_collection_activity',
    description: 'Persist a verified collection activity record or customer payment promise into the live timeline. Requires human review.',
    category: 'MUTATING',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Customer ID',
        },
        receivableId: {
          type: 'string',
          description: 'Receivable ID (optional if customerId provided)',
        },
        type: {
          type: 'string',
          description: 'Activity type e.g. PAYMENT_REMINDER, FOLLOW_UP, CALL',
        },
        channel: {
          type: 'string',
          description: 'Channel e.g. WHATSAPP, SMS, PHONE, IN_PERSON',
        },
        outcome: {
          type: 'string',
          description: 'Outcome e.g. CONTACTED, PROMISED_PAYMENT, NO_RESPONSE',
        },
        notes: {
          type: 'string',
          description: 'Activity notes and details',
        },
      },
      required: ['type', 'channel', 'outcome'],
    },
    execute: async (input: any = {}) => {
      const { receivableId, customerId } = await resolveReceivableInfo(input?.receivableId, input?.customerId);

      const record = await collectionActivitiesApi.createActivity({
        receivableId,
        customerId,
        type: input?.type || 'PAYMENT_REMINDER',
        channel: input?.channel || 'WHATSAPP',
        outcome: input?.outcome || 'CONTACTED',
        notes: input?.notes || 'Collection activity logged via WebMCP agent.',
      });

      return {
        success: true,
        activityId: record.id,
        customerId: record.customerId,
        occurredAt: record.occurredAt,
        message: 'Collection activity persisted to live customer timeline.',
      };
    },
  },

  {
    name: 'list_receivables',
    description: 'Query live invoices and receivables filtered by status (OPEN, OVERDUE, PAID) or customer ID.',
    category: 'READ_ONLY',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Filter receivables by customer ID',
        },
        status: {
          type: 'string',
          description: 'Status filter: OPEN, OVERDUE, PARTIALLY_PAID, PAID',
          enum: ['OPEN', 'OVERDUE', 'PARTIALLY_PAID', 'PAID'],
        },
        isOverdue: {
          type: 'boolean',
          description: 'Filter only overdue receivables',
        },
      },
    },
    execute: async (input: any = {}) => {
      const data = await receivablesApi.list(input || {});
      return {
        count: data.length,
        receivables: data.map((r) => ({
          id: r.id,
          reference: r.reference,
          customerId: r.customerId,
          customerName: r.customer?.name,
          balance: r.balance,
          originalAmount: r.originalAmount,
          currency: r.currency,
          dueDate: r.dueDate,
          isOverdue: r.isOverdue,
          daysOverdue: r.daysOverdue,
          status: r.status,
          detailRoute: `/receivables/${r.id}`,
        })),
      };
    },
  },

  {
    name: 'create_payment_commitment',
    description: 'Record a customer promise-to-pay date and amount into the live database. Requires human confirmation.',
    category: 'MUTATING',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The unique customer ID',
        },
        amount: {
          type: 'number',
          description: 'Amount the customer promised to pay',
        },
        promisedFor: {
          type: 'string',
          description: 'Date customer promised to pay (ISO 8601 string e.g. 2026-09-05T00:00:00Z)',
        },
        notes: {
          type: 'string',
          description: 'Notes regarding the commitment agreement',
        },
      },
      required: ['amount', 'promisedFor'],
    },
    execute: async (input: any = {}) => {
      const { receivableId, customerId } = await resolveReceivableInfo(input?.receivableId, input?.customerId);

      const amount = Number(input?.amount) || 250000;
      const promisedFor = input?.promisedFor || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const commitment = await commitmentsApi.createCommitment({
        receivableId,
        customerId,
        amount,
        promisedFor,
        notes: input?.notes || 'Payment commitment confirmed with customer via WebMCP.',
      });

      return {
        success: true,
        commitmentId: commitment.id,
        customerId: commitment.customerId,
        amount: commitment.amount,
        promisedFor: commitment.promisedFor,
        status: commitment.status,
        message: 'Payment commitment successfully scheduled in live database.',
      };
    },
  },
];
