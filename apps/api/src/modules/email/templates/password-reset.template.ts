import { renderBaseEmailTemplate } from './base.template';
import { PasswordResetEmailData } from '../email.types';

export function renderPasswordResetEmail(data: PasswordResetEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${data.code} is your Netify password reset code`;

  const bodyContent = `
    <p>Hello <strong>${data.firstName}</strong>,</p>
    <p>We received a request to reset your password for your <strong>Netify</strong> account.</p>
    <p>Enter the 6-digit code below in the mobile application to choose a new password:</p>
    
    <div class="code-box">
      <span class="code-digit">${data.code}</span>
    </div>

    ${
      data.resetUrl
        ? `<div style="text-align: center;">
            <a href="${data.resetUrl}" class="btn">Reset Password</a>
           </div>`
        : ''
    }

    <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
      ⏳ This reset code is valid for <strong>1 hour</strong> and can only be used once. If you did not request this, please secure your account immediately.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    previewText: `${data.code} is your Netify password reset code`,
    heading: 'Reset Your Netify Password',
    bodyContent,
    footerNote: 'If you did not request a password reset, no action is needed.',
  });

  const text = `Hello ${data.firstName},\n\nYour 6-digit password reset code for Netify is: ${data.code}\n\nThis code expires in 1 hour.\n\nBest regards,\nThe Netify Team`;

  return { subject, html, text };
}
