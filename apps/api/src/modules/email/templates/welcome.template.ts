import { renderBaseEmailTemplate } from './base.template';
import { WelcomeEmailData } from '../email.types';

export function renderWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Welcome to Netify — Your AI Collections Workspace is Ready`;
  const dashboardUrl = data.dashboardUrl || 'https://app.netify.africa/workspace';

  const bodyContent = `
    <div style="margin-bottom: 16px;">
      <span style="background: rgba(0, 165, 129, 0.15); border: 1px solid rgba(0, 165, 129, 0.4); color: #00A581; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700;">
        &#127881; Workspace Activated
      </span>
    </div>

    <p style="margin: 0 0 14px 0;">Hello <strong>${data.firstName}</strong>,</p>
    <p style="margin: 0 0 20px 0; color: #CBD5E1;">
      Welcome to <strong>Netify</strong>! Your organization workspace <strong>${
        data.organizationName || 'your business'
      }</strong> is now verified, configured, and active.
    </p>

    <!-- Superpower Bento Grid -->
    <div style="background-color: #00253E; border: 1px solid #0B3C5D; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #00A581; margin-bottom: 12px;">
        Core Superpowers Ready in Your Workspace
      </div>

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px; vertical-align: top; width: 28px; font-size: 16px;">&#9889;</td>
          <td style="padding-bottom: 12px; padding-left: 8px; color: #F8FAFC; font-size: 13.5px; line-height: 1.4;">
            <strong>Automate Debtor Follow-ups</strong> — 1-click WhatsApp, SMS, and voice notes crafted by AI.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px; vertical-align: top; width: 28px; font-size: 16px;">&#128202;</td>
          <td style="padding-bottom: 12px; padding-left: 8px; color: #F8FAFC; font-size: 13.5px; line-height: 1.4;">
            <strong>Risk Scoring & Aging Queues</strong> — Prioritize overdue invoices by repayment likelihood.
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 28px; font-size: 16px;">&#129504;</td>
          <td style="padding-left: 8px; color: #F8FAFC; font-size: 13.5px; line-height: 1.4;">
            <strong>Business Memory</strong> — Track broken promises, dispute resolutions, and customer repayment history.
          </td>
        </tr>
      </table>
    </div>

    <!-- Quickstart Steps -->
    <div style="margin: 24px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 10px;">
        3 Quick Steps to Get Started:
      </div>
      <ol style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 13px; line-height: 22px;">
        <li><strong style="color: #CBD5E1;">Add your first customer ledger</strong> in the Customers tab.</li>
        <li><strong style="color: #CBD5E1;">Create open receivables or invoices</strong> to track due dates.</li>
        <li><strong style="color: #CBD5E1;">Turn on Browser Web Push & Alerts</strong> in Settings.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${dashboardUrl}" class="btn" style="background-color: #00A581; color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-size: 15px;">
        Launch Netify Workspace &rarr;
      </a>
    </div>
  `;

  const html = renderBaseEmailTemplate({
    previewText: `Your Netify workspace is active and ready.`,
    heading: 'Welcome to Netify',
    bodyContent,
    footerNote: 'Welcome to the future of AI-driven credit and collections.',
  });

  const text = `Hello ${data.firstName},\n\nWelcome to Netify! Your organization workspace is now active.\n\nLaunch your workspace: ${dashboardUrl}\n\nBest regards,\nThe Netify Team`;

  return { subject, html, text };
}
