import { z } from 'zod';
import { CustomerStatus, ContactType } from '@netify/types';

// International & African Phone validation (e.g. +234..., +254..., 080..., etc.)
export const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export const createCustomerContactSchema = z.object({
  type: z.nativeEnum(ContactType, {
    errorMap: () => ({ message: 'Contact type must be PHONE, EMAIL, WHATSAPP, or OTHER' }),
  }),
  value: z
    .string({ required_error: 'Contact value is required' })
    .trim()
    .min(1, 'Contact value cannot be empty')
    .max(255, 'Contact value is too long'),
  label: z.string().trim().max(50, 'Label cannot exceed 50 characters').optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.type === ContactType.EMAIL) {
      return z.string().email().safeParse(data.value).success;
    }
    if (data.type === ContactType.PHONE || data.type === ContactType.WHATSAPP) {
      return phoneRegex.test(data.value);
    }
    return true;
  },
  {
    message: 'Invalid contact value for the selected contact type',
    path: ['value'],
  }
);

export const updateCustomerContactSchema = z.object({
  type: z.nativeEnum(ContactType).optional(),
  value: z.string().trim().min(1).max(255).optional(),
  label: z.string().trim().max(50).optional().nullable(),
  isPrimary: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.type && data.value) {
      if (data.type === ContactType.EMAIL) {
        return z.string().email().safeParse(data.value).success;
      }
      if (data.type === ContactType.PHONE || data.type === ContactType.WHATSAPP) {
        return phoneRegex.test(data.value);
      }
    }
    return true;
  },
  {
    message: 'Invalid contact value for the selected contact type',
    path: ['value'],
  }
);

export const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Invalid phone number format',
    })
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  country: z.string().trim().length(2).optional().default('NG'),
  currency: z.string().trim().length(3).optional().default('NGN'),
  status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.ACTIVE),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Customer name must be at least 2 characters').max(100).optional(),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Invalid phone number format',
    })
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  status: z.nativeEnum(CustomerStatus).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const customerQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerContactInput = z.input<typeof createCustomerContactSchema>;
export type UpdateCustomerContactInput = z.input<typeof updateCustomerContactSchema>;
export type CreateCustomerInput = z.input<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.input<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.input<typeof customerQuerySchema>;
