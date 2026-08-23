import { z } from 'zod';

export const BusinessEventTypeEnum = z.enum([
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'RECEIVABLE_CREATED',
  'RECEIVABLE_CANCELLED',
  'RECEIVABLE_OVERDUE',
  'RECEIVABLE_PAID',
  'RECEIVABLE_PARTIALLY_PAID',
  'PAYMENT_CREATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_FAILED',
  'PAYMENT_REVERSED',
  'COLLECTION_ACTIVITY_RECORDED',
  'PAYMENT_COMMITMENT_CREATED',
  'PAYMENT_COMMITMENT_FULFILLED',
  'PAYMENT_COMMITMENT_PARTIALLY_FULFILLED',
  'PAYMENT_COMMITMENT_MISSED',
  'PAYMENT_COMMITMENT_CANCELLED',
  'INVOICE_CREATED',
  'DOCUMENT_UPLOADED',
]);

export const ActorTypeEnum = z.enum(['USER', 'SYSTEM', 'CUSTOMER', 'PROVIDER']);

export const EventSourceEnum = z.enum([
  'USER_ACTION',
  'PAYMENT_PROCESS',
  'COLLECTION_ACTIVITY',
  'SCHEDULED_PROCESS',
  'SYSTEM',
]);

export const BusinessEventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  customerId: z.string().uuid().optional(),
  receivableId: z.string().uuid().optional(),
  type: BusinessEventTypeEnum.optional(),
  actorType: ActorTypeEnum.optional(),
  source: EventSourceEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const CustomerTimelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ReceivableTimelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type BusinessEventQueryInput = z.infer<typeof BusinessEventQuerySchema>;
export type CustomerTimelineQueryInput = z.infer<typeof CustomerTimelineQuerySchema>;
export type ReceivableTimelineQueryInput = z.infer<typeof ReceivableTimelineQuerySchema>;
