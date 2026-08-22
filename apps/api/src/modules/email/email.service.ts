import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  EmailDeliveryResult,
  PasswordResetEmailData,
  SendEmailOptions,
  VerificationEmailData,
  WelcomeEmailData,
} from './email.types';
import { renderVerificationEmail } from './templates/verification.template';
import { renderPasswordResetEmail } from './templates/password-reset.template';
import { renderWelcomeEmail } from './templates/welcome.template';
import { renderPasswordChangedEmail } from './templates/password-changed.template';
import { renderNewSignInEmail } from './templates/new-signin.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendClient: Resend | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly verificationUrlTemplate: string | null;
  private readonly resetUrlTemplate: string | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'onboarding@resend.dev';
    this.fromName = this.configService.get<string>('RESEND_FROM_NAME') || 'Netify';
    this.verificationUrlTemplate =
      this.configService.get<string>('AUTH_VERIFICATION_URL') || null;
    this.resetUrlTemplate =
      this.configService.get<string>('AUTH_RESET_URL') || null;

    if (apiKey && apiKey.startsWith('re_') && apiKey !== 're_123456789' && apiKey !== 're_test_key') {
      this.resendClient = new Resend(apiKey);
      this.logger.log(`Resend client initialized for sender "${this.fromName} <${this.fromEmail}>"`);
    } else {
      this.logger.warn('RESEND_API_KEY is not configured or is a placeholder.');
    }
  }

  /**
   * Dispatches an email through Resend
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    const fromAddress = `${this.fromName} <${this.fromEmail}>`;

    if (this.resendClient) {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: options.replyTo,
        });

        if (error) {
          this.logger.error(`Resend email delivery failed: ${error.message}`);
          return { success: false, error: error.message };
        }

        const maskedRecipient = Array.isArray(options.to)
          ? options.to.map((e) => this.maskEmail(e)).join(', ')
          : this.maskEmail(options.to);

        this.logger.log(`Email delivered to ${maskedRecipient} (messageId: ${data?.id})`);
        return { success: true, messageId: data?.id };
      } catch (err: any) {
        this.logger.error(`Unexpected error during email dispatch: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'Email delivery client not configured.' };
  }

  /**
   * Sends email verification with 6-digit PIN and optional app deep link
   */
  async sendVerificationEmail(
    to: string,
    firstName: string,
    code: string,
    verificationToken?: string
  ): Promise<EmailDeliveryResult> {
    let verificationUrl: string | undefined;

    if (this.verificationUrlTemplate && verificationToken) {
      verificationUrl = this.verificationUrlTemplate
        .replace('{token}', verificationToken)
        .replace('{email}', encodeURIComponent(to));
    }

    const { subject, html, text } = renderVerificationEmail({
      to,
      firstName,
      code,
      verificationUrl,
    });

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Sends password reset email with 6-digit PIN and optional reset deep link
   */
  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    code: string,
    resetToken?: string
  ): Promise<EmailDeliveryResult> {
    let resetUrl: string | undefined;

    if (this.resetUrlTemplate && resetToken) {
      resetUrl = this.resetUrlTemplate
        .replace('{token}', resetToken)
        .replace('{email}', encodeURIComponent(to));
    }

    const { subject, html, text } = renderPasswordResetEmail({
      to,
      firstName,
      code,
      resetUrl,
    });

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Sends welcome email after organization workspace activation
   */
  async sendWelcomeEmail(
    to: string,
    firstName: string,
    organizationName?: string
  ): Promise<EmailDeliveryResult> {
    const { subject, html, text } = renderWelcomeEmail({
      to,
      firstName,
      organizationName,
    });

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Sends password changed notification
   */
  async sendPasswordChangedNotification(
    to: string,
    firstName: string,
    ipAddress?: string
  ): Promise<EmailDeliveryResult> {
    const timestamp = new Date().toUTCString();
    const { subject, html, text } = renderPasswordChangedEmail({
      firstName,
      timestamp,
      ipAddress,
    });

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Sends new sign-in security alert
   */
  async sendNewSignInNotification(
    to: string,
    firstName: string,
    deviceName?: string,
    platform?: string,
    ipAddress?: string
  ): Promise<EmailDeliveryResult> {
    const timestamp = new Date().toUTCString();
    const { subject, html, text } = renderNewSignInEmail({
      firstName,
      deviceName,
      platform,
      ipAddress,
      timestamp,
    });

    return this.sendEmail({ to, subject, html, text });
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***.***';
    const name = parts[0];
    const domain = parts[1];
    const maskedName =
      name.length > 2 ? `${name.substring(0, 2)}***${name.slice(-1)}` : '***';
    return `${maskedName}@${domain}`;
  }
}
