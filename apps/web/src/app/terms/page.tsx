'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme/theme-context';

export default function TermsPage() {
  const { tokens, isLight } = useTheme();

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: 'clamp(48px, 6vw, 80px) 16px 100px',
      color: tokens.textSecondary,
      lineHeight: '1.8',
      fontSize: '14.5px',
      position: 'relative',
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '750px',
        height: '350px',
        background: 'radial-gradient(circle at 50% 30%, rgba(0, 165, 129, 0.14), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', marginBottom: '36px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-1px' }}>Terms of Service</h1>
        <p style={{ color: tokens.textMuted, fontSize: '13.5px', marginTop: '6px' }}>Last updated: August 2026 • Netify Platform</p>
      </div>

      <div style={{
        backgroundColor: tokens.surface,
        padding: 'clamp(24px, 4vw, 48px)',
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: isLight ? tokens.shadowCard : '0 10px 40px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>1. Agreement to Terms</h2>
          <p>
            By accessing or using Netify, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application or its services.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>2. Business Operations & Collections</h2>
          <p>
            Netify provides software tools for credit tracking, receivables ledger management, and AI message drafting. You agree to use Netify solely for lawful commercial debt reconciliation and comply with all applicable regional debt collection regulations.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>3. Human Responsibility for Outbound Messages</h2>
          <p>
            While Netify AI drafts follow-up messages, you acknowledge that you are solely responsible for reviewing, approving, and dispatching any communications sent to your customers. Netify is not liable for customer disputes arising from messaging choices.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>4. Open-Source Licensing</h2>
          <p>
            The Netify web client codebase is open source and licensed under the permissive MIT License.
          </p>
        </section>
      </div>
    </div>
  );
}
