import { renderBaseEmailTemplate } from './base.template';
import { TeamInviteEmailData } from '../email.types';

export function renderTeamInviteEmail(data: TeamInviteEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `You have been invited to join ${data.organizationName} on Netify`;

  const bodyContent = `
    <div style="margin-bottom: 16px;">
      <span style="background: rgba(0, 165, 129, 0.15); border: 1px solid rgba(0, 165, 129, 0.4); color: #00A581; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700;">
        &#128101; Team Invitation
      </span>
    </div>

    <p style="margin: 0 0 14px 0;">Hello,</p>
    <p style="margin: 0 0 20px 0; color: #CBD5E1;">
      <strong>${data.inviterName}</strong> has invited you to collaborate on the <strong>${data.organizationName}</strong> workspace on Netify.
    </p>

    <!-- Invitation Details Box -->
    <div style="background-color: #00253E; border: 1px solid #0B3C5D; border-radius: 10px; padding: 18px; margin: 20px 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="color: #94A3B8; font-size: 12.5px; padding-bottom: 8px;"><strong>Organization:</strong></td>
          <td style="color: #F8FAFC; font-size: 13px; font-weight: 700; padding-bottom: 8px; text-align: right;">${data.organizationName}</td>
        </tr>
        <tr>
          <td style="color: #94A3B8; font-size: 12.5px;"><strong>Assigned Role:</strong></td>
          <td style="color: #00A581; font-size: 12.5px; font-weight: 700; text-align: right; text-transform: uppercase;">${data.role}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
      Accepting this invitation allows you to log collections, track customer payment promises, and manage debtor ledgers under your assigned team permissions.
    </p>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${data.inviteUrl}" class="btn" style="background-color: #00A581; color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-size: 15px;">
        Accept Invitation & Join Team &rarr;
      </a>
    </div>
  `;

  const html = renderBaseEmailTemplate({
    previewText: `${data.inviterName} invited you to join ${data.organizationName} on Netify.`,
    heading: 'Team Member Invitation',
    bodyContent,
    footerNote: 'Collaborate with your team on AI collections and business memory.',
  });

  const text = `Hello,\n\n${data.inviterName} has invited you to join ${data.organizationName} on Netify as a ${data.role}.\n\nAccept invitation: ${data.inviteUrl}\n\nBest regards,\nThe Netify Team`;

  return { subject, html, text };
}
