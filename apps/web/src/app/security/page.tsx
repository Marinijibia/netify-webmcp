'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';
import { ShieldCheck, Lock, Database, UserCheck, Key, ArrowRight, Sparkles, Check } from 'lucide-react';

export default function SecurityPage() {
  const { isAuthenticated } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const securityPillars = [
    {
      icon: Database,
      title: 'Tenant Isolation Architecture',
      description: 'Every organization is strictly compartmentalized in our PostgreSQL database. Organization IDs are verified on every single database query through tenant-scoped middleware.',
    },
    {
      icon: Lock,
      title: 'Cryptographic Sessions & JWTs',
      description: 'Client authentication uses short-lived JWT access tokens paired with secure silent refresh tokens. Passwords and sensitive secrets are hashed using bcrypt with salt.',
    },
    {
      icon: UserCheck,
      title: 'Human-in-the-Loop AI Safeguards',
      description: 'AI agents and WebMCP tools cannot perform external collection dispatches autonomously. All reminder proposals require explicit, human-authorized approval in the UI.',
    },
    {
      icon: Key,
      title: 'Zero Public Model Training on Private Data',
      description: 'Your customer invoices, debtor balances, and promise logs are strictly your property. We never train or fine-tune public foundation models on private SME records.',
    },
  ];

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: 'clamp(48px, 6vw, 80px) 16px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(40px, 5vw, 72px)',
      position: 'relative',
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '850px',
        height: '450px',
        background: 'radial-gradient(circle at 50% 30%, rgba(0, 165, 129, 0.16), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 48, 81, 0.8)',
          border: `1px solid ${tokens.accentBorder}`,
          padding: '6px 18px',
          borderRadius: '30px',
          fontSize: '12.5px',
          fontWeight: 'bold',
          color: '#00A581',
          marginBottom: '20px',
          boxShadow: isLight ? tokens.shadowCard : '0 0 25px rgba(0, 165, 129, 0.25)',
        }}>
          <ShieldCheck size={14} color="#00A581" />
          <span>{t('security.title')}</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: '900',
          color: tokens.textPrimary,
          letterSpacing: '-1.5px',
          lineHeight: '1.15',
        }}>
          Protecting Your Private Ledger &{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00A581 0%, #3AD0A9 50%, #00A581 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Debtor Relationships
          </span>
        </h1>
        <p style={{ color: tokens.textSecondary, fontSize: '16px', lineHeight: '1.6', marginTop: '16px' }}>
          How Netify safeguards your financial ledgers, customer records, and AI agent interactions with bank-grade controls.
        </p>
      </div>

      {/* Security Pillars (4 Cards) */}
      <div className="responsive-grid-4" style={{
        position: 'relative',
        zIndex: 1,
      }}>
        {securityPillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              style={{
                backgroundColor: tokens.surface,
                borderRadius: '20px',
                border: `1px solid ${tokens.surfaceBorder}`,
                boxShadow: isLight ? tokens.shadowCard : 'none',
                padding: 'clamp(20px, 3.5vw, 32px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: tokens.accentSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00A581',
              }}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: tokens.textPrimary }}>
                {p.title}
              </h3>
              <p style={{ color: tokens.textSecondary, fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                {p.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* WebMCP Browser Boundary Security Model */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: 'clamp(24px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        lineHeight: '1.7',
        color: tokens.textSecondary,
        fontSize: '14.5px',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: tokens.textPrimary }}>
          Safe WebMCP Browser-Native Execution Boundary
        </h2>
        <p>
          In traditional AI setups, developers are forced to share sensitive API keys with third-party LLM cloud servers. This creates severe compliance risks for SME financial data.
        </p>
        <p>
          With WebMCP, security is enforced directly at the browser boundary. AI tools running under <code style={{ color: '#00A581' }}>document.modelContext</code> cannot access server credentials or bypass user authentication. They operate strictly through our authenticated client session, inheriting the permissions of the logged-in merchant.
        </p>
        <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: `1px solid ${tokens.surfaceBorder}`, fontSize: '13px', color: tokens.textMuted }}>
          Have security questions or responsible disclosures? Email our security team at <code style={{ color: '#00A581' }}>security@netify.ng</code>.
        </div>
      </div>

      {/* CTA */}
      <div style={{
        backgroundColor: isLight ? '#F1F5F9' : '#00253E',
        borderRadius: '24px',
        border: '2px solid #00A581',
        padding: 'clamp(28px, 6vw, 48px) clamp(20px, 5vw, 36px)',
        textAlign: 'center',
        boxShadow: isLight ? tokens.shadowCard : '0 10px 40px rgba(0, 165, 129, 0.2)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>
          Trade with Complete Confidence
        </h3>
        <p style={{ color: tokens.textSecondary, fontSize: '14px', marginBottom: '28px' }}>
          Experience an enterprise-grade collections workspace built specifically for African commerce.
        </p>
        <Link
          href={isAuthenticated ? "/workspace" : "/register"}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '14px 32px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 'bold',
            textDecoration: 'none',
            boxShadow: '0 8px 25px rgba(0, 165, 129, 0.4)',
          }}
        >
          <span>{isAuthenticated ? 'Open Collections Workspace' : 'Register Free Account'}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
