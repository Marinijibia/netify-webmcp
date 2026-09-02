import { renderBaseEmailTemplate } from './base.template';
import { VerificationEmailData } from '../email.types';

export function renderVerificationEmail(data: VerificationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${data.code} is your Netify verification code`;

  const bodyContent = `
    <div style="margin-bottom: 16px;">
      <span style="background: rgba(0, 165, 129, 0.15); border: 1px solid rgba(0, 165, 129, 0.4); color: #00A581; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700;">
        &#128737; Account Verification
      </span>
    </div>

    <p style="margin: 0 0 14px 0;">Hello <strong>${data.firstName || 'there'}</strong>,</p>
    <p style="margin: 0 0 20px 0; color: #CBD5E1;">
      Welcome to <strong>Netify</strong>! Enter the 6-digit verification code below to verify your email address and activate your organization workspace:
    </p>

    <div class="code-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; margin-bottom: 8px; font-weight: 700;">
        Your 6-Digit Verification PIN
      </div>
      <span class="code-digit">${data.code}</span>
    </div>

    ${
      data.verificationUrl
        ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.verificationUrl}" class="btn" style="background-color: #00A581; color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
        Verify Account Online &rarr;
      </a>
    </div>
    `
        : ''
    }

    <div style="background-color: #00253E; border-left: 3px solid #00A581; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 12.5px; color: #94A3B8; line-height: 1.5;">
        &#9201; <strong>Security Notice:</strong> This code is valid for <strong>15 minutes</strong> and can only be used once. If you did not create a Netify account, you can safely ignore this message.
      </p>
    </div>
  `;

  const html = renderBaseEmailTemplate({
    previewText: `${data.code} is your 6-digit Netify verification PIN.`,
    heading: 'Verify Your Email Address',
    bodyContent,
    footerNote: 'This is an automated authentication email from Netify Security.',
  });

  const text = `Hello ${data.firstName},\n\nYour 6-digit verification code for Netify is: ${data.code}\n\nThis code is valid for 15 minutes.\n\nIf you did not sign up for Netify, please ignore this email.\n\nBest regards,\nThe Netify Security Team`;

  return { subject, html, text };
}
