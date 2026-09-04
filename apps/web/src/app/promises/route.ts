import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/oauth/store';

const OAUTH_CHALLENGE_URL =
  'https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&response_type=code&redirect_uri=https://app.netify.ng/oauth/callback&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft';

const TODAY_PROMISES_DATA = {
  success: true,
  status: 'AUTHORIZED',
  agent: 'ChatGPT Agent',
  workspace: 'FuelOS (Wholesale & Distribution)',
  currency: 'NGN',
  summary: {
    totalPromisesToday: 1,
    totalAmountPromisedToday: 450000,
    formattedPromisedToday: '₦450,000',
    missedCommitmentsCount: 2,
  },
  promisesDueToday: [
    {
      id: 'commit-today-001',
      customerName: 'Musa Enterprises',
      customerId: 'e86a8453-e1c2-4526-92a1-42b3d31c125f',
      amount: 450000,
      formattedAmount: '₦450,000',
      promisedFor: new Date().toISOString().split('T')[0] + 'T14:00:00.000Z',
      dueDateLabel: 'Today (Due by 2:00 PM)',
      channel: 'WHATSAPP',
      contactPerson: 'Musa Bello (+234 803 111 2233)',
      notes: 'Customer agreed over WhatsApp to transfer ₦450,000 after offloading afternoon shipment.',
      status: 'PENDING_VERIFICATION',
      recommendedAction: 'Send respectful payment confirmation reminder at 1:30 PM if not yet received.',
    },
  ],
  urgentDebtorAccounts: [
    {
      customerName: 'ABC Stores',
      customerId: 'f14e802a-573d-46bb-8257-317bdc3cddb0',
      outstandingBalance: 850000,
      formattedBalance: '₦850,000',
      overdueDays: 24,
      priorityScore: 75,
      urgency: 'HIGH',
      previousPromiseStatus: 'MISSED',
      lastPromiseNote: 'Promised ₦850k settlement last Friday; defaulted.',
      recommendedAction: 'Dispatch respectful WhatsApp reminder with invoice #INV-2024-001 evidence waybill.',
    },
    {
      customerName: 'Northern Distribution',
      customerId: '7e8093e8-ce07-4d20-8628-0b6ad59286a2',
      outstandingBalance: 1050000,
      formattedBalance: '₦1,050,000',
      overdueDays: 39,
      priorityScore: 66,
      urgency: 'MEDIUM',
      previousPromiseStatus: 'MISSED',
      recommendedAction: 'Schedule executive phone call with finance manager.',
    },
  ],
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const tokenParam = req.nextUrl.searchParams.get('token');
  const rawToken = authHeader?.replace(/^Bearer\s+/i, '') || tokenParam;

  // 1. Evaluate token validity
  let isAuthorized = false;
  let agentName = 'Authorized Agent';

  if (rawToken) {
    const val = verifyAgentToken(rawToken);
    if (val.valid && val.payload) {
      isAuthorized = true;
      agentName = val.payload.clientName || 'ChatGPT Agent';
    }
  }

  // 2. If NOT authorized -> Return HTTP 401 Unauthorized with OAuth consent challenge
  if (!isAuthorized) {
    const accept = req.headers.get('accept') || '';

    if (accept.includes('application/json')) {
      return NextResponse.json(
        {
          error: 'authorization_required',
          status: 401,
          message:
            'Access Denied: External AI agent requires delegated merchant authorization to view promises.',
          authorization_url: OAUTH_CHALLENGE_URL,
          instructions:
            'Please direct the user to open the authorization_url to sign in and grant delegated agent access.',
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': `Bearer realm="Netify WebMCP", error="authorization_required", authorization_uri="${OAUTH_CHALLENGE_URL}"`,
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // HTML challenge response
    const htmlChallenge = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>401 Unauthorized — Agent Authorization Required | Netify</title>
  <meta name="robots" content="noindex, nofollow">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #00111E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box;">
  <div style="max-width: 580px; width: 100%; background-color: #00192B; border: 2px solid #EF4444; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <div style="width: 44px; height: 44px; border-radius: 10px; background-color: rgba(239, 68, 68, 0.2); color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 22px;">
        🛑
      </div>
      <div>
        <h2 style="margin: 0; font-size: 20px; color: #FFFFFF;">401 Unauthorized: AI Agent Access Denied</h2>
        <span style="font-size: 12px; color: #94A3B8;">Netify Protected Trade Promises Ledger</span>
      </div>
    </div>

    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
      External AI agents (such as ChatGPT, Claude, or browser agents) are <strong>not authorized</strong> to view merchant promises or debtor ledgers without explicit approval.
    </p>

    <div style="background-color: rgba(0, 165, 129, 0.1); border: 1px solid #00A581; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 14px; font-size: 14px; font-weight: 600; color: #3AD0A9;">
        To authorize this AI agent to check today's promises:
      </p>
      <a href="${OAUTH_CHALLENGE_URL}"
         style="display: inline-block; background-color: #00A581; color: #FFFFFF; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14.5px; box-shadow: 0 4px 14px rgba(0, 165, 129, 0.4);">
        👉 Click Here to Authorize Netify Access
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #94A3B8;">
        (If you are not logged in, you will sign in first, then grant agent access)
      </p>
    </div>

    <div style="background-color: #00111E; border: 1px solid #1E293B; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #94A3B8; line-height: 1.5;">
      <strong>Instruction for AI Agent:</strong> You do not possess the required credentials to read Netify promises. Tell the user that access was denied and provide the authorization link above so they can sign in and approve your access.
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(htmlChallenge, {
      status: 401,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'WWW-Authenticate': `Bearer realm="Netify WebMCP", error="authorization_required", authorization_uri="${OAUTH_CHALLENGE_URL}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 3. If AUTHORIZED -> Return Today's Promises!
  const accept = req.headers.get('accept') || '';
  const responseData = {
    ...TODAY_PROMISES_DATA,
    agent: agentName,
    timestamp: new Date().toISOString(),
  };

  if (accept.includes('application/json') || req.nextUrl.searchParams.get('format') === 'json') {
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Render clean HTML report for browser agents
  const htmlAuthorized = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today's Promises — Netify Trade Ledger (Authorized)</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #00111E; color: #FFFFFF; padding: 32px 20px; margin: 0;">
  <div style="max-width: 720px; margin: 0 auto; background-color: #00192B; border: 1px solid #00A581; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #0F3850; padding-bottom: 16px;">
      <div>
        <h1 style="margin: 0; font-size: 22px; color: #FFFFFF;">📋 Today's Payment Promises</h1>
        <span style="font-size: 12px; color: #3AD0A9;">Workspace: FuelOS • Authorized Agent: ${agentName}</span>
      </div>
      <span style="background-color: rgba(16, 185, 129, 0.2); color: #10B981; padding: 4px 12px; border-radius: 20px; font-size: 11.5px; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.4);">
        ✓ Authorized (OAuth 2.0 PKCE)
      </span>
    </div>

    <div style="background-color: #002238; border: 1px solid #00A581; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; color: #3AD0A9;">⭐ Commitment Due Today:</h3>
      <div style="font-size: 14px; line-height: 1.6;">
        <p style="margin: 4px 0;"><strong>Customer:</strong> Musa Enterprises</p>
        <p style="margin: 4px 0;"><strong>Amount Promised:</strong> <span style="font-size: 16px; font-weight: bold; color: #10B981;">₦450,000</span></p>
        <p style="margin: 4px 0;"><strong>Time:</strong> Today by 2:00 PM</p>
        <p style="margin: 4px 0;"><strong>Channel:</strong> WhatsApp (+234 803 111 2233)</p>
        <p style="margin: 4px 0;"><strong>Notes:</strong> Agreed to transfer ₦450,000 balance after afternoon delivery arrival.</p>
        <p style="margin: 4px 0; color: #FCD34D;"><strong>Action:</strong> If not received by 1:30 PM, dispatch respectful follow-up reminder.</p>
      </div>
    </div>

    <h3 style="margin: 0 0 12px; font-size: 15px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Overdue Accounts Needing Immediate Attention</h3>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="background-color: #001524; border: 1px solid #334155; border-radius: 10px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 14.5px; color: #FFFFFF;">1. ABC Stores</strong>
          <span style="background-color: rgba(239, 68, 68, 0.2); color: #EF4444; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">HIGH URGENCY (24 Days Overdue)</span>
        </div>
        <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;">Balance: <strong>₦850,000</strong> • Defaulted on last Friday's promise.</p>
        <p style="margin: 4px 0; font-size: 12.5px; color: #3AD0A9;">Recommended Action: Generate respectful WhatsApp reminder citing invoice #INV-2024-001.</p>
      </div>

      <div style="background-color: #001524; border: 1px solid #334155; border-radius: 10px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 14.5px; color: #FFFFFF;">2. Northern Distribution</strong>
          <span style="background-color: rgba(245, 158, 11, 0.2); color: #F59E0B; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">MEDIUM URGENCY (39 Days Overdue)</span>
        </div>
        <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;">Balance: <strong>₦1,050,000</strong> • 1 missed commitment.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(htmlAuthorized, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
