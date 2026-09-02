import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTool = searchParams.get('tool') || 'get_collection_priority';
  const tool = normalizeToolName(rawTool);

  try {
    const token = await getDemoToken();

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

      return NextResponse.json({
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

      return NextResponse.json({
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
          route: `/customers/${c.id}`,
        })),
      });
    }

    // 3. list_receivables
    if (tool === 'list_receivables') {
      const isOverdue = searchParams.get('isOverdue');
      const queryParams = new URLSearchParams();
      if (isOverdue !== null) queryParams.set('isOverdue', isOverdue);

      const apiRes = await fetch(`${API_BASE_URL}/receivables?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      const receivables = result?.data || [];

      return NextResponse.json({
        success: true,
        tool: 'list_receivables',
        count: receivables.length,
        receivables,
      });
    }

    // 4. get_customer_evidence
    if (tool === 'get_customer_evidence') {
      const customerId = searchParams.get('customerId') || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const [custRes, recsRes, commsRes, memoriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/receivables?customerId=${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/commitments?customerId=${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/business-memory/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [cust, recs, comms, memories] = await Promise.all([
        custRes.json(),
        recsRes.json(),
        commsRes.json(),
        memoriesRes.json(),
      ]);

      return NextResponse.json({
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
      return NextResponse.json({
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
      return NextResponse.json({
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
      return NextResponse.json({
        success: true,
        tool: 'list_notifications',
        data: result?.data,
      });
    }

    // 8. query_business_memory
    if (tool === 'query_business_memory') {
      const customerId = searchParams.get('customerId') || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const apiRes = await fetch(`${API_BASE_URL}/business-memory/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return NextResponse.json({
        success: true,
        tool: 'query_business_memory',
        memories: result?.data,
      });
    }

    // 9. draft_follow_up_message (supports GET quick preview)
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
      return NextResponse.json({
        success: true,
        tool: 'draft_follow_up_message',
        proposal: result?.data,
      });
    }

    return NextResponse.json({
      success: false,
      error: `Tool "${tool}" requires POST or is not supported in quick GET format. Available tools: get_collection_priority, search_customers, list_receivables, get_customer_evidence, get_customer_risk_profile, get_daily_briefing, list_notifications, query_business_memory, draft_follow_up_message`,
    }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'WebMCP execution failed',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTool = body.tool || 'get_collection_priority';
    const tool = normalizeToolName(rawTool);
    const input = body.input || {};

    const token = await getDemoToken();

    // 1. get_collection_priority
    if (tool === 'get_collection_priority') {
      const limit = Number(input.limit) || 5;
      const apiRes = await fetch(`${API_BASE_URL}/command-center/priorities?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return NextResponse.json({ success: true, tool, data: result?.data });
    }

    // 2. draft_follow_up_message
    if (tool === 'draft_follow_up_message') {
      const customerId = input.customerId || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const apiRes = await fetch(`${API_BASE_URL}/ai/draft-message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          channel: input.channel || 'WHATSAPP',
          tone: input.tone || 'RESPECTFUL_REMINDER',
        }),
      });
      const result = await apiRes.json();
      return NextResponse.json({ success: true, tool, proposal: result?.data });
    }

    // 3. create_payment_commitment
    if (tool === 'create_payment_commitment') {
      const customerId = input.customerId || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const apiRes = await fetch(`${API_BASE_URL}/commitments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          amount: Number(input.amount) || 100000,
          currency: input.currency || 'NGN',
          promisedFor: input.promisedFor || new Date(Date.now() + 3 * 86400000).toISOString(),
          notes: input.notes || 'Payment commitment recorded via WebMCP autonomous agent.',
        }),
      });
      const result = await apiRes.json();
      return NextResponse.json({ success: true, tool, commitment: result?.data });
    }

    // 4. record_collection_activity
    if (tool === 'record_collection_activity') {
      const customerId = input.customerId || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const apiRes = await fetch(`${API_BASE_URL}/collection-activities`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          type: input.type || 'PAYMENT_REMINDER',
          channel: input.channel || 'WHATSAPP',
          outcome: input.outcome || 'PROMISED_PAYMENT',
          notes: input.notes || 'Collection follow-up logged via WebMCP agent.',
        }),
      });
      const result = await apiRes.json();
      return NextResponse.json({ success: true, tool, activity: result?.data });
    }

    // 5. mark_notification_read
    if (tool === 'mark_notification_read') {
      const notificationId = input.notificationId;
      if (!notificationId) {
        return NextResponse.json({ success: false, error: 'notificationId is required' }, { status: 400 });
      }
      const apiRes = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return NextResponse.json({ success: true, tool, result: result?.data });
    }

    return NextResponse.json({ success: true, tool, message: `Tool "${tool}" executed successfully via WebMCP Gateway.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
