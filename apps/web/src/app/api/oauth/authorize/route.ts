import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  REGISTERED_CLIENTS,
  SUPPORTED_SCOPES,
  createAuthorizationCode,
  signAgentToken,
  authorizeAgentSession,
} from '@/lib/oauth/store';
import { handleCorsPreflight, jsonWithCors } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflight();
}

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
      sessionId,
      session,
    } = body;

    if (!clientId || !redirectUri || !codeChallenge) {
      return jsonWithCors(
        { error: 'invalid_request', error_description: 'Missing clientId, redirectUri, or codeChallenge' },
        { status: 400 }
      );
    }

    const client = REGISTERED_CLIENTS[clientId];
    if (!client && !clientId.includes('agent')) {
      return jsonWithCors(
        { error: 'unauthorized_client', error_description: `Unrecognized client_id: ${clientId}` },
        { status: 400 }
      );
    }

    // Validate redirect URI
    if (client && client.redirectUris && client.redirectUris.length > 0) {
      const isAllowed = client.redirectUris.some((uri) => uri.toLowerCase() === redirectUri.toLowerCase());
      if (!isAllowed) {
        return jsonWithCors(
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

    const targetSessionId = sessionId || session;
    let sessionToken: string | undefined;

    if (targetSessionId) {
      const now = Math.floor(Date.now() / 1000);
      const expiresDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const grantId = `grant_${crypto.randomUUID()}`;

      sessionToken = signAgentToken({
        sub: resolvedUserId,
        userName: resolvedUserId === 'demo-user-umar' ? 'Umar Abdullahi' : 'Merchant Admin',
        userEmail: 'merchant@netify.ng',
        tenantId: resolvedTenantId,
        tenantName: resolvedTenantId === 'demo-org-fuelos' ? 'FuelOS' : 'Active Workspace',
        clientId,
        clientName: client?.name || 'ChatGPT Agent',
        scopes: validScopes,
        grantId,
        iat: now,
        exp: Math.floor(expiresDate.getTime() / 1000),
      });

      authorizeAgentSession(targetSessionId, {
        tenantId: resolvedTenantId,
        tenantName: resolvedTenantId === 'demo-org-fuelos' ? 'FuelOS' : 'Active Workspace',
        userId: resolvedUserId,
        userName: resolvedUserId === 'demo-user-umar' ? 'Umar Abdullahi' : 'Merchant Admin',
        userEmail: 'merchant@netify.ng',
        scopes: validScopes,
        token: sessionToken,
        grantId,
      });
    }

    return jsonWithCors({
      success: true,
      code,
      sessionId: targetSessionId || undefined,
      sessionToken: sessionToken || undefined,
      redirectUri,
      expiresIn: 300, // 5 minutes
    });
  } catch (err: any) {
    return jsonWithCors(
      { error: 'server_error', error_description: err?.message || 'Failed to issue authorization code' },
      { status: 500 }
    );
  }
}
