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
        limit: input.limit || 10,
        currency: input.currency,
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
    execute: async (input: { query: string }) => {
      const data = await customersApi.list({ search: input.query });
      return {
        query: input.query,
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
    execute: async (input: { customerId: string }) => {
      const [customer, receivables, payments, commitments, activities] = await Promise.all([
        customersApi.getById(input.customerId),
        receivablesApi.list({ customerId: input.customerId }),
        paymentsApi.list({ customerId: input.customerId }),
        commitmentsApi.getCommitments({ customerId: input.customerId }),
        collectionActivitiesApi.getActivities({ customerId: input.customerId }),
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
    execute: async (input: { customerId: string }) => {
      const explanation = await aiApi.explainCustomer(input.customerId);
      return {
        customerId: input.customerId,
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
      customerId: string;
      tone?: 'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' | 'PARTIAL_PAYMENT_PROPOSAL';
      channel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'EMAIL';
    }) => {
      const draft = await aiApi.draftMessage(input.customerId, {
        tone: input.tone || 'DIRECT_FOLLOWUP',
        channel: input.channel || 'WHATSAPP',
      });

      return {
        proposal: {
          action: 'DISPATCH_FOLLOW_UP_MESSAGE',
          customerId: input.customerId,
          recipientName: draft.recipientName,
          channel: draft.channel,
          tone: draft.tone,
          messageBody: draft.messageBody,
          verifiedOutstandingAmount: draft.verifiedOutstandingAmount,
          currency: draft.currency,
          reviewUrl: `/messages/draft?customerId=${input.customerId}`,
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
      required: ['customerId', 'type', 'channel', 'outcome'],
    },
    execute: async (input: any) => {
      const record = await collectionActivitiesApi.createActivity({
        customerId: input.customerId,
        type: input.type || 'PAYMENT_REMINDER',
        channel: input.channel || 'WHATSAPP',
        outcome: input.outcome || 'CONTACTED',
        notes: input.notes,
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
];
