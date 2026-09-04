import { NextRequest } from 'next/server';
import { signAgentToken } from '@/lib/oauth/store';
import { handleCorsPreflight, jsonWithCors } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'read'; // 'read' | 'write'

    const scopes = mode === 'write'
      ? [
          'receivables:read',
          'customers:read',
          'payment_commitments:write',
          'collection_activity:write',
          'collection_messages:draft',
        ]
      : [
          'receivables:read',
          'customers:read',
          'customer_evidence:read',
          'customer_risk:read',
          'business_memory:read',
          'collection_messages:draft',
        ];

    const nowSec = Math.floor(Date.now() / 1000);
    const token = signAgentToken({
      sub: 'demo-user-umar',
      userName: 'Umar Abdullahi',
      userEmail: 'merchant@netify.ng',
      tenantId: 'demo-org-fuelos',
      tenantName: 'FuelOS',
      clientId: 'chatgpt-agent',
      clientName: 'ChatGPT Agent',
      scopes,
      grantId: 'grant-chatgpt-fuelos-001',
      iat: nowSec,
      exp: nowSec + 86400,
    });

    return jsonWithCors({
      success: true,
      token,
      mode,
      scopes,
      tenant: 'FuelOS',
      agent: 'ChatGPT Agent',
    });
  } catch (err: any) {
    return jsonWithCors(
      { error: 'server_error', error_description: err?.message || 'Failed to generate demo agent token' },
      { status: 500 }
    );
  }
}
