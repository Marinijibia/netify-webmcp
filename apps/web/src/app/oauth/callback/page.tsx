'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/lib/theme/theme-context';
import { CheckCircle2, Copy, Key, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const { tokens, isLight } = useTheme();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  const [copied, setCopied] = React.useState(false);

  const curlExample = `curl -X POST https://app.netify.ng/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "${code || 'AUTHORIZATION_CODE'}",
    "client_id": "chatgpt-agent",
    "redirect_uri": "https://app.netify.ng/oauth/callback",
    "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  }'`;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: isLight ? '#F8FAFC' : '#00111E',
      color: tokens.textPrimary,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
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
              Authorization Request Cancelled
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
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <CheckCircle2 size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px', color: tokens.textPrimary }}>
                Agent Authorization Successful
              </h2>
              <p style={{ fontSize: '13px', color: tokens.textSecondary, margin: 0 }}>
                A short-lived, single-use authorization code has been issued and returned to the client callback.
              </p>
            </div>

            {/* Issued Code Box */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: `1px solid ${tokens.surfaceBorder}`,
              backgroundColor: isLight ? '#FFFFFF' : '#001524',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textSecondary, textTransform: 'uppercase' }}>
                  Authorization Code (Single-Use, 5m expiry)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (code) {
                      navigator.clipboard.writeText(code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#00A581',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  <Copy size={11} />
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <code style={{
                display: 'block',
                fontFamily: 'monospace',
                fontSize: '12px',
                wordBreak: 'break-all',
                color: '#10B981',
              }}>
                {code || 'No code received'}
              </code>
              {state && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: tokens.textSecondary }}>
                  State: <code style={{ color: tokens.textPrimary }}>{state}</code>
                </div>
              )}
            </div>

            {/* Token Exchange Snippet */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: tokens.textPrimary, display: 'block', marginBottom: '6px' }}>
                Exchange for Agent Access Token (POST /api/oauth/token)
              </span>
              <pre style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: isLight ? '#F1F5F9' : '#000F1A',
                border: `1px solid ${tokens.surfaceBorder}`,
                fontSize: '11px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                color: tokens.textSecondary,
                lineHeight: '1.5',
              }}>
                {curlExample}
              </pre>
            </div>

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
                View Connected Agents
              </Link>
              <Link
                href="/promises"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                Check Today's Promises
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
                  boxShadow: '0 4px 12px rgba(0, 165, 129, 0.3)',
                }}
              >
                WebMCP Inspector
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
