import { z } from 'zod';
import { PaymentMethod } from '@netify/types';

export const createPaymentSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  invoiceId: z.string().uuid('Valid invoice ID').optional(),
  amount: z.number().positive('Payment amount must be greater than zero'),
  currency: z.string().min(3).max(3).default('NGN'),
  paymentDate: z.string().or(z.date()).transform((val) => new Date(val)),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  reference: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const paymentQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
