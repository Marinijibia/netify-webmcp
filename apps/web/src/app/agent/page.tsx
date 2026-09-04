import { verifyAgentToken, getAgentSession, createAgentSession, authorizeAgentSession } from '@/lib/oauth/store';
import { fetchLiveWorkspaceData, formatCurrency } from '@/lib/agent-live-data';
import AgentTesterWidget from './AgentTesterWidget';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    session?: string;
    s?: string;
    token?: string;
    format?: string;
  };
}

export default async function AgentGatewayPage({ searchParams }: PageProps) {
  const tokenParam = searchParams.token;
  const sessionParam = searchParams.session || searchParams.s;

  let isAuthorized = false;
  let agentName = 'ChatGPT Agent';
  let workspaceName = 'FuelOS (Wholesale & Distribution)';
  let tenantId = 'demo-org-fuelos';
  let activeSessionId = sessionParam || '';
  let activeToken = tokenParam || '';

  // 1. Check direct token (stateless verification across any container)
  if (tokenParam) {
    const val = verifyAgentToken(tokenParam);
    if (val.valid && val.payload) {
      isAuthorized = true;
      agentName = val.payload.clientName || 'ChatGPT Agent';
      workspaceName = val.payload.tenantName || 'FuelOS';
      tenantId = val.payload.tenantId || 'demo-org-fuelos';
      activeToken = tokenParam;

      // Also cache in local session store for subsequent requests on this container
      if (sessionParam) {
        authorizeAgentSession(sessionParam, {
          tenantId,
          tenantName: workspaceName,
          userId: val.payload.sub || 'demo-user-umar',
          userName: val.payload.userName || 'Umar Abdullahi',
          userEmail: val.payload.userEmail || 'merchant@netify.ng',
          scopes: val.payload.scopes || [],
          token: tokenParam,
          grantId: val.payload.grantId,
        });
      }
    }
  }

  // 2. Check session
  if (!isAuthorized && sessionParam) {
    const session = getAgentSession(sessionParam);
    if (session && session.status === 'AUTHORIZED') {
      isAuthorized = true;
      agentName = session.clientName || 'ChatGPT Agent';
      workspaceName = session.tenantName || 'FuelOS';
      tenantId = session.tenantId || 'demo-org-fuelos';
      activeSessionId = session.sessionId;
      activeToken = session.token || '';
    }
  }

  // CASE 1: NOT AUTHORIZED -> Deliver Agent Challenge Card with 1-click Link
  if (!isAuthorized) {
    const session = createAgentSession({ preferredId: sessionParam || undefined });
    const authUrl = `https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&session=${encodeURIComponent(session.sessionId)}&response_type=code&redirect_uri=https://app.netify.ng/agent%3Fsession%3D${encodeURIComponent(session.sessionId)}&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256`;

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#00111E',
        color: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          maxWidth: '680px',
          width: '100%',
          backgroundColor: '#00192B',
          border: '2px solid #00A581',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 165, 129, 0.2)',
              color: '#00A581',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              🔒
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#FFFFFF' }}>
                Netify Protected Agent Gateway
              </h1>
              <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>
                WebMCP RFC 7636 Delegated Access • Session ID: <code>{session.sessionId}</code>
              </span>
            </div>
          </div>

          <p style={{ color: '#CBD5E1', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '24px' }}>
            External AI agents (including ChatGPT Agent, Claude, and Gemini) cannot inspect customer ledgers, payment commitments, or overdue balances without explicit merchant authorization.
          </p>

          {/* Primary 1-Click Merchant Authorization Link */}
          <div style={{
            backgroundColor: 'rgba(0, 165, 129, 0.12)',
            border: '1.5px solid #00A581',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '26px',
          }}>
            <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700', color: '#3AD0A9' }}>
              To authorize this AI agent session to access FuelOS:
            </p>
            <a
              href={authUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '14px 28px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '15px',
                boxShadow: '0 6px 18px rgba(0, 165, 129, 0.4)',
              }}
            >
              👉 Click Here to Authorize Netify Access
            </a>
            <p style={{ margin: '14px 0 0', fontSize: '12px', color: '#94A3B8' }}>
              (Sign in as <strong>merchant@netify.ng / Password123!</strong>, then approve requested scopes)
            </p>
          </div>

          {/* Explicit Agent Guidance for ChatGPT / Claude Scrapers */}
          <div style={{
            backgroundColor: '#00111E',
            border: '2px solid #3AD0A9',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '24px',
            fontSize: '13px',
            lineHeight: '1.6',
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14.5px', color: '#3AD0A9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🤖 Mandatory Instructions for ChatGPT / Claude / AI Assistant:
            </h3>
            <p style={{ margin: '6px 0 10px', color: '#E2E8F0' }}>
              You are attempting to access protected trade receivables data for <strong>FuelOS</strong>. Netify security requires delegated merchant authorization.
            </p>
            <p style={{ margin: '6px 0 10px', fontWeight: 'bold', color: '#FCD34D' }}>
              ⚠️ DO NOT ask the user for a screenshot. Provide the user with the authorization link below in your chat reply so they can approve access:
            </p>
            <div style={{
              backgroundColor: '#002238',
              border: '1px solid #00A581',
              padding: '12px 14px',
              borderRadius: '8px',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#38BDF8',
              marginBottom: '12px',
            }}>
              {authUrl}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#94A3B8' }}>
              Tell the user: <em>&quot;Netify requires you to authorize me to access your FuelOS workspace. Please click the authorization link above to approve access. Once approved, tell me &apos;continue&apos; or &apos;check now&apos;, and I will reload <code>https://app.netify.ng/agent?session={session.sessionId}</code> and report today&apos;s promises for you.&quot;</em>
            </p>
          </div>

          {/* Quick Evaluator / Demo Pairing Link */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Need instant evaluation without signing in? </span>
            <a
              href={`/oauth/authorize?client_id=chatgpt-agent&session=${encodeURIComponent(session.sessionId)}`}
              style={{ color: '#38BDF8', fontSize: '12px', fontWeight: '700', textDecoration: 'underline' }}
            >
              Open Instant FuelOS Consent Screen
            </a>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: AUTHORIZED -> Query 100% LIVE Cloud SQL PostgreSQL Database!
  const liveData = await fetchLiveWorkspaceData({
    agentName,
    workspaceName,
    tenantId,
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#00111E',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '36px 20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '820px',
        margin: '0 auto',
        backgroundColor: '#00192B',
        border: '1.5px solid #00A581',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #0F3850',
          paddingBottom: '20px',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#FFFFFF' }}>
              📋 Netify Trade Ledger & Live Promises
            </h1>
            <div style={{ fontSize: '12.5px', color: '#3AD0A9', marginTop: '4px' }}>
              Live Workspace: <strong>{workspaceName}</strong> • Authorized Agent: <strong>{agentName}</strong>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            color: '#10B981',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            border: '1px solid rgba(16, 185, 129, 0.4)',
          }}>
            <span>✓ Authorized (Live Database Connected)</span>
          </div>
        </div>

        {/* Agent Ready Notification Banner */}
        <div style={{
          backgroundColor: 'rgba(0, 165, 129, 0.12)',
          border: '1.5px solid #00A581',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#3AD0A9' }}>
              ✓ ChatGPT Agent Session Active: <code>{activeSessionId || 'delegated-access'}</code>
            </div>
            <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '4px' }}>
              Your agent can now read today&apos;s promises and trade ledger records directly from the database.
              If ChatGPT is waiting in your chat tab, tell it: <em>&quot;Check today&apos;s promises&quot;</em>.
            </div>
          </div>
          {activeToken && (
            <div style={{
              fontSize: '11px',
              color: '#3AD0A9',
              backgroundColor: 'rgba(0, 165, 129, 0.2)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '700',
              fontFamily: 'monospace',
            }}>
              HMAC Verified
            </div>
          )}
        </div>

        {/* Live Executive KPI Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}>
          <div style={{ backgroundColor: '#002238', border: '1px solid #0F3850', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promises Due Today</span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', marginTop: '4px' }}>
              {liveData.promisesDueToday.length} Promises
            </div>
            <span style={{ fontSize: '13px', color: '#3AD0A9', fontWeight: '700' }}>
              {liveData.summary.formattedPromisedToday}
            </span>
          </div>

          <div style={{ backgroundColor: '#002238', border: '1px solid #0F3850', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Missed Promises</span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#EF4444', marginTop: '4px' }}>
              {liveData.missedCommitments.length} Missed
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Requires Escalation</span>
          </div>

          <div style={{ backgroundColor: '#002238', border: '1px solid #0F3850', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority Debtors</span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#F59E0B', marginTop: '4px' }}>
              {liveData.urgentDebtorAccounts.length} Overdue Accounts
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Ranked by Urgency Score</span>
          </div>
        </div>

        {/* Section 1: Promises Due Today (From live Cloud SQL PostgreSQL) */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '16px', color: '#3AD0A9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⭐ Commitments Due Today (Live Database Records)
          </h2>
          {liveData.promisesDueToday.length === 0 ? (
            <div style={{ backgroundColor: '#002238', border: '1px dashed #334155', borderRadius: '12px', padding: '18px', color: '#94A3B8', fontSize: '13.5px' }}>
              No new payment commitments are scheduled exclusively for today. See the <strong>{liveData.missedCommitments.length} missed commitments</strong> below requiring immediate follow-up.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {liveData.promisesDueToday.map((c) => (
                <div key={c.id} style={{ backgroundColor: '#002238', border: '1px solid #00A581', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>{c.customerName}</strong>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#10B981' }}>{c.formattedAmount}</span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#CBD5E1' }}>
                    <strong>Due:</strong> {new Date(c.promisedFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <strong>Contact:</strong> {c.contactPerson} • <strong>Invoice:</strong> {c.invoiceReference}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12.5px', color: '#94A3B8' }}>
                    <strong>Notes:</strong> {c.notes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Missed Commitments (From live Cloud SQL PostgreSQL) */}
        {liveData.missedCommitments.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '16px', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚠️ Missed Commitments Needing Follow-up
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {liveData.missedCommitments.slice(0, 5).map((c) => (
                <div key={c.id} style={{ backgroundColor: '#001524', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14.5px', color: '#FFFFFF' }}>{c.customerName}</strong>
                    <span style={{ color: '#EF4444', fontWeight: '800', fontSize: '14.5px' }}>{c.formattedAmount}</span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '12.5px', color: '#94A3B8' }}>
                    Promised for: {new Date(c.promisedFor).toLocaleDateString()} ({c.daysOverdue} days overdue)
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#F87171' }}>
                    Status: {c.notes || 'Payment commitment broken'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: High-Urgency Overdue Debtor Accounts (From live Cloud SQL PostgreSQL) */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '16px', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ High-Urgency Overdue Debtor Accounts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {liveData.urgentDebtorAccounts.map((p) => (
              <div key={p.customerId} style={{ backgroundColor: '#001524', border: '1px solid #1E3A52', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '14.5px', color: '#FFFFFF' }}>{p.customerName}</strong>
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                    {p.urgency} ({p.overdueDays}d overdue)
                  </span>
                </div>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#CBD5E1' }}>
                  Outstanding Balance: <strong style={{ color: '#FFFFFF' }}>{p.formattedBalance}</strong>
                  {p.contactPhone ? ` • Phone: ${p.contactPhone}` : ''}
                </p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#3AD0A9' }}>
                  Recommended Action: {p.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Interactive WebMCP Tester Widget (Human Evaluators & Live Querying) */}
        <AgentTesterWidget
          sessionId={activeSessionId || undefined}
          token={activeToken || undefined}
        />
      </div>
    </div>
  );
}
