import { NextRequest, NextResponse } from 'next/server';
import {
  REGISTERED_CLIENTS,
  SUPPORTED_SCOPES,
  createAuthorizationCode,
} from '@/lib/oauth/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      userId,
      tenantId,
      redirectUri,
      scopes,
      duration = '24 hours',
      codeChallenge,
      codeChallengeMethod = 'S256',
    } = body;

    if (!clientId || !redirectUri || !codeChallenge) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing clientId, redirectUri, or codeChallenge' },
        { status: 400 }
      );
    }

    const client = REGISTERED_CLIENTS[clientId];
    if (!client && !clientId.includes('agent')) {
      return NextResponse.json(
        { error: 'unauthorized_client', error_description: `Unrecognized client_id: ${clientId}` },
        { status: 400 }
      );
    }

    // Validate redirect URI
    if (client && client.redirectUris && client.redirectUris.length > 0) {
      const isAllowed = client.redirectUris.some((uri) => uri.toLowerCase() === redirectUri.toLowerCase());
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Redirect URI mismatch with registered client' },
          { status: 400 }
        );
      }
    }

    // Filter valid scopes
    const validScopes: string[] = (Array.isArray(scopes) ? scopes : [])
      .filter((s: string) => SUPPORTED_SCOPES[s] !== undefined);

    if (validScopes.length === 0) {
      validScopes.push('receivables:read', 'customers:read', 'business_memory:read', 'collection_messages:draft');
    }

    const resolvedUserId = userId || 'demo-user-umar';
    const resolvedTenantId = tenantId || 'demo-org-fuelos';

    const code = createAuthorizationCode({
      clientId,
      userId: resolvedUserId,
      tenantId: resolvedTenantId,
      redirectUri,
      scopes: validScopes,
      durationLabel: duration,
      codeChallenge,
      codeChallengeMethod: codeChallengeMethod === 'plain' ? 'plain' : 'S256',
    });

    return NextResponse.json({
      success: true,
      code,
      redirectUri,
      expiresIn: 300, // 5 minutes
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: err?.message || 'Failed to issue authorization code' },
      { status: 500 }
    );
  }
}
