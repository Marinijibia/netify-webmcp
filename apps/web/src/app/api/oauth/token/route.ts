import { NextRequest } from 'next/server';
import { exchangeAuthorizationCode } from '@/lib/oauth/store';
import { handleCorsPreflight, jsonWithCors } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function POST(req: NextRequest) {
  try {
    let grantType = '';
    let code = '';
    let clientId = '';
    let redirectUri = '';
    let codeVerifier = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      grantType = params.get('grant_type') || '';
      code = params.get('code') || '';
      clientId = params.get('client_id') || '';
      redirectUri = params.get('redirect_uri') || '';
      codeVerifier = params.get('code_verifier') || '';
    } else {
      const body = await req.json().catch(() => ({}));
      grantType = body.grant_type || '';
      code = body.code || '';
      clientId = body.client_id || '';
      redirectUri = body.redirect_uri || '';
      codeVerifier = body.code_verifier || '';
    }

    if (grantType !== 'authorization_code') {
      return jsonWithCors(
        { error: 'unsupported_grant_type', error_description: 'Only grant_type=authorization_code is supported' },
        { status: 400 }
      );
    }

    if (!code || !clientId || !redirectUri || !codeVerifier) {
      return jsonWithCors(
        { error: 'invalid_request', error_description: 'Missing code, client_id, redirect_uri, or code_verifier' },
        { status: 400 }
      );
    }

    const result = exchangeAuthorizationCode({
      code,
      clientId,
      redirectUri,
      codeVerifier,
    });

    if (!result.success || !result.token || !result.grant) {
      return jsonWithCors(
        { error: 'invalid_grant', error_description: result.error || 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const expiresInSec = Math.max(
      60,
      Math.floor((new Date(result.grant.expiresAt).getTime() - Date.now()) / 1000)
    );

    return jsonWithCors(
      {
        access_token: result.token,
        token_type: 'Bearer',
        expires_in: expiresInSec,
        scope: result.grant.scopes.join(' '),
        grant_id: result.grant.id,
        tenant: {
          id: result.grant.tenantId,
          name: result.grant.tenantName,
        },
        user: {
          id: result.grant.userId,
          name: result.grant.userName,
          email: result.grant.userEmail,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (err: any) {
    return jsonWithCors(
      { error: 'server_error', error_description: err?.message || 'Token exchange failed' },
      { status: 500 }
    );
  }
}
