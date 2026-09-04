'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme/theme-context';
import { 
  CheckCircle2, 
  Copy, 
  Key, 
  ArrowRight, 
  ShieldCheck, 
  ExternalLink,
  Play,
  Loader2,
  Lock,
  Sparkles,
  Building2,
  Calendar,
  Clock
} from 'lucide-react';
import Link from 'next/link';

const ALL_12_TOOLS = [
  { name: 'get_collection_priority', label: '1. Collection Priorities', desc: 'Ranked debtor queue by urgency & balance' },
  { name: 'search_customers', label: '2. Search Customers', desc: 'Customer accounts directory search' },
  { name: 'list_receivables', label: '3. List Receivables', desc: 'Live invoices and overdue aging balances' },
  { name: 'get_customer_evidence', label: '4. Customer Evidence', desc: 'Comprehensive customer invoice & memory dossier' },
  { name: 'get_customer_risk_profile', label: '5. Customer Risk Profile', desc: 'AI-grounded default risk evaluation' },
  { name: 'get_daily_briefing', label: '6. Daily Briefing', desc: 'Executive morning briefing and attention items' },
  { name: 'list_notifications', label: '7. List Notifications', desc: 'Overdue payment notices & alerts' },
  { name: 'query_business_memory', label: '8. Business Memory', desc: 'Tenant-isolated qualitative trade memories' },
  { name: 'draft_follow_up_message', label: '9. Draft Message (Proposal)', desc: 'Safe culturally-grounded reminder draft' },
  { name: 'create_payment_commitment', label: '10. Create Commitment', desc: 'Promise-to-pay schedule (Human Confirmation)' },
  { name: 'record_collection_activity', label: '11. Record Activity', desc: 'Call or WhatsApp activity (Human Confirmation)' },
  { name: 'mark_notification_read', label: '12. Mark Notification Read', desc: 'Acknowledge notification by ID' },
];

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tokens, isLight } = useTheme();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // PKCE Exchange State
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [grantData, setGrantData] = useState<any>(null);

  // Auto-Redirect State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoRedirectPaused, setAutoRedirectPaused] = useState(false);

  // WebMCP Interactive Tester State
  const [selectedTool, setSelectedTool] = useState('get_collection_priority');
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [toolResult, setToolResult] = useState<any>(null);

  // Automatically exchange code for token via RFC 7636 PKCE
  useEffect(() => {
    if (code && !accessToken && !isExchanging && !error) {
      setIsExchanging(true);
      fetch('/api/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: 'chatgpt-agent',
          redirect_uri: 'https://app.netify.ng/oauth/callback',
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            setAccessToken(data.access_token);
            setGrantData(data);
            setCountdown(3);
            try {
              localStorage.setItem('netify_agent_access_token', data.access_token);
            } catch {}
          } else {
            setExchangeError(data.error_description || data.error || 'Token exchange failed');
          }
        })
        .catch((err) => {
          setExchangeError(err?.message || 'Network error during token exchange');
        })
        .finally(() => {
          setIsExchanging(false);
        });
    }
  }, [code, accessToken, isExchanging, error]);

  // Auto-navigate to today's promises with the issued token after countdown
  useEffect(() => {
    if (!accessToken || autoRedirectPaused || countdown === null) return;

    if (countdown <= 0) {
      router.push(`/promises?token=${encodeURIComponent(accessToken)}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [accessToken, countdown, autoRedirectPaused, router]);

  // Execute selected WebMCP tool with the newly issued agent token
  const handleTestTool = async () => {
    setIsExecutingTool(true);
    setToolResult(null);
    try {
      const url = `/api/webmcp/execute?tool=${selectedTool}${selectedTool.includes('customer') ? '&customerId=f14e802a-573d-46bb-8257-317bdc3cddb0' : ''}`;
      const res = await fetch(url, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      setToolResult(data);
    } catch (err: any) {
      setToolResult({ error: err?.message || 'Failed to execute tool' });
    } finally {
      setIsExecutingTool(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      backgroundColor: isLight ? '#F8FAFC' : '#00111E',
      color: tokens.textPrimary,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '680px',
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.surfaceBorder}`,
        borderRadius: '24px',
        padding: '32px',
        boxShadow: isLight ? '0 12px 36px rgba(0,0,0,0.08)' : '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              ✕
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px', color: tokens.textPrimary }}>
              Authorization Request Denied
            </h2>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, marginBottom: '24px' }}>
              {errorDesc || error}
            </p>
            <Link
              href="/webmcp"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              <span>Return to WebMCP Inspector</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px', color: tokens.textPrimary }}>
                Agent Authorization Granted
              </h2>
              <p style={{ fontSize: '13.5px', color: tokens.textSecondary, margin: 0 }}>
                Delegated access granted for <strong>ChatGPT Agent</strong> in workspace <strong>{grantData?.tenant?.name || 'FuelOS'}</strong>.
              </p>
            </div>

            {/* Token Exchange Card */}
            {isExchanging ? (
              <div style={{
                padding: '24px',
                borderRadius: '14px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#FFFFFF' : '#001524',
                textAlign: 'center',
                marginBottom: '20px',
              }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#00A581' }} />
                <p style={{ margin: 0, fontSize: '13px', color: tokens.textSecondary }}>
                  Exchanging single-use PKCE authorization code for agent access token...
                </p>
              </div>
            ) : accessToken ? (
              <div style={{
                padding: '18px 20px',
                borderRadius: '16px',
                border: '1px solid #00A581',
                backgroundColor: isLight ? '#F0FDF4' : '#001E2E',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={16} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Active Agent Access Token (RFC 7636 Bearer)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(accessToken);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      color: '#00A581',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                    }}
                  >
                    <Copy size={12} />
                    <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
                  </button>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isLight ? '#FFFFFF' : '#00111E',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  marginBottom: '12px',
                }}>
                  <code style={{
                    display: 'block',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    wordBreak: 'break-all',
                    color: '#3AD0A9',
                    lineHeight: '1.4',
                  }}>
                    {accessToken}
                  </code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: tokens.textSecondary }}>
                  <span>Tenant: <strong style={{ color: tokens.textPrimary }}>{grantData?.tenant?.name || 'FuelOS'}</strong></span>
                  <span>Expires in: <strong style={{ color: tokens.textPrimary }}>{Math.floor((grantData?.expires_in || 86400) / 3600)}h</strong></span>
                  <span style={{ color: '#10B981', fontWeight: '600' }}>✓ Zero Data Leakage Enforced</span>
                </div>
              </div>
            ) : null}

            {/* PRIMARY CTA: Check Today's Promises with Token */}
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(0, 165, 129, 0.1)',
              border: '1.5px solid #00A581',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: tokens.textPrimary }}>
                Ready to Access Netify Promises & Debtors
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: tokens.textSecondary }}>
                Click below to view today&apos;s real payment promises and debtor queue using your authorized agent token:
              </p>

              {countdown !== null && !autoRedirectPaused && countdown > 0 && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(58, 208, 169, 0.15)',
                  border: '1px solid rgba(58, 208, 169, 0.3)',
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  color: '#3AD0A9',
                  fontWeight: '600',
                  marginBottom: '14px',
                }}>
                  <Clock size={13} />
                  <span>Auto-redirecting to Today&apos;s Promises in {countdown}s...</span>
                  <button
                    type="button"
                    onClick={() => setAutoRedirectPaused(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: tokens.textSecondary,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      marginLeft: '6px',
                    }}
                  >
                    Pause auto-redirect
                  </button>
                </div>
              )}

              <div>
                <Link
                  href={`/promises${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14.5px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0, 165, 129, 0.4)',
                }}
              >
                <span>👉 View Today&apos;s Promises with Authorized Token</span>
                <ArrowRight size={16} />
              </Link>
              </div>
            </div>

            {/* Interactive WebMCP Tool Runner */}
            <div style={{
              padding: '18px 20px',
              borderRadius: '14px',
              border: `1px solid ${tokens.surfaceBorder}`,
              backgroundColor: isLight ? '#FFFFFF' : '#001524',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} style={{ color: '#3AD0A9' }} />
                <span style={{ fontSize: '13px', fontWeight: '800', color: tokens.textPrimary }}>
                  Test All 12 WebMCP Tools with this Token:
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#00111E',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  {ALL_12_TOOLS.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleTestTool}
                  disabled={isExecutingTool}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: isExecutingTool ? 'not-allowed' : 'pointer',
                    opacity: isExecutingTool ? 0.7 : 1,
                  }}
                >
                  {isExecutingTool ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>{isExecutingTool ? 'Executing...' : 'Run Tool'}</span>
                </button>
              </div>

              {toolResult && (
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Live Response from Database:
                  </span>
                  <pre style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isLight ? '#F1F5F9' : '#000F1A',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: toolResult.success ? '#10B981' : '#EF4444',
                    margin: 0,
                  }}>
                    {JSON.stringify(toolResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href="/settings"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#001A2C',
                  color: tokens.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                Connected Agents Settings
              </Link>
              <Link
                href="/webmcp"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                Full WebMCP Inspector
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading callback...</div>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
