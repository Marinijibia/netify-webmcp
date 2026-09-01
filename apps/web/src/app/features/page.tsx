'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
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
  Sparkles,
  Zap,
  Check,
  ChevronRight,
  Database,
  Cpu
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export default function FeaturesPage() {
  const { isAuthenticated } = useAuth();
  const { tokens, isLight } = useTheme();

  const features = [
    {
      icon: Layers,
      title: 'Command Center & Financial Attention',
      badge: 'Executive Intelligence',
      description: 'Real-time overview of total trade debt exposure, aging buckets, broken promises, and collections due today. Powered by a daily executive AI narrative grounded in live ledgers.',
      stats: 'Real-Time Exposure Matrix',
      route: '/workspace',
      highlights: [
        'Total outstanding exposure calculated across all active accounts',
        'Overdue aging buckets (0-14, 15-30, 31-60, 60+ days)',
        'Grounded daily executive briefing with recommended focus',
        'Direct 1-click drill-down to priority accounts',
      ],
    },
    {
      icon: FileText,
      title: 'Receivables Ledger & Credit Sales Aging',
      badge: 'Invoicing & Ledgers',
      description: 'Issue formal invoices or log direct credit dispatches with 7, 14, 30, or 60-day terms. Filter by open, overdue, and partially paid balances with automated aging calculation.',
      stats: 'Automated 30-Day Aging',
      route: '/receivables',
      highlights: [
        'Quick credit invoice generation with customer picker',
        'Partial payment recording with automated remaining balance',
        'Instant status badges: OPEN, OVERDUE, PARTIAL, PAID',
        'Exportable ledger history for auditing and reconciliation',
      ],
    },
    {
      icon: Clock,
      title: 'WhatsApp & Call Commitment Tracking',
      badge: 'Relational Credit',
      description: 'Never lose track of verbal or chat promises again. When a buyer promises to pay by Friday, log the commitment date and amount. Netify automatically flags missed deadlines.',
      stats: 'Default Rate Reduction',
      route: '/commitments',
      highlights: [
        'Log promises made over WhatsApp, phone call, or market visit',
        'Categorize by status: TODAY, UPCOMING, MISSED, FULFILLED',
        'Automatic risk score adjustment when promises are broken',
        '1-click trigger to draft culturally adapted follow-ups',
      ],
    },
    {
      icon: Users,
      title: 'Customer Intelligence & 360 Timeline Evidence',
      badge: 'Business Memory',
      description: 'A single indisputable source of truth for each buyer. Review their invoice history, payment ledger, promise fulfillment rate, and AI behavioral risk score.',
      stats: 'Complete Audit Trail',
      route: '/customers',
      highlights: [
        'Comprehensive 4-tab ledger: Invoices, Payments, Commitments, Timeline',
        'Behavioral risk scoring: HIGH, MEDIUM, LOW with factor explanation',
        'Unified customer notes with phone and WhatsApp contact info',
        'Searchable debtor directory with instant balance calculations',
      ],
    },
    {
      icon: MessageSquareQuote,
      title: 'Culturally Grounded AI Action Proposals',
      badge: 'Safe AI Proposals',
      description: 'AI drafts respectful, contextual payment reminders tailored for African trade etiquette. Choose your outreach channel (WhatsApp, SMS, Email, Phone) and tone (Courteous, Direct, Escalation, Partial Payment).',
      stats: '100% Human-Approved',
      route: '/messages/draft',
      highlights: [
        'Tone switcher: Courteous, Direct, Escalation, Partial Installment',
        'Channel formatting for WhatsApp, SMS, Email, and Phone scripts',
        'Grounded citations referencing actual overdue invoice numbers',
        'Human confirmation required before any outreach is logged',
      ],
    },
    {
      icon: BrainCircuit,
      title: 'AI Copilot & Conversational Memory',
      badge: 'Autonomous Assistant',
      description: 'Ask questions in plain English: "Who hasn’t paid their July flour delivery?" or "Summarize Musa’s payment history." The copilot references verified database facts with evidence citations.',
      stats: 'pgvector Semantic Search',
      route: '/chat',
      highlights: [
        'Grounded Q&A over all customer receivables and promises',
        'Clear distinction between verified facts and AI inferences',
        'Suggested action chips to execute instant follow-ups',
        'Natural language queries without complex SQL reports',
      ],
    },
  ];

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: 'clamp(48px, 6vw, 80px) 16px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(48px, 6vw, 80px)',
      position: 'relative',
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(circle at 50% 30%, rgba(0, 165, 129, 0.15), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 48, 81, 0.8)',
          border: `1px solid ${tokens.accentBorder}`,
          padding: '6px 16px',
          borderRadius: '30px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#00A581',
          marginBottom: '20px',
          boxShadow: isLight ? tokens.shadowCard : '0 0 20px rgba(0, 165, 129, 0.2)',
        }}>
          <Sparkles size={14} color="#00A581" />
          <span>Platform Capabilities • The Modern Collections Stack</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: '900',
          color: tokens.textPrimary,
          letterSpacing: '-1.5px',
          lineHeight: '1.15',
        }}>
          Everything You Need to Collect Receivables and{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00A581 0%, #3AD0A9 50%, #00A581 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Protect Trade Trust.
          </span>
        </h1>
        <p style={{ color: tokens.textSecondary, fontSize: '16px', lineHeight: '1.6', marginTop: '16px' }}>
          Designed specifically for wholesale distributors, FMCG traders, and emerging market merchants managing informal credit across Africa.
        </p>
      </div>

      {/* Feature Deep-Dive Grid (6 Cards) */}
      <div className="responsive-grid-3" style={{
        position: 'relative',
        zIndex: 1,
      }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              style={{
                backgroundColor: tokens.surface,
                borderRadius: '20px',
                border: `1px solid ${tokens.surfaceBorder}`,
                padding: 'clamp(24px, 4vw, 36px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isLight ? tokens.shadowCard : '0 10px 30px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                {/* Card Top Pill & Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#00A581',
                    backgroundColor: tokens.accentSoft,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${tokens.accentBorder}`,
                  }}>
                    {f.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>
                  {f.title}
                </h3>
                <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                  {f.description}
                </p>

                {/* Checklist of Capabilities */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '18px' }}>
                  {f.highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: tokens.textPrimary, lineHeight: '1.5' }}>
                      <Check size={14} color="#00A581" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Link */}
              <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: `1px solid ${tokens.surfaceBorder}` }}>
                <Link
                  href={isAuthenticated ? f.route : '/register'}
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
                  <span>{isAuthenticated ? 'Open in Workspace' : 'Get Started Free'}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Cycle (4 Steps) */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(28px, 6vw, 56px) clamp(20px, 4vw, 40px)',
        position: 'relative',
        zIndex: 1,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Lifecycle Architecture
          </span>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: '900', color: tokens.textPrimary, marginTop: '8px', letterSpacing: '-0.5px' }}>
            How Netify Streamlines Informal Trade Credit
          </h2>
          <p style={{ color: tokens.textSecondary, fontSize: '15px', maxWidth: '640px', margin: '10px auto 0' }}>
            From dispatching goods to receiving final settlement in cash or mobile money.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: '28px 24px', borderRadius: '16px', border: `1px solid ${tokens.surfaceBorder}` }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#00A581', marginBottom: '10px' }}>01</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>Credit Sale Dispatched</h4>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, lineHeight: '1.6' }}>
              Issue a credit invoice or log direct goods dispatched with 7, 14, 30, or 60-day payment terms.
            </p>
          </div>

          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: '28px 24px', borderRadius: '16px', border: `1px solid ${tokens.surfaceBorder}` }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#00A581', marginBottom: '10px' }}>02</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>Promise Scheduled</h4>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, lineHeight: '1.6' }}>
              When the buyer promises payment on WhatsApp, log the promised date and amount in your schedule.
            </p>
          </div>

          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: '28px 24px', borderRadius: '16px', border: `1px solid ${tokens.surfaceBorder}` }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#00A581', marginBottom: '10px' }}>03</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>Attention Triggered</h4>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, lineHeight: '1.6' }}>
              If a promise is kept or missed, Netify updates risk scores and surfaces urgent accounts in the priority queue.
            </p>
          </div>

          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: '28px 24px', borderRadius: '16px', border: `1px solid ${tokens.surfaceBorder}` }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#00A581', marginBottom: '10px' }}>04</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>Safe Follow-up & Settlement</h4>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, lineHeight: '1.6' }}>
              AI drafts a respectful follow-up. You approve it. When payment arrives, log settlement to restore their credit line.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        backgroundColor: isLight ? '#F1F5F9' : '#00253E',
        borderRadius: '24px',
        border: '2px solid #00A581',
        padding: 'clamp(28px, 6vw, 56px) clamp(20px, 5vw, 36px)',
        textAlign: 'center',
        boxShadow: isLight ? tokens.shadowCard : '0 15px 50px rgba(0, 165, 129, 0.2)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: '900', color: tokens.textPrimary, marginBottom: '12px' }}>
          Experience the Modern Collections Stack
        </h2>
        <p style={{ color: tokens.textSecondary, fontSize: '15px', maxWidth: '580px', margin: '0 auto 32px' }}>
          Start free with your primary customers, or explore the live collections workspace.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link
              href="/workspace"
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
                boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
              }}
            >
              <span>Open Live Workspace</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
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
                  boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
                }}
              >
                <span>Register Organization</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/pricing"
                style={{
                  padding: '14px 24px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textPrimary,
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: isLight ? tokens.shadowCard : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                View Multi-Currency Pricing
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
