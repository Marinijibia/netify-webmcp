import { renderBaseEmailTemplate } from './base.template';
import { WelcomeEmailData } from '../email.types';

export function renderWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Welcome to Netify — AI Collections for African SMEs`;

  const bodyContent = `
    <p>Hello <strong>${data.firstName}</strong>,</p>
    <p>Welcome to <strong>Netify</strong>! Your organization workspace <strong>${
      data.organizationName || 'your business'
    }</strong> is now verified and active.</p>
    
    <p>With Netify, you can now:</p>
    <ul style="padding-left: 20px; color: #cbd5e1; line-height: 24px;">
      <li>⚡ <strong>Automate Debtor Follow-ups</strong> on WhatsApp, SMS, and Voice notes.</li>
      <li>📊 <strong>Score Payment Risk</strong> before issuing supplier credit.</li>
      <li>🧠 <strong>Track Business Memory</strong> on payment promises and agreements.</li>
    </ul>

    ${
      data.dashboardUrl
        ? `<div style="text-align: center; margin-top: 24px;">
            <a href="${data.dashboardUrl}" class="btn">Launch Netify Workspace</a>
           </div>`
        : ''
    }

    <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
      Need help setting up your team? Reply to this email anytime.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    previewText: `Your Netify workspace is ready.`,
    heading: 'Welcome to Netify',
    bodyContent,
    footerNote: 'Welcome to the future of cashflow management in Africa.',
  });

  const text = `Hello ${data.firstName},\n\nWelcome to Netify! Your organization workspace (${
    data.organizationName || 'your business'
  }) is active.\n\nBest regards,\nThe Netify Team`;

  return { subject, html, text };
}
