import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@netify/types';

export const createPaymentSchema = z.object({
  receivableId: z.string().uuid('Valid receivable ID is required'),
  customerId: z.string().uuid('Valid customer ID is required').optional(),
  invoiceId: z.string().uuid('Valid invoice ID').optional(),
  amount: z
    .union([
      z.number().positive('Payment amount must be greater than zero'),
      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number with up to 2 decimal places')
        .transform((val) => parseFloat(val)),
    ])
    .refine((val) => val > 0, 'Payment amount must be greater than zero'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter ISO code')
    .toUpperCase()
    .optional(),
  paidAt: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((d) => !isNaN(d.getTime()), 'Valid payment date is required')
    .optional(),
  paymentDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((d) => !isNaN(d.getTime()), 'Valid payment date is required')
    .optional(),
  method: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.BANK_TRANSFER),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().max(100, 'Reference must not exceed 100 characters').optional().nullable(),
  idempotencyKey: z.string().max(100, 'Idempotency key must not exceed 100 characters').optional().nullable(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional().nullable(),
  source: z.string().optional().nullable(),
});

export const paymentQuerySchema = z.object({
  receivableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
export type PaymentQueryInput = z.input<typeof paymentQuerySchema>;
