import { z } from 'zod';
import { CommitmentStatus } from '@netify/types';

export const createCommitmentSchema = z.object({
  receivableId: z.string().uuid('Valid receivable ID is required'),
  customerId: z.string().uuid('Valid customer ID is required').optional(),
  amount: z
    .union([
      z.number().positive('Promised amount must be greater than zero'),
      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with up to 2 decimal places')
        .transform((val) => parseFloat(val)),
    ])
    .refine((val) => val > 0, 'Promised amount must be greater than zero'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter ISO code')
    .toUpperCase()
    .optional(),
  promisedFor: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((d) => !isNaN(d.getTime()), 'Valid promised date is required'),
  sourceActivityId: z.string().uuid('Valid source activity ID').optional().nullable(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional().nullable(),
});

export const cancelCommitmentSchema = z.object({
  notes: z.string().max(500, 'Cancellation reason must not exceed 500 characters').optional().nullable(),
});

export const commitmentQuerySchema = z.object({
  receivableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(CommitmentStatus).optional(),
  timeframe: z.enum(['ALL', 'TODAY', 'UPCOMING', 'MISSED', 'FULFILLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCommitmentInput = z.input<typeof createCommitmentSchema>;
export type CancelCommitmentInput = z.input<typeof cancelCommitmentSchema>;
export type CommitmentQueryInput = z.input<typeof commitmentQuerySchema>;
