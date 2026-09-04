import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/oauth/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.app.netify.ng/api/v1';

const OAUTH_CHALLENGE_URL =
  'https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&response_type=code&redirect_uri=https://app.netify.ng/oauth/callback&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getBackendToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'merchant@netify.ng',
      password: 'Password123!',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.data?.tokens?.accessToken) {
    throw new Error(`Backend auth failed: ${data?.message || res.statusText}`);
  }

  const token: string = data.data.tokens.accessToken;
  cachedToken = token;
  tokenExpiresAt = now + 15 * 60 * 1000;
  return token;
}

function formatCurrency(amount: number | string, currency = 'NGN'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'KES' ? 'KSh ' : '₦';
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const tokenParam = req.nextUrl.searchParams.get('token');
  const rawToken = authHeader?.replace(/^Bearer\s+/i, '') || tokenParam;

  // 1. Evaluate token validity
  let isAuthorized = false;
  let agentName = 'Authorized AI Agent';
  let workspaceName = 'FuelOS (Wholesale & Distribution)';
  let agentTenantId = 'demo-org-fuelos';

  if (rawToken) {
    const val = verifyAgentToken(rawToken);
    if (val.valid && val.payload) {
      isAuthorized = true;
      agentName = val.payload.clientName || 'ChatGPT Agent';
      workspaceName = val.payload.tenantName || 'FuelOS';
      agentTenantId = val.payload.tenantId || 'demo-org-fuelos';
    }
  }

  // 2. If NOT authorized -> Return HTTP 401 Unauthorized with OAuth consent challenge
  if (!isAuthorized) {
    const accept = req.headers.get('accept') || '';

    if (accept.includes('application/json') || req.nextUrl.searchParams.get('format') === 'json') {
      return NextResponse.json(
        {
          error: 'authorization_required',
          status: 401,
          message:
            'Access Denied: External AI agent requires delegated merchant authorization to view promises or trade ledgers.',
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

    // HTML challenge response formatted for browser agents and human users
    const htmlChallenge = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>401 Unauthorized — Agent Authorization Required | Netify</title>
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="WWW-Authenticate" content="Bearer realm='Netify WebMCP', error='authorization_required', authorization_uri='${OAUTH_CHALLENGE_URL}'">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #00111E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box;">
  <div style="max-width: 580px; width: 100%; background-color: #00192B; border: 2px solid #EF4444; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <div style="width: 44px; height: 44px; border-radius: 10px; background-color: rgba(239, 68, 68, 0.2); color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 22px;">
        🛑
      </div>
      <div>
        <h2 style="margin: 0; font-size: 20px; color: #FFFFFF;">401 Unauthorized: AI Agent Access Denied</h2>
        <span style="font-size: 12px; color: #94A3B8;">Netify Protected Trade Promises Ledger • RFC 7636 Guard</span>
      </div>
    </div>

    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
      External AI agents (such as ChatGPT, Claude, or browser agents) are <strong>not authorized</strong> to view merchant promises or debtor ledgers without explicit merchant approval.
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
        (If you are not logged in, sign in as merchant@netify.ng / Password123!, then approve agent access)
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

  // 3. If AUTHORIZED -> Query REAL LIVE Data from NestJS PostgreSQL Database!
  let todayCommitments: any[] = [];
  let missedCommitments: any[] = [];
  let priorities: any[] = [];
  let briefing: any = null;

  try {
    const backendToken = await getBackendToken();
    const headers = { Authorization: `Bearer ${backendToken}` };

    const [todayRes, missedRes, prioritiesRes, briefingRes] = await Promise.all([
      fetch(`${API_BASE_URL}/commitments/today`, { headers }).catch(() => null),
      fetch(`${API_BASE_URL}/commitments/missed`, { headers }).catch(() => null),
      fetch(`${API_BASE_URL}/command-center/priorities?limit=5`, { headers }).catch(() => null),
      fetch(`${API_BASE_URL}/command-center/briefing`, { headers }).catch(() => null),
    ]);

    if (todayRes && todayRes.ok) {
      const data = await todayRes.json();
      todayCommitments = data.data || [];
    }
    if (missedRes && missedRes.ok) {
      const data = await missedRes.json();
      missedCommitments = data.data || [];
    }
    if (prioritiesRes && prioritiesRes.ok) {
      const data = await prioritiesRes.json();
      priorities = data.data?.items || [];
    }
    if (briefingRes && briefingRes.ok) {
      const data = await briefingRes.json();
      briefing = data.data;
    }
  } catch (err: any) {
    console.error('Failed to fetch live database records in /promises:', err?.message);
  }

  const totalAmountPromisedToday = todayCommitments.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  const responseData = {
    success: true,
    status: 'AUTHORIZED',
    agent: agentName,
    workspace: workspaceName,
    tenantId: agentTenantId,
    currency: 'NGN',
    timestamp: new Date().toISOString(),
    summary: {
      totalPromisesToday: todayCommitments.length,
      totalAmountPromisedToday,
      formattedPromisedToday: formatCurrency(totalAmountPromisedToday),
      missedCommitmentsCount: missedCommitments.length,
      highPriorityDebtorsCount: priorities.length,
    },
    promisesDueToday: todayCommitments.map((c: any) => ({
      id: c.id,
      customerName: c.customer?.name || 'Customer',
      customerId: c.customerId,
      amount: Number(c.amount),
      formattedAmount: formatCurrency(c.amount, c.currency),
      promisedFor: c.promisedFor,
      status: c.status,
      notes: c.notes || 'Promise recorded on receivable ' + (c.receivable?.reference || ''),
      contactPerson: c.customer?.phone || c.customer?.email || 'N/A',
      invoiceReference: c.receivable?.reference || 'N/A',
    })),
    missedCommitments: missedCommitments.slice(0, 5).map((c: any) => ({
      id: c.id,
      customerName: c.customer?.name || 'Customer',
      customerId: c.customerId,
      amount: Number(c.amount),
      formattedAmount: formatCurrency(c.amount, c.currency),
      promisedFor: c.promisedFor,
      daysOverdue: c.daysOverdue || 0,
      notes: c.notes || 'Promise missed',
      status: c.status,
    })),
    urgentDebtorAccounts: priorities.map((p: any) => ({
      customerName: p.customerName,
      customerId: p.customerId,
      outstandingBalance: p.totalOutstanding,
      formattedBalance: formatCurrency(p.totalOutstanding, p.currency),
      overdueDays: p.oldestOverdueDays,
      priorityScore: p.priorityScore,
      urgency: p.urgency,
      reasons: p.reasons || [],
      contactPhone: p.phone,
      recommendedAction: `Dispatch respectful reminder for ${formatCurrency(p.totalOutstanding, p.currency)}`,
    })),
  };

  const accept = req.headers.get('accept') || '';
  if (accept.includes('application/json') || req.nextUrl.searchParams.get('format') === 'json') {
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Render clean, live HTML report for browser agents
  const htmlAuthorized = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Today's Promises — Netify Trade Ledger (Live Database)</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #00111E; color: #FFFFFF; padding: 32px 20px; margin: 0;">
  <div style="max-width: 760px; margin: 0 auto; background-color: #00192B; border: 1px solid #00A581; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #0F3850; padding-bottom: 16px;">
      <div>
        <h1 style="margin: 0; font-size: 22px; color: #FFFFFF;">📋 Today's Payment Promises</h1>
        <span style="font-size: 12px; color: #3AD0A9;">Live Tenant: ${workspaceName} • Authorized Agent: ${agentName}</span>
      </div>
      <span style="background-color: rgba(16, 185, 129, 0.2); color: #10B981; padding: 4px 12px; border-radius: 20px; font-size: 11.5px; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.4);">
        ✓ Authorized (OAuth 2.0 PKCE Verified)
      </span>
    </div>

    <!-- Summary KPI Bar -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px;">
      <div style="background-color: #002238; border: 1px solid #0F3850; border-radius: 10px; padding: 14px;">
        <span style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">Due Today</span>
        <div style="font-size: 20px; font-weight: bold; color: #FFFFFF; margin-top: 4px;">${todayCommitments.length} Promises</div>
        <span style="font-size: 12px; color: #3AD0A9;">${formatCurrency(totalAmountPromisedToday)}</span>
      </div>
      <div style="background-color: #002238; border: 1px solid #0F3850; border-radius: 10px; padding: 14px;">
        <span style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">Missed Promises</span>
        <div style="font-size: 20px; font-weight: bold; color: #EF4444; margin-top: 4px;">${missedCommitments.length} Missed</div>
        <span style="font-size: 12px; color: #94A3B8;">Requires Escalation</span>
      </div>
      <div style="background-color: #002238; border: 1px solid #0F3850; border-radius: 10px; padding: 14px;">
        <span style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">Priority Debtors</span>
        <div style="font-size: 20px; font-weight: bold; color: #F59E0B; margin-top: 4px;">${priorities.length} Accounts</div>
        <span style="font-size: 12px; color: #94A3B8;">Action Queue</span>
      </div>
    </div>

    <!-- Section 1: Promises Due Today -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 15px; color: #3AD0A9; text-transform: uppercase; letter-spacing: 0.5px;">⭐ Commitments Due Today</h3>
      ${todayCommitments.length === 0 ? `
        <div style="background-color: #002238; border: 1px dashed #334155; border-radius: 10px; padding: 16px; color: #94A3B8; font-size: 13.5px;">
          No new payment commitments are scheduled exclusively for today. See the <strong>${missedCommitments.length} missed commitments</strong> below requiring immediate follow-up.
        </div>
      ` : todayCommitments.map((c: any) => `
        <div style="background-color: #002238; border: 1px solid #00A581; border-radius: 12px; padding: 16px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 15px; color: #FFFFFF;">${c.customer?.name || 'Customer'}</strong>
            <span style="font-size: 16px; font-weight: bold; color: #10B981;">${formatCurrency(c.amount, c.currency)}</span>
          </div>
          <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Due:</strong> ${new Date(c.promisedFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <strong>Contact:</strong> ${c.customer?.phone || c.customer?.email || 'N/A'}</p>
          <p style="margin: 4px 0; font-size: 12.5px; color: #94A3B8;"><strong>Notes:</strong> ${c.notes || 'Promise confirmed'}</p>
        </div>
      `).join('')}
    </div>

    <!-- Section 2: Missed Commitments (From live database) -->
    ${missedCommitments.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 15px; color: #EF4444; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Missed Commitments Needing Follow-up</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${missedCommitments.slice(0, 4).map((c: any) => `
            <div style="background-color: #001524; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="font-size: 14px; color: #FFFFFF;">${c.customer?.name || 'Customer'}</strong>
                <span style="color: #EF4444; font-weight: bold; font-size: 14px;">${formatCurrency(c.amount, c.currency)}</span>
              </div>
              <p style="margin: 4px 0; font-size: 12.5px; color: #94A3B8;">
                Invoice: <strong>${c.receivable?.reference || 'INV'}</strong> • Promised for: ${new Date(c.promisedFor).toLocaleDateString()}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #F87171;">
                Reason: ${c.notes || 'Payment not received on agreed date'}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Section 3: High-Urgency Debtors (From live database) -->
    <div>
      <h3 style="margin: 0 0 12px; font-size: 15px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">⚡ High-Urgency Overdue Debtor Accounts</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${priorities.map((p: any) => `
          <div style="background-color: #001524; border: 1px solid #334155; border-radius: 10px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 14.5px; color: #FFFFFF;">${p.customerName}</strong>
              <span style="background-color: rgba(239, 68, 68, 0.2); color: #EF4444; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                ${p.urgency} (${p.oldestOverdueDays}d overdue)
              </span>
            </div>
            <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;">
              Outstanding Balance: <strong style="color: #FFFFFF;">${formatCurrency(p.totalOutstanding, p.currency)}</strong>
              ${p.phone ? ` • Phone: ${p.phone}` : ''}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #3AD0A9;">
              Action: Generate culturally respectful WhatsApp reminder.
            </p>
          </div>
        `).join('')}
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
