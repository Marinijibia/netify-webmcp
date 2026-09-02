import { renderBaseEmailTemplate } from './base.template';
import { PasswordResetEmailData } from '../email.types';

export function renderPasswordResetEmail(data: PasswordResetEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${data.code} is your Netify password reset code`;

  const bodyContent = `
    <div style="margin-bottom: 16px;">
      <span style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #EF4444; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700;">
        &#128274; Password Reset Request
      </span>
    </div>

    <p style="margin: 0 0 14px 0;">Hello <strong>${data.firstName || 'there'}</strong>,</p>
    <p style="margin: 0 0 20px 0; color: #CBD5E1;">
      We received a request to reset the password for your <strong>Netify</strong> workspace account. Enter the 6-digit code below or use the direct reset button:
    </p>

    <div class="code-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; margin-bottom: 8px; font-weight: 700;">
        Your Password Reset PIN
      </div>
      <span class="code-digit">${data.code}</span>
    </div>

    ${
      data.resetUrl
        ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.resetUrl}" class="btn" style="background-color: #00A581; color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
        Reset Password Now &rarr;
      </a>
    </div>
    `
        : ''
    }

    <div style="background-color: #00253E; border-left: 3px solid #EF4444; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 12.5px; color: #94A3B8; line-height: 1.5;">
        &#9201; <strong>Security Notice:</strong> This reset code is valid for <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email — your password remains completely unchanged and secure.
      </p>
    </div>
  `;

  const html = renderBaseEmailTemplate({
    previewText: `${data.code} is your Netify password reset code.`,
    heading: 'Reset Your Password',
    bodyContent,
    footerNote: 'If you did not request a password reset, no action is needed.',
  });

  const text = `Hello ${data.firstName},\n\nYour 6-digit password reset code for Netify is: ${data.code}\n\nThis code is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Netify Security Team`;

  return { subject, html, text };
}
