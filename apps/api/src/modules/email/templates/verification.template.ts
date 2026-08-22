import { renderBaseEmailTemplate } from './base.template';
import { VerificationEmailData } from '../email.types';

export function renderVerificationEmail(data: VerificationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${data.code} is your Netify verification code`;

  const bodyContent = `
    <p>Hello <strong>${data.firstName}</strong>,</p>
    <p>Thank you for signing up for <strong>Netify</strong>. Enter the 6-digit verification code below in the mobile application to activate your account:</p>
    
    <div class="code-box">
      <span class="code-digit">${data.code}</span>
    </div>

    ${
      data.verificationUrl
        ? `<div style="text-align: center;">
            <a href="${data.verificationUrl}" class="btn">Verify on Mobile</a>
           </div>`
        : ''
    }

    <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
      ⏳ This verification code expires in <strong>24 hours</strong>. If you did not create a Netify account, you can safely ignore this email.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    previewText: `${data.code} is your Netify verification code`,
    heading: 'Verify Your Email Address',
    bodyContent,
    footerNote: 'This is an automated authentication email from Netify Security.',
  });

  const text = `Hello ${data.firstName},\n\nYour 6-digit verification code for Netify is: ${data.code}\n\nThis code expires in 24 hours.\n\nBest regards,\nThe Netify Team`;

  return { subject, html, text };
}
