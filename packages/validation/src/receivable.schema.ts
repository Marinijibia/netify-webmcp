import { z } from 'zod';
import { ReceivableSource, ReceivableStatus } from '@netify/types';

export const createReceivableSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  amount: z
    .union([
      z.number().positive('Receivable amount must be greater than zero'),
      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with up to 2 decimal places')
        .transform((val) => parseFloat(val)),
    ])
    .refine((val) => val > 0, 'Receivable amount must be greater than zero'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter ISO code')
    .toUpperCase()
    .optional(),
  dueDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((d) => !isNaN(d.getTime()), 'Valid due date is required'),
  issuedAt: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  source: z.nativeEnum(ReceivableSource).optional().default(ReceivableSource.MANUAL),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  reference: z.string().max(100, 'Reference must not exceed 100 characters').optional().nullable(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional().nullable(),
});

export const updateReceivableSchema = z.object({
  dueDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((d) => !isNaN(d.getTime()), 'Valid due date is required')
    .optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  reference: z.string().max(100, 'Reference must not exceed 100 characters').optional().nullable(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional().nullable(),
});

export const receivableQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(ReceivableStatus).optional(),
  isOverdue: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReceivableInput = z.input<typeof createReceivableSchema>;
export type UpdateReceivableInput = z.input<typeof updateReceivableSchema>;
export type ReceivableQueryInput = z.input<typeof receivableQuerySchema>;
