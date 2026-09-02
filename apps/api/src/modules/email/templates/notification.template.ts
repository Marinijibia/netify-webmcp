import { renderBaseEmailTemplate } from './base.template';

export interface NotificationEmailData {
  firstName: string;
  title: string;
  body: string;
  signalType?: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actionUrl?: string;
  data?: Record<string, any>;
}

function getSignalBadge(signalType?: string | null, priority?: string): string {
  if (signalType === 'PAYMENT_RECEIVED') {
    return '<span style="background:#065f46;color:#d1fae5;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">&#128176; Payment Confirmed</span>';
  }
  if (signalType === 'PROMISE_MISSED') {
    return '<span style="background:#7f1d1d;color:#fee2e2;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">&#128680; Promise Missed</span>';
  }
  if (signalType === 'PROMISE_DUE') {
    return '<span style="background:#78350f;color:#fef3c7;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">&#129309; Promise Due</span>';
  }
  if (signalType === 'RECEIVABLE_OVERDUE' || signalType === 'HIGH_PRIORITY_COLLECTION' || signalType === 'COLLECTION_FOLLOWUP_DUE') {
    return '<span style="background:#7f1d1d;color:#fee2e2;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">&#128680; Risk Alert</span>';
  }
  if (signalType === 'IMPORTANT_BUSINESS_CHANGE') {
    return '<span style="background:#1e1b4b;color:#e0e7ff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">&#129302; AI Signal</span>';
  }
  if (priority === 'HIGH') {
    return '<span style="background:#7f1d1d;color:#fee2e2;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">&#128680; Urgent Alert</span>';
  }
  return '<span style="background:#0c4a6e;color:#e0f2fe;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">&#128276; Business Alert</span>';
}

export function renderNotificationEmail(data: NotificationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const actionUrl = data.actionUrl || 'https://app.netify.africa/notifications';
  const badge = getSignalBadge(data.signalType, data.priority);

  const subject = data.priority === 'HIGH'
    ? `[Urgent] ${data.title} — Netify Alert`
    : `${data.title} — Netify Alert`;

  const bodyContent = `
    <p>Hello <strong>${data.firstName || 'there'}</strong>,</p>

    <div style="margin: 20px 0;">
      ${badge}
    </div>

    <div style="background: #002B49; border-left: 4px solid #00A581; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px; color: #ffffff; font-size: 18px;">${data.title}</h2>
      <p style="margin: 0; color: #CBD5E1; font-size: 15px; line-height: 1.6;">${data.body}</p>
    </div>

    ${data.data?.customerName ? `
    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px;">Customer</p>
    <p style="color: #ffffff; font-size: 15px; font-weight: 700; margin: 0 0 16px;">${data.data.customerName}</p>
    ` : ''}

    ${data.data?.amount ? `
    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px;">Amount</p>
    <p style="color: #00A581; font-size: 20px; font-weight: 800; margin: 0 0 20px;">${data.data.amount}</p>
    ` : ''}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${actionUrl}" class="btn" style="background: #00A581; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; display: inline-block;">
        Open in Netify &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #475569; margin-top: 32px; border-top: 1px solid #1e3a5f; padding-top: 16px;">
      This is an automated alert from your Netify Business Command Center.<br>
      <a href="${actionUrl.replace('/notifications', '/settings')}#notifications" style="color: #00A581;">Manage notification preferences</a>
    </p>
  `;

  const html = renderBaseEmailTemplate({
    previewText: data.title,
    heading: 'Netify Business Alert',
    bodyContent,
  });

  const text = `${data.title}\n\n${data.body}\n\nOpen in Netify: ${actionUrl}`;

  return { subject, html, text };
}
