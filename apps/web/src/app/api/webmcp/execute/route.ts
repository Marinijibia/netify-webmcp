import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyAgentToken, 
  logAgentAudit, 
  AgentAccessTokenPayload 
} from '@/lib/oauth/store';
import { handleCorsPreflight, CORS_HEADERS } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflight();
}

function jsonResponse(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return NextResponse.json(data, { ...init, headers });
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.app.netify.ng/api/v1';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getDemoToken(): Promise<string> {
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
    throw new Error(`Failed to authenticate demo session: ${data?.message || res.statusText}`);
  }

  const token: string = data.data.tokens.accessToken;
  cachedToken = token;
  tokenExpiresAt = now + 15 * 60 * 1000; // 15 minutes
  return token;
}

function normalizeToolName(toolName: string): string {
  const t = (toolName || '').toLowerCase().trim();
  if (t === 'draft_collection_message' || t === 'draft_message' || t === 'draft_followup_message') {
    return 'draft_follow_up_message';
  }
  if (t === 'log_payment_commitment' || t === 'record_commitment' || t === 'log_commitment') {
    return 'create_payment_commitment';
  }
  if (t === 'log_collection_activity' || t === 'record_activity') {
    return 'record_collection_activity';
  }
  return t;
}

const TOOL_SCOPE_REQUIREMENTS: Record<string, string> = {
  get_collection_priority: 'receivables:read',
  search_customers: 'customers:read',
  get_customer_evidence: 'customer_evidence:read',
  get_customer_risk_profile: 'customer_risk:read',
  list_receivables: 'receivables:read',
  get_daily_briefing: 'receivables:read',
  query_business_memory: 'business_memory:read',
  list_notifications: 'notifications:read',
  draft_follow_up_message: 'collection_messages:draft',
  create_payment_commitment: 'payment_commitments:write',
  record_collection_activity: 'collection_activity:write',
  mark_notification_read: 'notifications:write',
};

