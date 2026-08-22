import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().optional(),
  organizationName: z.string().trim().min(2, 'Organization name must be at least 2 characters').optional(),
  currency: z.string().trim().length(3).default('NGN').optional(),
  country: z.string().trim().min(2).default('Nigeria').optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().trim().optional(),
  deviceName: z.string().trim().optional(),
  platform: z.string().trim().optional(),
  appVersion: z.string().trim().optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  code: z.string().trim().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  code: z.string().trim().min(6, 'Reset code must be 6 digits').max(6, 'Reset code must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  revokeOtherSessions: z.boolean().default(true).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required'),
});

export const updateOnboardingSchema = z.object({
  step: z.string().min(1).optional(),
  onboardingData: z.record(z.any()).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>;
