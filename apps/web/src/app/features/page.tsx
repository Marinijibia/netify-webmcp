'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Clock, 
  FileText, 
  MessageSquareQuote, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function FeaturesPage() {
  const features = [
    {
      icon: Layers,
      title: 'Command Center & Real-Time Financial Attention',
      description: 'Instant overview of total debt exposure, aging buckets, broken commitments, and promises due today. Powered by a daily executive AI briefing grounded in your actual ledger.',
      badge: 'Core Workspace',
      route: '/',
    },
    {
      icon: FileText,
      title: 'Receivables Ledger & Credit Sales Aging',
      description: 'Issue formal invoices or log direct credit sales with 7, 14, 30, or 60-day terms. Filter by open, overdue, and partially paid balances with automated aging calculation.',
      badge: 'Invoicing & Ledgers',
      route: '/receivables',
    },
    {
      icon: Clock,
      title: 'WhatsApp & Call Commitment Tracking',
      description: 'Never lose track of verbal or chat promises again. When a buyer promises to pay by Friday, record the commitment date and amount. Netify automatically flags missed deadlines.',
      badge: 'Relational Credit',
      route: '/commitments',
    },
    {
      icon: Users,
      title: 'Customer Intelligence & 360 Timeline Evidence',
      description: 'A single indisputable source of truth for each buyer. Review their invoice history, payment ledger, promise fulfillment rate, and AI behavioral risk score.',
      badge: 'Business Memory',
      route: '/customers',
    },
    {
      icon: MessageSquareQuote,
      title: 'Culturally Grounded AI Action Proposals',
      description: 'AI drafts respectful, contextual payment reminders tailored for African trade etiquette. Choose your outreach channel (WhatsApp, SMS, Email, Phone) and tone (Courteous, Direct, Escalation, Partial Payment).',
      badge: 'Safe AI Proposals',
      route: '/messages/draft',
    },
    {
      icon: BrainCircuit,
      title: 'AI Copilot & Conversational Business Memory',
      description: 'Ask questions in plain English: "Who hasn’t paid their July flour delivery?" or "Summarize Musa’s payment history." The copilot references verified database facts with evidence citations.',
      badge: 'Agent Collaboration',
      route: '/chat',
    },
  ];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '60px 24px 80px', display: 'flex', flexDirection: 'column', gap: '64px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Platform Capabilities
        </span>
        <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#FFFFFF', marginTop: '8px', letterSpacing: '-1px' }}>
          Everything You Need to Collect Receivables and Protect Trust
        </h1>
        <p style={{ color: '#8FB7C7', fontSize: '16px', lineHeight: '1.6', marginTop: '12px' }}>
          Designed specifically for wholesale distributors, FMCG traders, and emerging market merchants managing informal credit.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              style={{
                backgroundColor: '#003051',
                borderRadius: '14px',
                border: '1px solid #0F5470',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(0, 165, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581' }}>
                    <Icon size={22} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#3AD0A9', backgroundColor: '#001D31', padding: '3px 8px', borderRadius: '4px', border: '1px solid #0F5470' }}>
                    {f.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '10px' }}>
                  {f.title}
                </h3>
                <p style={{ color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.6' }}>
                  {f.description}
                </p>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #0F5470' }}>
                <Link
                  href={f.route}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#00A581',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                  }}
                >
                  <span>Open in Workspace</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* How Netify Works (4 Steps) */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '20px',
        border: '1px solid #0F5470',
        padding: '48px 36px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Workflow Cycle
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '6px' }}>
            How Netify Streamlines Trade Debt
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#001D31', padding: '20px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#00A581', marginBottom: '8px' }}>01</div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '6px' }}>Credit Sale Recorded</h4>
            <p style={{ fontSize: '12.5px', color: '#8FB7C7', lineHeight: '1.5' }}>
              Issue an invoice or log goods dispatched on credit with 7/14/30-day payment terms.
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '20px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#00A581', marginBottom: '8px' }}>02</div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '6px' }}>Promise Scheduled</h4>
            <p style={{ fontSize: '12.5px', color: '#8FB7C7', lineHeight: '1.5' }}>
              When the buyer promises payment on WhatsApp, log the promised date and amount.
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '20px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#00A581', marginBottom: '8px' }}>03</div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '6px' }}>Intelligence Triggered</h4>
            <p style={{ fontSize: '12.5px', color: '#8FB7C7', lineHeight: '1.5' }}>
              If a promise is kept or missed, Netify updates risk scores and surfaces urgent accounts in the queue.
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '20px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#00A581', marginBottom: '8px' }}>04</div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '6px' }}>Safe Follow-up & Settlement</h4>
            <p style={{ fontSize: '12.5px', color: '#8FB7C7', lineHeight: '1.5' }}>
              AI drafts a respectful follow-up. You review and approve it. When payment arrives, log settlement.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <Link
          href="/"
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
          }}
        >
          <span>Try the Live Workspace Now</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
