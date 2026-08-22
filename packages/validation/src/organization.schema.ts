import { z } from 'zod';

// Supported African & Global ISO Country Codes
export const VALID_COUNTRY_CODES = [
  'NG', // Nigeria
  'GH', // Ghana
  'KE', // Kenya
  'ZA', // South Africa
  'RW', // Rwanda
  'UG', // Uganda
  'TZ', // Tanzania
  'EG', // Egypt
  'CI', // Ivory Coast
  'SN', // Senegal
  'CM', // Cameroon
  'ZM', // Zambia
  'ZW', // Zimbabwe
  'US', // United States
  'GB', // United Kingdom
] as const;

// Supported ISO 4217 Currency Codes
export const VALID_CURRENCY_CODES = [
  'NGN', // Nigerian Naira
  'GHS', // Ghanaian Cedi
  'KES', // Kenyan Shilling
  'ZAR', // South African Rand
  'RWF', // Rwandan Franc
  'UGX', // Ugandan Shilling
  'TZS', // Tanzanian Shilling
  'EGP', // Egyptian Pound
  'XOF', // West African CFA Franc
  'XAF', // Central African CFA Franc
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
] as const;

// Canonical IANA Timezone validation helper
export function isValidIanaTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters'),
  businessType: z
    .string({ required_error: 'Business type is required' })
    .trim()
    .min(2, 'Business type must be at least 2 characters')
    .max(50, 'Business type cannot exceed 50 characters'),
  country: z
    .string({ required_error: 'Country code is required' })
    .trim()
    .toUpperCase()
    .min(2, 'Country code must be a valid 2-letter ISO code')
    .max(2, 'Country code must be a valid 2-letter ISO code')
    .refine((val) => /^[A-Z]{2}$/.test(val), {
      message: 'Country must be a valid 2-letter ISO code (e.g. NG, GH, KE, ZA, RW)',
    }),
  currency: z
    .string({ required_error: 'Currency code is required' })
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a valid 3-letter ISO code (e.g. NGN, GHS, KES, USD)')
    .refine((val) => /^[A-Z]{3}$/.test(val), {
      message: 'Currency must be a valid 3-letter ISO code (e.g. NGN, GHS, KES, USD)',
    }),
  timezone: z
    .string({ required_error: 'Timezone is required' })
    .trim()
    .refine(isValidIanaTimezone, {
      message: 'Timezone must be a valid IANA timezone identifier (e.g. Africa/Lagos, Africa/Accra, Africa/Nairobi)',
    }),
  phone: z.string().trim().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  businessType: z.string().trim().min(2, 'Business type must be at least 2 characters').max(50).optional(),
  timezone: z
    .string()
    .trim()
    .refine(isValidIanaTimezone, {
      message: 'Timezone must be a valid IANA timezone identifier (e.g. Africa/Lagos, Africa/Accra, Africa/Nairobi)',
    })
    .optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  settings: z.record(z.any()).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER', 'ADMIN', 'MANAGER', 'STAFF'], {
    required_error: 'Role is required',
  }),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INVITED', 'SUSPENDED', 'REMOVED'], {
    required_error: 'Status is required',
  }),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;
