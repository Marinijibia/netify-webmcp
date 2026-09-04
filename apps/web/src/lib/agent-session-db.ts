const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.app.netify.ng/api/v1';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getBackendToken(): Promise<string> {
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

/**
 * Persists an authorized agent session directly to the Cloud SQL database via the backend API.
 * This guarantees that ANY container instance across Google Cloud Run recognizes the authorization.
 */
export async function persistAgentSessionToDb(sessionId: string, sessionToken: string): Promise<boolean> {
  try {
    const backendToken = await getBackendToken();
    const res = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({
        name: `agent-session:${sessionId}`,
        type: 'OTHER',
        fileKey: sessionId,
        fileUrl: sessionToken,
        mimeType: 'application/json',
        fileSize: sessionToken.length || 100,
      }),
      cache: 'no-store',
    });
    return res.ok;
  } catch (err: any) {
    console.error('Failed to persist agent session to Cloud SQL:', err?.message);
    return false;
  }
}

/**
 * Queries the Cloud SQL database for an active authorized agent session.
 * 
 * 1. If sessionId is specified, looks for that exact session (valid for 24 hours).
 * 2. If sessionId is NOT specified (e.g. ChatGPT browsed to /agent with no query params),
 *    checks if any session was authorized within the last 30 minutes.
 */
export async function getAuthorizedSessionFromDb(sessionId?: string): Promise<{
  authorized: boolean;
  token?: string;
  sessionId?: string;
}> {
  try {
    const backendToken = await getBackendToken();
    const res = await fetch(`${API_BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${backendToken}` },
      cache: 'no-store',
    });

    if (!res.ok) return { authorized: false };

    const data = await res.json();
    const docs: any[] = data?.data || [];
    const sessionDocs = docs.filter(
      (d) => d.name && d.name.startsWith('agent-session:')
    );

    const now = Date.now();

    // 1. Exact sessionId match
    if (sessionId) {
      const match = sessionDocs.find(
        (d) => d.fileKey === sessionId || d.name === `agent-session:${sessionId}` || d.name.includes(sessionId)
      );
      if (match) {
        const ageMs = now - new Date(match.createdAt).getTime();
        // Valid for 24 hours
        if (ageMs < 24 * 60 * 60 * 1000) {
          return {
            authorized: true,
            token: match.fileUrl,
            sessionId: match.fileKey || sessionId,
          };
        }
      }
    }

    // 2. Fallback: If no sessionId provided, look for the most recent session authorized within 30 minutes
    if (!sessionId && sessionDocs.length > 0) {
      const sorted = [...sessionDocs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latest = sorted[0];
      const ageMs = now - new Date(latest.createdAt).getTime();
      if (ageMs < 30 * 60 * 1000) {
        return {
          authorized: true,
          token: latest.fileUrl,
          sessionId: latest.fileKey,
        };
      }
    }

    return { authorized: false };
  } catch (err: any) {
    console.error('Failed to query agent session from Cloud SQL:', err?.message);
    return { authorized: false };
  }
}
