import { z } from 'zod';
import { InvoiceStatus } from '@netify/types';

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().min(0, 'Unit price must be zero or positive'),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  dueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  currency: z.string().min(3).max(3).default('NGN'),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.ISSUED),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
});

export const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  dueDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  notes: z.string().optional(),
});

export const invoiceQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  overdueOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
