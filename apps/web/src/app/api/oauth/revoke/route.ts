import { NextRequest } from 'next/server';
import { revokeGrant } from '@/lib/oauth/store';
import { handleCorsPreflight, jsonWithCors } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const grantId = body.grantId || body.grant_id || body.token;

    if (!grantId) {
      return jsonWithCors(
        { error: 'invalid_request', error_description: 'Missing grantId or token to revoke' },
        { status: 400 }
      );
    }

    const success = revokeGrant(grantId);
    return jsonWithCors({
      success,
      message: success ? 'Agent authorization revoked immediately' : 'Grant not found or already revoked',
      revokedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return jsonWithCors(
      { error: 'server_error', error_description: err?.message || 'Revocation failed' },
      { status: 500 }
    );
  }
}
