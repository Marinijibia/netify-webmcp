import { z } from 'zod';
import { CommitmentStatus, CommitmentSource, ConfidenceLevel } from '@netify/types';

export const createCommitmentSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  invoiceId: z.string().uuid('Valid invoice ID').optional(),
  amount: z.number().positive('Promised amount must be greater than zero'),
  currency: z.string().min(3).max(3).default('NGN'),
  promisedDate: z.string().or(z.date()).transform((val) => new Date(val)),
  description: z.string().optional(),
  source: z.nativeEnum(CommitmentSource).default(CommitmentSource.MANUAL),
  sourceReference: z.string().optional(),
  confidence: z.nativeEnum(ConfidenceLevel).default(ConfidenceLevel.HIGH),
  status: z.nativeEnum(CommitmentStatus).default(CommitmentStatus.PENDING),
  evidenceId: z.string().optional(),
});

export const updateCommitmentStatusSchema = z.object({
  status: z.nativeEnum(CommitmentStatus),
  notes: z.string().optional(),
});

export const commitmentQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(CommitmentStatus).optional(),
  dueThisWeek: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCommitmentInput = z.infer<typeof createCommitmentSchema>;
export type UpdateCommitmentStatusInput = z.infer<typeof updateCommitmentStatusSchema>;
export type CommitmentQueryInput = z.infer<typeof commitmentQuerySchema>;