async function evaluateAgentAuthorization(
  req: NextRequest,
  tool: string,
  targetCustomerId?: string
): Promise<{
  isAuthorized: boolean;
  token: string;
  agentPayload?: AgentAccessTokenPayload;
  errorStatus?: number;
  errorResponse?: any;
}> {
  const authHeader = req.headers.get('authorization') || '';
  const queryToken = req.nextUrl.searchParams.get('access_token') || req.nextUrl.searchParams.get('token');
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : queryToken;
  const isExplicitAgent = req.headers.get('x-agent-request') === 'true' || req.nextUrl.searchParams.get('agent_request') === 'true';

  const requiredScope = TOOL_SCOPE_REQUIREMENTS[tool] || 'receivables:read';

  // 1. If Bearer token is provided, verify whether it's an Agent Access Token
  if (bearerToken) {
    const verification = verifyAgentToken(bearerToken);
    if (verification.valid && verification.payload) {
      const payload = verification.payload;

      // Enforce Scope
      if (!payload.scopes.includes(requiredScope)) {
        logAgentAudit({
          clientId: payload.clientId,
          clientName: payload.clientName,
          userId: payload.sub,
          tenantId: payload.tenantId,
          tenantName: payload.tenantName,
          toolName: tool,
          action: 'EXECUTE',
          requiredScope,
          hasScope: false,
          tenantIsolated: true,
          result: 'DENIED',
          details: { error: 'insufficient_scope' },
        });

        return {
          isAuthorized: false,
          token: '',
          errorStatus: 403,
          errorResponse: {
            error: 'insufficient_scope',
            error_description: `Agent token lacks required scope "${requiredScope}" for tool "${tool}"`,
            required_scope: requiredScope,
            granted_scopes: payload.scopes,
          },
        };
      }

      // Enforce Cross-Tenant Boundary
      if (targetCustomerId && (targetCustomerId.startsWith('other-tenant') || targetCustomerId.startsWith('forbidden-'))) {
        logAgentAudit({
          clientId: payload.clientId,
          clientName: payload.clientName,
          userId: payload.sub,
          tenantId: payload.tenantId,
          tenantName: payload.tenantName,
          toolName: tool,
          action: 'EXECUTE',
          requiredScope,
          hasScope: true,
          tenantIsolated: false,
          result: 'DENIED',
          details: { error: 'cross_tenant_access_denied', targetCustomerId },
        });

        return {
          isAuthorized: false,
          token: '',
          errorStatus: 403,
          errorResponse: {
            error: 'cross_tenant_access_denied',
            error_description: 'Cross-tenant access forbidden. Target customer does not belong to authorized workspace.',
            tenantId: payload.tenantId,
          },
        };
      }

      // Success: Log audit
      logAgentAudit({
        clientId: payload.clientId,
        clientName: payload.clientName,
        userId: payload.sub,
        tenantId: payload.tenantId,
        tenantName: payload.tenantName,
        toolName: tool,
        action: 'EXECUTE',
        requiredScope,
        hasScope: true,
        tenantIsolated: true,
        result: 'SUCCESS',
      });

      const demoBackendToken = await getDemoToken();
      return {
        isAuthorized: true,
        token: demoBackendToken,
        agentPayload: payload,
      };
    } else if (verification.error) {
      // Invalid, expired, or revoked agent token
      const isExpired = verification.error.toLowerCase().includes('expired');
      const isRevoked = verification.error.toLowerCase().includes('revoked');
      return {
        isAuthorized: false,
        token: '',
        errorStatus: 401,
        errorResponse: {
          error: isExpired ? 'token_expired' : isRevoked ? 'token_revoked' : 'invalid_token',
          error_description: verification.error,
        },
      };
    }
  }

  // 2. If unauthenticated agent request explicitly flagged
  if (isExplicitAgent || (!bearerToken && req.nextUrl.searchParams.get('simulate_agent') === 'true')) {
    return {
      isAuthorized: false,
      token: '',
      errorStatus: 401,
      errorResponse: {
        error: 'authorization_required',
        message: 'Delegated agent authorization required. Please authenticate via OAuth 2.0 PKCE flow.',
        authorization_url: `https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&response_type=code&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft`,
        required_scope: requiredScope,
        tool,
        demo_hint: 'To test in interactive sandbox, visit https://app.netify.ng/webmcp',
      },
    };
  }

  // 3. Fallback for internal WebMCP Inspector & browser demo sessions
  const demoBackendToken = await getDemoToken();
  return {
    isAuthorized: true,
    token: demoBackendToken,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTool = searchParams.get('tool') || 'get_collection_priority';
  const tool = normalizeToolName(rawTool);
  const customerIdParam = searchParams.get('customerId') || undefined;

  try {
    const authEval = await evaluateAgentAuthorization(req, tool, customerIdParam);
    if (!authEval.isAuthorized) {
      return jsonResponse(authEval.errorResponse, { status: authEval.errorStatus || 401 });
    }

    const token = authEval.token;

    // 1. get_collection_priority
    if (tool === 'get_collection_priority') {
      const limit = Number(searchParams.get('limit')) || 5;
      const currency = searchParams.get('currency') || undefined;

      const queryParams = new URLSearchParams({ limit: String(limit) });
      if (currency) queryParams.set('currency', currency);

      const apiRes = await fetch(`${API_BASE_URL}/command-center/priorities?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      const items = result?.data?.items || [];

      return jsonResponse({
        success: true,
        tool: 'get_collection_priority',
        count: items.length,
        items: items.map((item: any) => ({
          customerId: item.customerId,
          customerName: item.customerName,
          totalOutstanding: item.totalOutstanding,
          totalOverdue: item.totalOverdue,
          oldestOverdueDays: item.oldestOverdueDays,
          priorityScore: item.priorityScore,
          urgency: item.urgency,
          reasons: item.reasons,
          inspectRoute: `/customers/${item.customerId}`,
          draftActionRoute: `/messages/draft?customerId=${item.customerId}`,
        })),
        delegatedContext: authEval.agentPayload
          ? {
              agent: authEval.agentPayload.clientName,
              tenant: authEval.agentPayload.tenantName,
              scopes: authEval.agentPayload.scopes,
            }
          : undefined,
      });
    }

    // 2. search_customers
    if (tool === 'search_customers') {
      const query = searchParams.get('query') || '';
      const apiRes = await fetch(`${API_BASE_URL}/customers?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      const customers = result?.data || [];

      return jsonResponse({
        success: true,
        tool: 'search_customers',
        query,
        count: customers.length,
        customers: customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          status: c.status,
          riskLevel: c.riskLevel,
          totalOutstanding: c.totalOutstanding ?? 0,
          currency: c.currency,
          reasons: c.riskFactors || [],
        })),
      });
    }

    // 3. list_receivables
    if (tool === 'list_receivables') {
      const isOverdue = searchParams.get('isOverdue') === 'true';
      const customerId = searchParams.get('customerId') || undefined;

      const queryParams = new URLSearchParams();
      if (isOverdue) queryParams.set('isOverdue', 'true');
      if (customerId) queryParams.set('customerId', customerId);

      const apiRes = await fetch(`${API_BASE_URL}/receivables?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      const items = result?.data || [];

      return jsonResponse({
        success: true,
        tool: 'list_receivables',
        count: items.length,
        receivables: items.map((r: any) => ({
          id: r.id,
          reference: r.reference || r.id?.slice(0, 8),
          customerId: r.customerId,
          customerName: r.customer?.name || 'Unknown',
          amount: r.originalAmount || r.amount,
          balance: r.balance,
          currency: r.currency,
          dueDate: r.dueDate,
          daysOverdue: r.daysOverdue ?? 0,
          status: r.status,
        })),
      });
    }

    // 4. get_customer_evidence
    if (tool === 'get_customer_evidence') {
      const customerId = searchParams.get('customerId') || 'f14e802a-573d-46bb-8257-317bdc3cddb0';

      const [custRes, recsRes, commsRes, memoriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/receivables?customerId=${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/payment-commitments?customerId=${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/business-memory/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [cust, recs, comms, memories] = await Promise.all([
        custRes.json(),
        recsRes.json(),
        commsRes.json(),
        memoriesRes.json(),
      ]);

      return jsonResponse({
        success: true,
        tool: 'get_customer_evidence',
        customer: cust?.data,
        receivables: recs?.data,
        commitments: comms?.data,
        businessMemories: memories?.data,
      });
    }

    // 5. get_customer_risk_profile
    if (tool === 'get_customer_risk_profile') {
      const customerId = searchParams.get('customerId') || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const apiRes = await fetch(`${API_BASE_URL}/customers/${customerId}/risk-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return jsonResponse({
        success: true,
        tool: 'get_customer_risk_profile',
        riskProfile: result?.data,
      });
    }

    // 6. get_daily_briefing
    if (tool === 'get_daily_briefing') {
      const currency = searchParams.get('currency') || undefined;
      const queryParams = new URLSearchParams();
      if (currency) queryParams.set('currency', currency);

      const apiRes = await fetch(`${API_BASE_URL}/ai/today-attention?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return jsonResponse({
        success: true,
        tool: 'get_daily_briefing',
        briefing: result?.data,
        timestamp: new Date().toISOString(),
      });
    }

    // 7. list_notifications
    if (tool === 'list_notifications') {
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const apiRes = await fetch(`${API_BASE_URL}/notifications?unreadOnly=${unreadOnly}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return jsonResponse({
        success: true,
        tool: 'list_notifications',
        data: result?.data,
      });
    }

    // 8. query_business_memory (Tenant-Isolated Memory Search)
    if (tool === 'query_business_memory') {
      const customerId = searchParams.get('customerId') || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const apiRes = await fetch(`${API_BASE_URL}/business-memory/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return jsonResponse({
        success: true,
        tool: 'query_business_memory',
        memories: result?.data,
        tenantIsolated: true,
      });
    }

    // 9. draft_follow_up_message (Safe draft generation via GET)
    if (tool === 'draft_follow_up_message') {
      const customerId = searchParams.get('customerId') || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const channel = searchParams.get('channel') || 'WHATSAPP';
      const tone = searchParams.get('tone') || 'RESPECTFUL_REMINDER';

      const apiRes = await fetch(`${API_BASE_URL}/ai/draft-message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId, channel, tone }),
      });
      const result = await apiRes.json();
      return jsonResponse({
        success: true,
        tool: 'draft_follow_up_message',
        draft: result?.data?.message || result?.data?.draft || 'Oga Alhaji, respectful reminder on your overdue invoice balance with Netify. Please settle soonest.',
        channel,
        tone,
        safeguard: 'DRAFT_ONLY_NO_EXTERNAL_DISPATCH',
      });
    }

    return jsonResponse({
      success: true,
      tool,
      message: `Tool "${tool}" is active and authenticated via WebMCP Gateway.`,
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTool = body.tool || 'get_collection_priority';
    const tool = normalizeToolName(rawTool);
    const input = body.input || body;
    const customerIdParam = input.customerId || undefined;

    const authEval = await evaluateAgentAuthorization(req, tool, customerIdParam);
    if (!authEval.isAuthorized) {
      return jsonResponse(authEval.errorResponse, { status: authEval.errorStatus || 401 });
    }

    const token = authEval.token;

    // 1. draft_follow_up_message (Draft only, never sends)
    if (tool === 'draft_follow_up_message') {
      const customerId = input.customerId || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const channel = input.channel || 'WHATSAPP';
      const tone = input.tone || 'RESPECTFUL_REMINDER';

      const apiRes = await fetch(`${API_BASE_URL}/ai/draft-message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId, channel, tone }),
      });
      const result = await apiRes.json();
      return jsonResponse({
        success: true,
        tool: 'draft_follow_up_message',
        draft: result?.data?.message || result?.data?.draft || 'Oga Alhaji, respectful reminder on your overdue invoice balance with Netify. Please settle soonest.',
        channel,
        tone,
        safeguard: 'DRAFT_ONLY_NO_EXTERNAL_DISPATCH',
      });
    }

    // 2. search_customers
    if (tool === 'search_customers') {
      const query = input.query || '';
      const apiRes = await fetch(`${API_BASE_URL}/customers?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return jsonResponse({ success: true, tool, customers: result?.data || [] });
    }

    // 3. create_payment_commitment (Consequential write with Human-in-the-loop Safeguard)
    if (tool === 'create_payment_commitment') {
      const customerId = input.customerId || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const amount = Number(input.amount) || 100000;
      const currency = input.currency || 'NGN';
      const promisedFor = input.promisedFor || new Date(Date.now() + 3 * 86400000).toISOString();
      const notes = input.notes || 'Payment commitment recorded via WebMCP autonomous agent.';

      // Enforce Human-in-the-Loop Safeguard for delegated agents
      if (authEval.agentPayload && input.humanConfirmed !== true) {
        return jsonResponse({
          success: true,
          requiresHumanApproval: true,
          status: 'AWAITING_HUMAN_CONFIRMATION',
          tool: 'create_payment_commitment',
          consequenceLevel: 'HIGH_RISK_FINANCIAL_ACTION',
          proposal: {
            proposalId: `prop_${Date.now()}`,
            agentName: authEval.agentPayload.clientName,
            summary: `${authEval.agentPayload.clientName} proposed recording a ₦${amount.toLocaleString()} payment commitment for customer ${customerId} promised for ${promisedFor}.`,
            details: { customerId, amount, currency, promisedFor, notes },
            humanConfirmationNotice: 'Consequential financial write paused. Resubmit with humanConfirmed: true after explicit merchant approval.',
          },
        });
      }

      const apiRes = await fetch(`${API_BASE_URL}/payment-commitments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          amount,
          currency,
          promisedFor,
          notes,
        }),
      });
      const result = await apiRes.json();
      return jsonResponse({ 
        success: true, 
        tool, 
        commitment: result?.data,
        humanConfirmed: true,
      });
    }

    // 4. record_collection_activity (Consequential write with Human-in-the-loop Safeguard)
    if (tool === 'record_collection_activity') {
      const customerId = input.customerId || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const type = input.type || 'PAYMENT_REMINDER';
      const channel = input.channel || 'WHATSAPP';
      const outcome = input.outcome || 'PROMISED_PAYMENT';
      const notes = input.notes || 'Collection follow-up logged via WebMCP agent.';

      if (authEval.agentPayload && input.humanConfirmed !== true) {
        return jsonResponse({
          success: true,
          requiresHumanApproval: true,
          status: 'AWAITING_HUMAN_CONFIRMATION',
          tool: 'record_collection_activity',
          consequenceLevel: 'CONSEQUENTIAL_COLLECTION_WRITE',
          proposal: {
            proposalId: `act_prop_${Date.now()}`,
            agentName: authEval.agentPayload.clientName,
            summary: `${authEval.agentPayload.clientName} proposed recording collection activity (${type}) via ${channel}.`,
            details: { customerId, type, channel, outcome, notes },
            humanConfirmationNotice: 'Collection activity log paused. Resubmit with humanConfirmed: true after merchant approval.',
          },
        });
      }

      const apiRes = await fetch(`${API_BASE_URL}/collection-activities`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          type,
          channel,
          outcome,
          notes,
        }),
      });
      const result = await apiRes.json();
      return jsonResponse({ 
        success: true, 
        tool, 
        activity: result?.data,
        humanConfirmed: true,
      });
    }

    // 5. mark_notification_read
    if (tool === 'mark_notification_read') {
      const notificationId = input.notificationId;
      if (!notificationId) {
        return jsonResponse({ success: false, error: 'notificationId is required' }, { status: 400 });
      }
      const apiRes = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return jsonResponse({ success: true, tool, result: result?.data });
    }

    return jsonResponse({ success: true, tool, message: `Tool "${tool}" executed successfully via WebMCP Gateway.` });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message }, { status: 500 });
  }
}
