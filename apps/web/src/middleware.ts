import { NextRequest, NextResponse } from 'next/server';

// Known AI agent and autonomous browser user-agent tokens
const AI_AGENT_SIGNATURES = [
  'chatgpt-user',
  'gptbot',
  'claudebot',
  'claude-web',
  'perplexitybot',
  'google-extended',
  'applebot-extended',
  'anthropic-ai',
  'cohere-ai',
  'bytespider',
  'diffbot',
  'headlesschrome',
  'python-requests',
  'aiohttp',
];

const OAUTH_CHALLENGE_URL =
  'https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&response_type=code&redirect_uri=https://app.netify.ng/oauth/callback&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Always allow Next.js static assets and internal resources
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Always allow OAuth consent screen, callbacks, auth APIs, and discovery endpoints
  if (
    pathname.startsWith('/oauth') ||
    pathname.startsWith('/api/oauth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/.well-known') ||
    pathname === '/api/webmcp'
  ) {
    return NextResponse.next();
  }

  // 3. Detect AI agent or autonomous crawler
  const userAgent = (req.headers.get('user-agent') || '').toLowerCase();
  const isAIBot = AI_AGENT_SIGNATURES.some((sig) => userAgent.includes(sig));
  const isAgentQuery =
    searchParams.get('agent') === 'true' ||
    searchParams.get('simulate_agent') === 'true' ||
    searchParams.get('bot') === 'true';
  const isAgentHeader = req.headers.get('x-netify-agent') === 'true';

  const isExternalAgent = isAIBot || isAgentQuery || isAgentHeader;

  // 4. Check for Bearer token in headers or query params
  const authHeader = req.headers.get('authorization');
  const tokenQuery = searchParams.get('token');
  const hasToken = Boolean(authHeader?.startsWith('Bearer ') || tokenQuery);

  // 5. If this is an external AI agent attempting to access without a valid token:
  if (isExternalAgent && !hasToken) {
    const acceptHeader = req.headers.get('accept') || '';

    // If client requested JSON
    if (acceptHeader.includes('application/json') || pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'authorization_required',
          status: 401,
          message:
            'Access Denied: External AI agent requires delegated merchant authorization to view promises or workspace data.',
          authorization_url: OAUTH_CHALLENGE_URL,
          instructions:
            'Direct the user to the authorization_url to sign in and authorize this agent to access Netify workspace tools.',
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': `Bearer realm="Netify WebMCP", error="authorization_required", authorization_uri="${OAUTH_CHALLENGE_URL}"`,
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Return HTML challenge formatted for AI in-app browsers and human viewing
    const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>401 Unauthorized — Agent Authorization Required | Netify</title>
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="WWW-Authenticate" content="Bearer realm='Netify WebMCP', error='authorization_required', authorization_uri='${OAUTH_CHALLENGE_URL}'">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #00111E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box;">
  <div style="max-width: 580px; width: 100%; background-color: #00192B; border: 2px solid #EF4444; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <div style="width: 44px; height: 44px; border-radius: 10px; background-color: rgba(239, 68, 68, 0.2); color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 22px;">
        🛑
      </div>
      <div>
        <h2 style="margin: 0; font-size: 20px; color: #FFFFFF;">401 Unauthorized — Agent Authorization Required</h2>
        <span style="font-size: 12px; color: #94A3B8;">Netify African SME Trade Credit Ledger • WebMCP RFC 7636 Guard</span>
      </div>
    </div>

    <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
      <strong>Access Denied:</strong> External AI agents (including ChatGPT Agent, Claude, Gemini, and autonomous browser agents) cannot inspect trade receivables, customer credit ledgers, or payment commitments without explicit merchant authorization.
    </p>

    <div style="background-color: rgba(0, 165, 129, 0.1); border: 1px solid #00A581; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 14px; font-size: 14px; font-weight: 600; color: #3AD0A9;">
        To view promises, debtors, or receivables, the user must authorize this agent:
      </p>
      <a href="${OAUTH_CHALLENGE_URL}"
         style="display: inline-block; background-color: #00A581; color: #FFFFFF; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14.5px; box-shadow: 0 4px 14px rgba(0, 165, 129, 0.4);">
        👉 Click Here to Authorize Netify Access
      </a>
      <p style="margin: 12px 0 0; font-size: 12px; color: #94A3B8;">
        (If not logged in, you will sign in first, then approve requested permissions)
      </p>
    </div>

    <div style="background-color: #00111E; border: 1px solid #1E293B; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #94A3B8; line-height: 1.5;">
      <strong>Instruction for AI Agent:</strong> You do not possess the required credentials or token to read Netify promises or debtor ledgers. Output a message to the user explaining that access was denied and provide the authorization link above so they can sign in and approve your access.
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(htmlResponse, {
      status: 401,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'WWW-Authenticate': `Bearer realm="Netify WebMCP", error="authorization_required", authorization_uri="${OAUTH_CHALLENGE_URL}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 6. Otherwise proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
