'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Database, UserCheck, Key, ArrowRight } from 'lucide-react';

export default function SecurityPage() {
  const securityPillars = [
    {
      icon: Database,
      title: 'Tenant Isolation Architecture',
      description: 'Every organization is strictly compartmentalized in our PostgreSQL database. Organization IDs are verified on every single database query through tenant-scoped middleware.',
    },
    {
      icon: Lock,
      title: 'Token Security & Cryptographic Sessions',
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
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 24px 80px', display: 'flex', flexDirection: 'column', gap: '56px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0, 165, 129, 0.15)', border: '1px solid #00A581', padding: '4px 14px', borderRadius: '20px', color: '#3AD0A9', fontSize: '12px', fontWeight: 'bold', marginBottom: '14px' }}>
          <ShieldCheck size={14} />
          <span>Security & Trust Center</span>
        </div>
        <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-1px' }}>
          Enterprise-Grade Security for African Small Businesses
        </h1>
        <p style={{ color: '#8FB7C7', fontSize: '16px', lineHeight: '1.6', marginTop: '12px', maxWidth: '680px', margin: '12px auto 0' }}>
          How we protect your financial ledgers, customer records, and AI agent interactions.
        </p>
      </div>

      {/* Security Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {securityPillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              style={{
                backgroundColor: '#003051',
                borderRadius: '14px',
                border: '1px solid #0F5470',
                padding: '28px',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(0, 165, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581', marginBottom: '16px' }}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
                {p.title}
              </h3>
              <p style={{ color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.6' }}>
                {p.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Compliance & WebMCP Safe Execution */}
      <div style={{
        backgroundColor: '#001D31',
        borderRadius: '16px',
        border: '1px solid #0F5470',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        lineHeight: '1.7',
        color: '#DCEAF0',
        fontSize: '14px',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
          Safe WebMCP Agent Execution
        </h2>
        <p>
          In browser environments using WebMCP, security is enforced at the browser boundary. AI tools running under <code style={{ color: '#3AD0A9' }}>document.modelContext</code> cannot access server infrastructure or bypass user sessions. They operate strictly through our authenticated client API using the user's active session.
        </p>
        <p>
          If you have questions regarding our security protocols or vulnerability disclosures, please contact our security team at <code style={{ color: '#00A581' }}>security@netify.africa</code>.
        </p>
      </div>
    </div>
  );
}
