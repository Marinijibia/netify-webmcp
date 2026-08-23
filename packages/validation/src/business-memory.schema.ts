import { z } from 'zod';

export const MemoryCategoryEnum = z.enum([
  'PAYMENT_BEHAVIOR',
  'COLLECTION_BEHAVIOR',
  'COMMITMENT_BEHAVIOR',
  'RECEIVABLE_HISTORY',
  'CUSTOMER_ACTIVITY',
  'CUSTOMER_PREFERENCE',
  'RELATIONSHIP_HISTORY',
]);

export const MemoryTypeEnum = z.enum([
  'PAYMENT_FREQUENCY',
  'PAYMENT_TIMELINESS',
  'PAYMENT_COMMITMENT_HISTORY',
  'PAYMENT_COMMITMENT_FULFILLMENT_RATE',
  'PAYMENT_COMMITMENT_MISSED_RATE',
  'PARTIAL_PAYMENT_PATTERN',
  'COLLECTION_RESPONSE_PATTERN',
  'EXTENSION_PATTERN',
  'DISPUTE_PATTERN',
  'RECEIVABLE_OVERDUE_PATTERN',
  'CUSTOMER_ACTIVITY_PATTERN',
]);

export const MemoryTimeWindowEnum = z.enum([
  'LAST_30_DAYS',
  'LAST_90_DAYS',
  'LAST_180_DAYS',
  'ALL_TIME',
]);

export const MemoryStatusEnum = z.enum([
  'ACTIVE',
  'SUPERSEDED',
  'INVALIDATED',
]);

export const CustomerMemoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  category: MemoryCategoryEnum.optional(),
  type: MemoryTypeEnum.optional(),
  status: MemoryStatusEnum.optional().default('ACTIVE'),
  timeWindow: MemoryTimeWindowEnum.optional(),
});

export const MemoryEvidenceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CustomerMemoryQueryInput = z.input<typeof CustomerMemoryQuerySchema>;
export type CustomerMemoryQueryOutput = z.infer<typeof CustomerMemoryQuerySchema>;
export type MemoryEvidenceQueryInput = z.input<typeof MemoryEvidenceQuerySchema>;
export type MemoryEvidenceQueryOutput = z.infer<typeof MemoryEvidenceQuerySchema>;
