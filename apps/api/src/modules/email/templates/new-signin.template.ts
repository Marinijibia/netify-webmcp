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
    <div style="margin-bottom: 16px;">
      <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #F59E0B; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700;">
        &#128205; New Login Detected
      </span>
    </div>

    <p style="margin: 0 0 14px 0;">Hello <strong>${firstName}</strong>,</p>
    <p style="margin: 0 0 20px 0; color: #CBD5E1;">
      We detected a new sign-in to your <strong>Netify</strong> workspace account.
    </p>

    <!-- Structured Device Details Card -->
    <div style="background-color: #00253E; border: 1px solid #0B3C5D; border-radius: 10px; padding: 18px; margin: 20px 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="color: #94A3B8; font-size: 12.5px; padding-bottom: 8px;"><strong>Device & Browser:</strong></td>
          <td style="color: #F8FAFC; font-size: 12.5px; padding-bottom: 8px; text-align: right;">${
            deviceName || 'Web Browser'
          } (${platform || 'Computer / Mobile'})</td>
        </tr>
        <tr>
          <td style="color: #94A3B8; font-size: 12.5px; padding-bottom: 8px;"><strong>Time (UTC):</strong></td>
          <td style="color: #F8FAFC; font-size: 12.5px; padding-bottom: 8px; text-align: right;">${timestamp}</td>
        </tr>
        ${
          ipAddress
            ? `
        <tr>
          <td style="color: #94A3B8; font-size: 12.5px;"><strong>IP Address:</strong></td>
          <td style="color: #00A581; font-size: 12.5px; font-family: monospace; text-align: right;">${ipAddress}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
      If this was you, you can safely ignore this email. If this wasn't you, sign in and revoke the active session under <strong>Settings &rarr; Biometrics & Sessions</strong>.
    </p>

    <div style="text-align: center; margin: 24px 0 8px 0;">
      <a href="https://app.netify.africa/settings" class="btn" style="background-color: #00A581; color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 14px;">
        Review Account Sessions &rarr;
      </a>
    </div>
  `;

  const html = renderBaseEmailTemplate({
    previewText: 'A new device or location signed into your Netify account.',
    heading: 'New Sign-In Detected',
    bodyContent,
    footerNote: 'Automated Account Security Alert.',
  });

  const text = `Hello ${firstName},\n\nA new sign-in to your Netify account was detected on ${timestamp} from ${
    deviceName || 'Unknown device'
  }.\n\nIf this was not you, please review your active sessions in Settings.\n\nBest regards,\nThe Netify Security Team`;

  return { subject, html, text };
}
