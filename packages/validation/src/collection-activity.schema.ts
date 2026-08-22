import { z } from 'zod';
import { ActivityType, CollectionChannel, ActivityOutcome } from '@netify/types';

export const inlineCommitmentSchema = z.object({
  amount: z
    .union([
      z.number().positive('Promised amount must be greater than zero'),
      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with up to 2 decimal places')
        .transform((val) => parseFloat(val)),
    ])
    .refine((val) => val > 0, 'Promised amount must be greater than zero'),
  promisedFor: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((d) => !isNaN(d.getTime()), 'Valid promised date is required'),
  notes: z.string().max(1000, 'Commitment notes must not exceed 1000 characters').optional().nullable(),
});

export const createCollectionActivitySchema = z.object({
  receivableId: z.string().uuid('Valid receivable ID is required'),
  customerId: z.string().uuid('Valid customer ID is required').optional(),
  type: z.nativeEnum(ActivityType),
  channel: z.nativeEnum(CollectionChannel),
  outcome: z.nativeEnum(ActivityOutcome),
  occurredAt: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((d) => !isNaN(d.getTime()), 'Valid activity date is required')
    .optional(),
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters').optional().nullable(),
  commitment: inlineCommitmentSchema.optional(),
});

export const activityQuerySchema = z.object({
  receivableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  type: z.nativeEnum(ActivityType).optional(),
  channel: z.nativeEnum(CollectionChannel).optional(),
  outcome: z.nativeEnum(ActivityOutcome).optional(),
  performedByUserId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCollectionActivityInput = z.input<typeof createCollectionActivitySchema>;
export type ActivityQueryInput = z.input<typeof activityQuerySchema>;
export type InlineCommitmentInput = z.input<typeof inlineCommitmentSchema>;
