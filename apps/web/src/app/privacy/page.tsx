'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme/theme-context';

export default function PrivacyPage() {
  const { tokens, isLight } = useTheme();

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '80px 24px 100px',
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

      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: '38px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-1px' }}>Privacy Policy</h1>
        <p style={{ color: tokens.textMuted, fontSize: '13.5px', marginTop: '6px' }}>Last updated: August 2026 • Netify Platform</p>
      </div>

      <div style={{
        backgroundColor: tokens.surface,
        padding: '48px 40px',
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        boxShadow: isLight ? tokens.shadowCard : '0 10px 40px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>1. Introduction</h2>
          <p>
            Netify ("we", "our", or "us") is committed to protecting the privacy of our merchants, business owners, and their customer debtor records. This Privacy Policy describes our practices regarding the collection, storage, and protection of financial and personal data.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>2. Information We Collect</h2>
          <p>
            We collect account details (merchant name, email, organization name), trade receivables data (invoice amounts, payment terms, customer phone numbers, payment records), and communication logs. We do not sell, monetize, or broker customer contact information or trade debt balances.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>3. How AI & WebMCP Processes Data</h2>
          <p>
            When you invoke the AI Copilot or WebMCP agent tools, customer debt details are processed strictly to calculate risk levels, summarize commitment history, and draft reminder text. We never use your proprietary debt ledgers to train public foundation models.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>4. Data Security & Multi-Tenant Retention</h2>
          <p>
            All data is encrypted in transit using TLS 1.3 and at rest in tenant-isolated databases. You may request complete deletion or export of your organization data at any time by contacting <code style={{ color: '#00A581' }}>privacy@netify.ng</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
