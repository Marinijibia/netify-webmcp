export interface LivePromiseItem {
  id: string;
  customerName: string;
  customerId: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  promisedFor: string;
  status: string;
  notes: string;
  contactPerson: string;
  invoiceReference: string;
}

export interface LiveMissedCommitmentItem {
  id: string;
  customerName: string;
  customerId: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  promisedFor: string;
  daysOverdue: number;
  notes: string;
  status: string;
}

export interface LivePriorityDebtorItem {
  customerName: string;
  customerId: string;
  outstandingBalance: number;
  formattedBalance: string;
  currency: string;
  overdueDays: number;
  priorityScore: number;
  urgency: string;
  reasons: string[];
  contactPhone: string;
  recommendedAction: string;
}

export interface LiveWorkspaceData {
  success: boolean;
  status: string;
  agent: string;
  workspace: string;
  tenantId: string;
  currency: string;
  timestamp: string;
  summary: {
    totalPromisesToday: number;
    totalAmountPromisedToday: number;
    formattedPromisedToday: string;
    missedCommitmentsCount: number;
    highPriorityDebtorsCount: number;
  };
  promisesDueToday: LivePromiseItem[];
  missedCommitments: LiveMissedCommitmentItem[];
  urgentDebtorAccounts: LivePriorityDebtorItem[];
  briefing?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.app.netify.ng/api/v1';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getBackendToken(): Promise<string> {
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
    cache: 'no-store',
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

export function formatCurrency(amount: number | string, currency = 'NGN'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'KES' ? 'KSh ' : '₦';
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

export async function fetchLiveWorkspaceData(params: {
  agentName: string;
  workspaceName: string;
  tenantId: string;
}): Promise<LiveWorkspaceData> {
  let todayCommitments: any[] = [];
  let missedCommitments: any[] = [];
  let priorities: any[] = [];
  let briefing: any = null;

  try {
    const backendToken = await getBackendToken();
    const headers = { Authorization: `Bearer ${backendToken}` };

    const [todayRes, missedRes, prioritiesRes, briefingRes] = await Promise.all([
      fetch(`${API_BASE_URL}/commitments/today`, { headers, cache: 'no-store' }).catch(() => null),
      fetch(`${API_BASE_URL}/commitments/missed`, { headers, cache: 'no-store' }).catch(() => null),
      fetch(`${API_BASE_URL}/command-center/priorities?limit=10`, { headers, cache: 'no-store' }).catch(() => null),
      fetch(`${API_BASE_URL}/command-center/briefing`, { headers, cache: 'no-store' }).catch(() => null),
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
    console.error('Failed to query live Cloud SQL database via backend:', err?.message);
  }

  const totalAmountPromisedToday = todayCommitments.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  return {
    success: true,
    status: 'AUTHORIZED',
    agent: params.agentName,
    workspace: params.workspaceName,
    tenantId: params.tenantId,
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
      currency: c.currency || 'NGN',
      promisedFor: c.promisedFor,
      status: c.status,
      notes: c.notes || 'Promise recorded on receivable ' + (c.receivable?.reference || ''),
      contactPerson: c.customer?.phone || c.customer?.email || 'N/A',
      invoiceReference: c.receivable?.reference || 'N/A',
    })),
    missedCommitments: missedCommitments.slice(0, 10).map((c: any) => ({
      id: c.id,
      customerName: c.customer?.name || 'Customer',
      customerId: c.customerId,
      amount: Number(c.amount),
      formattedAmount: formatCurrency(c.amount, c.currency),
      currency: c.currency || 'NGN',
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
      currency: p.currency || 'NGN',
      overdueDays: p.oldestOverdueDays,
      priorityScore: p.priorityScore,
      urgency: p.urgency,
      reasons: p.reasons || [],
      contactPhone: p.phone,
      recommendedAction: `Dispatch respectful reminder for ${formatCurrency(p.totalOutstanding, p.currency)}`,
    })),
    briefing,
  };
}
