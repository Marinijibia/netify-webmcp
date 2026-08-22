export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VerificationEmailData {
  to: string;
  firstName: string;
  code: string;
  verificationUrl?: string;
}

export interface PasswordResetEmailData {
  to: string;
  firstName: string;
  code: string;
  resetUrl?: string;
}

export interface WelcomeEmailData {
  to: string;
  firstName: string;
  organizationName?: string;
  dashboardUrl?: string;
}
