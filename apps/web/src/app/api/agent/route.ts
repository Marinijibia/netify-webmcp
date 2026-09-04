import { NextRequest } from 'next/server';
import { verifyAgentToken, getAgentSession, createAgentSession } from '@/lib/oauth/store';
import { fetchLiveWorkspaceData } from '@/lib/agent-live-data';
import { handleCorsPreflight, jsonWithCors } from '@/lib/cors';

const ALL_12_WEBMCP_TOOLS = [
  { name: 'get_collection_priority', label: '1. Collection Priorities', desc: 'Ranked debtor queue by urgency & balance', category: 'READ_ONLY' },
  { name: 'search_customers', label: '2. Search Customers', desc: 'Customer accounts directory search', category: 'READ_ONLY' },
  { name: 'list_receivables', label: '3. List Receivables', desc: 'Live invoices and overdue aging balances', category: 'READ_ONLY' },
  { name: 'get_customer_evidence', label: '4. Customer Evidence', desc: 'Comprehensive customer invoice & memory dossier', category: 'READ_ONLY' },
  { name: 'get_customer_risk_profile', label: '5. Customer Risk Profile', desc: 'AI-grounded default risk evaluation', category: 'READ_ONLY' },
  { name: 'get_daily_briefing', label: '6. Daily Briefing', desc: 'Executive morning briefing and attention items', category: 'READ_ONLY' },
  { name: 'list_notifications', label: '7. List Notifications', desc: 'Overdue payment notices & alerts', category: 'READ_ONLY' },
  { name: 'query_business_memory', label: '8. Business Memory', desc: 'Tenant-isolated qualitative trade memories', category: 'READ_ONLY' },
  { name: 'draft_follow_up_message', label: '9. Draft Message (Proposal)', desc: 'Safe culturally-grounded reminder draft', category: 'DRAFT' },
  { name: 'create_payment_commitment', label: '10. Create Commitment', desc: 'Promise-to-pay schedule (Human Confirmation)', category: 'CONSEQUENTIAL_WRITE' },
  { name: 'record_collection_activity', label: '11. Record Activity', desc: 'Call or WhatsApp activity (Human Confirmation)', category: 'CONSEQUENTIAL_WRITE' },
  { name: 'mark_notification_read', label: '12. Mark Notification Read', desc: 'Acknowledge notification by ID', category: 'CONSEQUENTIAL_WRITE' },
];

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const authHeader = req.headers.get('authorization');
  const tokenParam = searchParams.get('token');
  const sessionParam = searchParams.get('session') || searchParams.get('s');
  const rawToken = authHeader?.replace(/^Bearer\s+/i, '') || tokenParam;

  let isAuthorized = false;
  let agentName = 'ChatGPT Agent';
  let workspaceName = 'FuelOS (Wholesale & Distribution)';
  let tenantId = 'demo-org-fuelos';
  let activeSessionId = sessionParam || '';

  // Check direct token
  if (rawToken) {
    const val = verifyAgentToken(rawToken);
    if (val.valid && val.payload) {
      isAuthorized = true;
      agentName = val.payload.clientName || 'ChatGPT Agent';
      workspaceName = val.payload.tenantName || 'FuelOS';
      tenantId = val.payload.tenantId || 'demo-org-fuelos';
    }
  }

  // Check session
  if (!isAuthorized && sessionParam) {
    const session = getAgentSession(sessionParam);
    if (session && session.status === 'AUTHORIZED') {
      isAuthorized = true;
      agentName = session.clientName || 'ChatGPT Agent';
      workspaceName = session.tenantName || 'FuelOS';
      tenantId = session.tenantId || 'demo-org-fuelos';
      activeSessionId = session.sessionId;
    }
  }

  // If unauthorized -> Issue/resolve session and return 401 JSON
  if (!isAuthorized) {
    const session = createAgentSession({ preferredId: sessionParam || undefined });
    const authUrl = `https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&session=${encodeURIComponent(session.sessionId)}&response_type=code&redirect_uri=https://app.netify.ng/agent%3Fsession%3D${encodeURIComponent(session.sessionId)}&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256`;

    return jsonWithCors(
      {
        error: 'authorization_required',
        status: 401,
        message: 'Access Denied: External AI agent requires delegated merchant authorization to view promises or workspace data.',
        session_id: session.sessionId,
        authorization_url: authUrl,
        instructions: `Direct the user to the authorization_url to sign in and authorize this agent. Once authorized, reload https://app.netify.ng/agent?session=${session.sessionId} to continue.`,
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer realm="Netify WebMCP", error="authorization_required", authorization_uri="${authUrl}"`,
        },
      }
    );
  }

  // If authorized -> Fetch LIVE data from PostgreSQL Cloud SQL database
  const liveData = await fetchLiveWorkspaceData({
    agentName,
    workspaceName,
    tenantId,
  });

  return jsonWithCors({
    ...liveData,
    sessionId: activeSessionId || undefined,
    registeredWebMCPTools: ALL_12_WEBMCP_TOOLS.map((t) => ({
      ...t,
      endpoint: `/api/webmcp/execute?tool=${t.name}${activeSessionId ? `&session=${activeSessionId}` : ''}`,
    })),
  });
}
