import { renderBaseEmailTemplate } from './base.template';

export function renderNewSignInEmail({
  firstName,
  deviceName,
  platform,
  ipAddress,
  timestamp,
}: {
  firstName: string;
  deviceName?: string;
  platform?: string;
  ipAddress?: string;
  timestamp: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Security Alert: New sign-in to your Netify account`;

  const bodyContent = `
    <p>Hello <strong>${firstName}</strong>,</p>
    <p>We detected a new sign-in to your <strong>Netify</strong> account on <strong>${timestamp}</strong>.</p>
    
    <div style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;"><strong>Device:</strong> ${
        deviceName || 'Mobile / Web Client'
      } (${platform || 'Unknown OS'})</p>
      ${
        ipAddress
          ? `<p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;"><strong>IP Address:</strong> ${ipAddress}</p>`
          : ''
      }
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      If this was you, you can safely ignore this email. If this wasn't you, sign in and revoke the session under <strong>Security & Sessions</strong> in your Netify settings.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    previewText: 'A new device signed into your Netify account.',
    heading: 'New Sign-In Detected',
    bodyContent,
    footerNote: 'Netify Account Security Alert.',
  });

  const text = `Hello ${firstName},\n\nA new sign-in to your Netify account was detected on ${timestamp} from ${
    deviceName || 'Unknown device'
  }.\n\nIf this was not you, please secure your account immediately.\n\nBest regards,\nThe Netify Team`;

  return { subject, html, text };
}
