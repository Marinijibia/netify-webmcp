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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tool = searchParams.get('tool') || 'get_collection_priority';

  try {
    const token = await getDemoToken();

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

    if (tool === 'list_receivables') {
      const apiRes = await fetch(`${API_BASE_URL}/receivables`, {
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

    if (tool === 'get_customer_evidence') {
      const customerId = searchParams.get('customerId') || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const [custRes, recsRes, commsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/receivables?customerId=${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/commitments?customerId=${customerId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [cust, recs, comms] = await Promise.all([custRes.json(), recsRes.json(), commsRes.json()]);

      return NextResponse.json({
        success: true,
        tool: 'get_customer_evidence',
        customer: cust?.data,
        receivables: recs?.data,
        commitments: comms?.data,
      });
    }

    return NextResponse.json({
      success: false,
      error: `Tool "${tool}" requires POST or is not supported in quick GET format. Available GET tools: get_collection_priority, search_customers, list_receivables, get_customer_evidence`,
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
    const tool = body.tool || 'get_collection_priority';
    const input = body.input || {};

    const token = await getDemoToken();

    if (tool === 'get_collection_priority') {
      const limit = Number(input.limit) || 5;
      const apiRes = await fetch(`${API_BASE_URL}/command-center/priorities?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await apiRes.json();
      return NextResponse.json({ success: true, tool, data: result?.data });
    }

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

    return NextResponse.json({ success: true, tool, message: 'Executed' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
