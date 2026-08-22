import { z } from 'zod';
import { CustomerStatus } from '@netify/types';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  country: z.string().default('Nigeria'),
  currency: z.string().min(3).max(3).default('NGN'),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.ACTIVE),
  creditPeriodDays: z.number().int().min(0, 'Credit period must be 0 or more days').max(365).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  riskLevel: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
