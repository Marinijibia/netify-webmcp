'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck, 
  Globe, 
  Clock, 
  MessageSquareQuote, 
  Layers, 
  TrendingUp, 
  Users, 
  FileText,
  AlertTriangle,
  Play,
  ExternalLink,
  ChevronRight,
  Calculator,
  Lock,
  Cpu,
  Check,
  Zap,
  DollarSign,
  Send,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { tokens, isLight } = useTheme();
  const [activeDemoTab, setActiveDemoTab] = useState<'COMMAND' | 'WHATSAPP' | 'DRAFT' | 'WEBMCP'>('COMMAND');
  const [activeTone, setActiveTone] = useState<'COURTEOUS' | 'DIRECT' | 'ESCALATION' | 'PARTIAL'>('COURTEOUS');
  const [calcVolume, setCalcVolume] = useState<number>(25000000); // ₦25,000,000 monthly credit sales

  // Format currency helpers for calculator
  const formatNaira = (val: number) => {
    return '₦' + val.toLocaleString('en-NG');
  };

  const estimatedUnlocked = Math.round(calcVolume * 0.18); // ~18% cash unlocked
  const estimatedHoursSaved = Math.round((calcVolume / 1000000) * 1.6 + 15);
  const estimatedDsoDrop = 19; // 19 days reduction

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '110px',
      paddingBottom: '100px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient Background Glows */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '500px',
        background: 'radial-gradient(circle at 50% 30%, rgba(0, 165, 129, 0.16), rgba(0, 29, 49, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '80px 24px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* WebMCP Standard Announcement Pill */}
        <Link
          href="/webmcp"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 48, 81, 0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${tokens.accentBorder}`,
            padding: '7px 18px',
            borderRadius: '30px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#00A581',
            marginBottom: '32px',
            textDecoration: 'none',
            boxShadow: isLight ? tokens.shadowCard : '0 0 25px rgba(0, 165, 129, 0.25)',
            transition: 'transform 0.15s ease',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00A581',
            boxShadow: '0 0 10px #00A581',
          }} />
          <span>The WebMCP Challenge Submission</span>
          <span style={{ color: tokens.textMuted, margin: '0 2px' }}>•</span>
          <span style={{ color: tokens.textPrimary, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>8 Live Agent Tools</span>
            <ChevronRight size={13} color="#00A581" />
          </span>
        </Link>

        {/* Master Headline */}
        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 68px)',
          fontWeight: '900',
          lineHeight: '1.08',
          letterSpacing: '-2px',
          color: tokens.textPrimary,
          maxWidth: '980px',
          marginBottom: '24px',
        }}>
          Turn Verbal Promises into{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00A581 0%, #3AD0A9 50%, #00A581 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Liquid Working Capital.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(16px, 2.2vw, 21px)',
          lineHeight: '1.6',
          color: tokens.textSecondary,
          maxWidth: '780px',
          marginBottom: '44px',
          fontWeight: '400',
        }}>
          The AI-powered collections workspace designed for African trade credit. Track informal WhatsApp commitments, prioritize overdue debtors with deterministic math, and draft respectful reminders with human approval.
        </p>

        {/* Dual Primary Call-to-Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '56px' }}>
          {isAuthenticated ? (
            <Link
              href="/workspace"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '16px 36px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 12px 35px rgba(0, 165, 129, 0.45)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Open Collections Workspace</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link
              href="/register"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '16px 36px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 12px 35px rgba(0, 165, 129, 0.45)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Register Free Organization</span>
              <ArrowRight size={18} />
            </Link>
          )}

          <Link
            href="/webmcp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 48, 81, 0.6)',
              backdropFilter: 'blur(12px)',
              color: tokens.textPrimary,
              border: `1px solid ${tokens.surfaceBorder}`,
              boxShadow: isLight ? tokens.shadowCard : 'none',
              padding: '16px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Terminal size={17} color="#00A581" />
            <span>Inspect 8 WebMCP Tools</span>
          </Link>
        </div>

        {/* Trust Badges Strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          color: tokens.textSecondary,
          fontSize: '12.5px',
          padding: '14px 24px',
          borderRadius: '30px',
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 29, 49, 0.5)',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#00A581" />
            <span>Built for Wholesalers & Distributors in Lagos, Nairobi & Accra</span>
          </div>
          <span style={{ color: tokens.surfaceBorder }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#00A581" />
            <span>100% Human-in-the-Loop Safe Guarantee</span>
          </div>
          <span style={{ color: tokens.surfaceBorder }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#00A581" />
            <span>Zero API Keys or Fragile Setup</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE 21ST-CENTURY INTERACTIVE SAAS PRODUCT FRAME                       */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '24px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? '0 20px 50px rgba(0, 48, 81, 0.08)' : '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 50px rgba(0, 165, 129, 0.12)',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}>
          {/* macOS Style Window Titlebar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            backgroundColor: isLight ? '#F1F5F9' : '#00192B',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
          }}>
            {/* Window Traffic Lights */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
            </div>

            {/* Simulated Secure Address Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isLight ? '#FFFFFF' : '#00253E',
              border: `1px solid ${tokens.surfaceBorder}`,
              padding: '4px 18px',
              borderRadius: '20px',
              fontSize: '12px',
              color: tokens.textMuted,
              width: '320px',
              justifyContent: 'center',
            }}>
              <Lock size={11} color="#00A581" />
              <span>https://netify.ng/workspace</span>
            </div>

            {/* Window Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00A581', fontWeight: 'bold' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00A581' }} />
              <span>W3C WebMCP Live</span>
            </div>
          </div>

          {/* Interactive Feature Demo Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            overflowX: 'auto',
          }}>
            {[
              { id: 'COMMAND', label: 'Command Center', icon: Layers, subtitle: 'Real-time financial exposure' },
              { id: 'WHATSAPP', label: 'WhatsApp Promise Capture', icon: MessageCircle, subtitle: 'Turn chats into ledger entries' },
              { id: 'DRAFT', label: 'AI Follow-up Studio', icon: MessageSquareQuote, subtitle: 'Respectful cultural outreach' },
              { id: 'WEBMCP', label: 'WebMCP Agent Protocol', icon: Terminal, subtitle: 'document.modelContext tools' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDemoTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id as any)}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    textAlign: 'left',
                    padding: '16px 20px',
                    border: 'none',
                    backgroundColor: isActive ? (isLight ? '#FFFFFF' : '#00253E') : 'transparent',
                    borderBottom: isActive ? '3px solid #00A581' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={16} color={isActive ? '#00A581' : tokens.textMuted} />
                    <span style={{ fontWeight: 'bold', fontSize: '13.5px', color: isActive ? tokens.textPrimary : tokens.textSecondary }}>
                      {tab.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: tokens.textMuted, marginTop: '3px', paddingLeft: '24px' }}>
                    {tab.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Simulated Screen Displays */}
          <div style={{ padding: '36px', minHeight: '440px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* TAB 1: COMMAND CENTER */}
            {activeDemoTab === 'COMMAND' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 4 Financial Exposure Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', padding: '20px', borderRadius: '14px', border: `1px solid ${tokens.surfaceBorder}` }}>
                    <span style={{ fontSize: '12px', color: tokens.textMuted, fontWeight: '500' }}>Total Trade Receivables</span>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '6px' }}>₦28,450,000</div>
                    <div style={{ fontSize: '11.5px', color: '#00A581', marginTop: '4px' }}>Across 84 merchant accounts</div>
                  </div>
                  <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', padding: '20px', borderRadius: '14px', border: `1px solid ${isLight ? '#FCA5A5' : '#0F5470'}` }}>
                    <span style={{ fontSize: '12px', color: isLight ? '#DC2626' : '#FCA5A5', fontWeight: '500' }}>Past Payment Terms</span>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#DC2626', marginTop: '6px' }}>₦7,820,000</div>
                    <div style={{ fontSize: '11.5px', color: isLight ? '#B91C1C' : '#FCA5A5', marginTop: '4px' }}>19 invoices require attention</div>
                  </div>
                  <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', padding: '20px', borderRadius: '14px', border: `1px solid ${isLight ? '#FCD34D' : '#0F5470'}` }}>
                    <span style={{ fontSize: '12px', color: isLight ? '#D97706' : '#FCD34D', fontWeight: '500' }}>Defaulted Promises</span>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: isLight ? '#D97706' : '#F59E0B', marginTop: '6px' }}>12 Broken</div>
                    <div style={{ fontSize: '11.5px', color: isLight ? '#B45309' : '#FCD34D', marginTop: '4px' }}>WhatsApp commitments missed</div>
                  </div>
                  <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', padding: '20px', borderRadius: '14px', border: `1px solid ${tokens.surfaceBorder}` }}>
                    <span style={{ fontSize: '12px', color: tokens.textMuted, fontWeight: '500' }}>Expected Today</span>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#00A581', marginTop: '6px' }}>₦2,150,000</div>
                    <div style={{ fontSize: '11.5px', color: isLight ? '#047857' : '#93C5FD', marginTop: '4px' }}>6 commitments due today</div>
                  </div>
                </div>

                {/* AI Executive Briefing Strip */}
                <div style={{
                  backgroundColor: isLight ? '#ECFDF8' : '#001D31',
                  borderRadius: '12px',
                  border: `1px solid ${tokens.accentBorder}`,
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581', flexShrink: 0 }}>
                    <Sparkles size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase' }}>Daily Executive Briefing</div>
                    <div style={{ fontSize: '13.5px', color: tokens.textPrimary, marginTop: '2px', lineHeight: '1.5' }}>
                      Alhaji Musa missed his Friday promise for ₦350,000. Grace Wanjiku has ₦150,000 due today. Highest priority collection queue is ready with 5 pre-drafted reminders.
                    </div>
                  </div>
                  <Link
                    href="/workspace"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#00A581',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Open Live Workspace
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: WHATSAPP PROMISE CAPTURE */}
            {activeDemoTab === 'WHATSAPP' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
                {/* Simulated WhatsApp Chat */}
                <div style={{
                  backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                  borderRadius: '16px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${tokens.surfaceBorder}`, paddingBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#00A581', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: '#FFFFFF' }}>
                      AM
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: tokens.textPrimary }}>Alhaji Musa (Kano Grains)</div>
                      <div style={{ fontSize: '11px', color: '#00A581' }}>WhatsApp Verified Buyer</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ alignSelf: 'flex-start', backgroundColor: isLight ? '#E2E8F0' : '#003051', padding: '10px 14px', borderRadius: '12px', maxWidth: '80%', color: tokens.textPrimary }}>
                      Salam Alhaji. Following up on the 50 bags of flour dispatched on July 14.
                    </div>
                    <div style={{ alignSelf: 'flex-end', backgroundColor: '#005C4B', padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', color: '#FFFFFF' }}>
                      Wa alaikum salam Alhaji. Market was slow this week. I will pay ₦350,000 on Friday afternoon by 2pm once sales finish.
                    </div>
                  </div>

                  <div style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    backgroundColor: tokens.accentSoft,
                    border: '1px dashed #00A581',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '12px', color: '#00A581', fontWeight: 'bold' }}>
                      ⚡ Netify Detected Promise: ₦350,000 on Friday
                    </span>
                    <span style={{ fontSize: '11px', backgroundColor: '#00A581', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Log to Ledger
                    </span>
                  </div>
                </div>

                {/* Netify Business Memory Explanation */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Informal Promise Reconciliation
                  </span>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '6px' }}>
                    Never Let a Verbal Promise Disappear Again
                  </h3>
                  <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', marginTop: '12px' }}>
                    In African trade, 90% of credit terms are negotiated verbally or in WhatsApp chats. When Friday arrives and the customer forgets, Netify automatically elevates the account to your attention queue with the exact promised amount and date.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: tokens.textPrimary }}>
                      <Check size={16} color="#00A581" />
                      <span>Zero missed deadlines</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: tokens.textPrimary }}>
                      <Check size={16} color="#00A581" />
                      <span>Verified audit timeline</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI FOLLOW-UP STUDIO */}
            {activeDemoTab === 'DRAFT' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Culturally Grounded AI
                  </span>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '6px' }}>
                    Remind Respectfully. Protect Customer Goodwill.
                  </h3>
                  <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', marginTop: '12px' }}>
                    Aggressive automated robo-calls insult valued merchants. Netify drafts nuanced, respectful reminders grounded in the customer's actual promises and payment history. You review and approve every message before it sends.
                  </p>

                  {/* Tone Switcher Pills */}
                  <div style={{ marginTop: '20px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Select Outreach Tone:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'COURTEOUS', label: 'Courteous' },
                        { id: 'DIRECT', label: 'Direct & Professional' },
                        { id: 'ESCALATION', label: 'Formal Escalation' },
                        { id: 'PARTIAL', label: 'Partial Installment' },
                      ].map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setActiveTone(tone.id as any)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: activeTone === tone.id ? '#00A581' : (isLight ? '#F1F5F9' : '#001D31'),
                            color: activeTone === tone.id ? '#FFFFFF' : tokens.textSecondary,
                            border: `1px solid ${activeTone === tone.id ? '#00A581' : tokens.surfaceBorder}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {tone.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generated Message Preview */}
                <div style={{
                  backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                  borderRadius: '16px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '11px', backgroundColor: tokens.accentSoft, color: '#00A581', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>WhatsApp</span>
                      <span style={{ fontSize: '11px', backgroundColor: tokens.accentSoft, color: '#00A581', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{activeTone} TONE</span>
                    </div>
                    <span style={{ fontSize: '11px', color: tokens.textMuted }}>Requires Human Approval</span>
                  </div>

                  <div style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#003051',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '10px',
                    padding: '16px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontStyle: 'italic',
                    borderLeft: '3px solid #00A581',
                  }}>
                    {activeTone === 'COURTEOUS' && (
                      <p style={{ margin: 0 }}>
                        "Good afternoon Alhaji Musa. Trust sales went smoothly at Dawanau market today. We are checking in following your promise on Friday regarding the outstanding ₦350,000 for invoice #INV-001. Kindly confirm when the transfer is dispatched so our accounts team can credit your ledger. Many thanks for your partnership."
                      </p>
                    )}
                    {activeTone === 'DIRECT' && (
                      <p style={{ margin: 0 }}>
                        "Dear Alhaji Musa, this is a scheduled reminder that the agreed payment of ₦350,000 for your grain shipment was due Friday, August 28. Kindly arrange settlement today to keep your credit line active for upcoming deliveries."
                      </p>
                    )}
                    {activeTone === 'ESCALATION' && (
                      <p style={{ margin: 0 }}>
                        "Urgent notice for Alhaji Musa: Your account reflects an overdue balance of ₦350,000 with a missed commitment date. Future dispatch of flour inventory is paused until this balance is reconciled. Please contact us immediately."
                      </p>
                    )}
                    {activeTone === 'PARTIAL' && (
                      <p style={{ margin: 0 }}>
                        "Hello Alhaji Musa. We understand liquidity fluctuates. If full settlement of ₦350,000 cannot be finalized today, please transfer an initial ₦150,000 installment by 4pm today, and we can reschedule the balance for next Tuesday."
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button style={{ padding: '8px 14px', backgroundColor: isLight ? '#FFFFFF' : '#001D31', border: `1px solid ${tokens.surfaceBorder}`, color: tokens.textSecondary, borderRadius: '6px', fontSize: '12px' }}>
                      Edit Draft
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#00A581', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      <Send size={12} />
                      <span>Approve & Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WEBMCP AGENT PROTOCOL */}
            {activeDemoTab === 'WEBMCP' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', alignItems: 'center' }}>
                <div style={{
                  backgroundColor: '#001827',
                  borderRadius: '14px',
                  border: '1px solid #00A581',
                  padding: '20px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#3AD0A9',
                }}>
                  <div style={{ color: '#8FB7C7', marginBottom: '8px' }}>// W3C WebMCP Browser-Native Tool Definition</div>
                  <div>document.modelContext.registerTool({'{'}</div>
                  <div style={{ paddingLeft: '18px', color: '#FFFFFF' }}>name: "get_collection_priority",</div>
                  <div style={{ paddingLeft: '18px', color: '#8FB7C7' }}>description: "Return ranked collection queue with urgency scores",</div>
                  <div style={{ paddingLeft: '18px', color: '#FCD34D' }}>category: "READ_ONLY",</div>
                  <div style={{ paddingLeft: '18px', color: '#FFFFFF' }}>inputSchema: {'{'} limit: {'{ type: "number", default: 5 }'} {'}'},</div>
                  <div style={{ paddingLeft: '18px', color: '#00A581' }}>execute: async ({'{ limit }'}) =&gt; {'{'}</div>
                  <div style={{ paddingLeft: '36px', color: '#8FB7C7' }}>const data = await api.getPriorities({'{ limit }'});</div>
                  <div style={{ paddingLeft: '36px', color: '#8FB7C7' }}>return data.items.map(c =&gt; ({'{ name: c.customerName, balance: c.totalOutstanding, score: c.priorityScore }'}));</div>
                  <div style={{ paddingLeft: '18px', color: '#00A581' }}>{'}'}</div>
                  <div>{'}'});</div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Autonomous AI Compatibility
                  </span>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '6px' }}>
                    Zero API Keys. Safe In-Browser Agent Execution.
                  </h3>
                  <p style={{ color: tokens.textSecondary, fontSize: '13.5px', lineHeight: '1.6', marginTop: '12px' }}>
                    Netify registers 8 client-side tools directly into <code style={{ color: '#00A581' }}>document.modelContext</code>. AI assistants like Chrome built-in Gemini Nano or ChatGPT in-app browser can autonomously discover your collections queue and propose actions inside your active session.
                  </p>
                  <div style={{ marginTop: '20px' }}>
                    <Link
                      href="/webmcp"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#00A581',
                        color: '#FFFFFF',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Test All 8 Tools Live</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE $330B REALITY & PARADOX COMPARISON                                 */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            The African Trade Credit Paradox
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: tokens.textPrimary, marginTop: '8px', letterSpacing: '-1px' }}>
            Trade Runs on Supplier Credit. Traditional Collections Destroy It.
          </h2>
          <p style={{ color: tokens.textSecondary, fontSize: '16px', maxWidth: '720px', margin: '12px auto 0', lineHeight: '1.6' }}>
            Across wholesale hubs like Alaba (Lagos), Gikomba (Nairobi), and Makola (Accra), businesses don’t borrow from banks. Wholesalers finance retailers directly.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {/* Western Software Failure */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '20px',
            border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.4)'}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: tokens.textPrimary }}>Aggressive Debt Software</h3>
            </div>
            <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Automated robo-calls, impersonal threats of police action, and credit blacklist warnings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '16px', fontSize: '13px', color: isLight ? '#DC2626' : '#FCA5A5' }}>
              <div>❌ Destroys 10+ year customer relationships</div>
              <div>❌ Retailers refuse to buy again and switch suppliers</div>
              <div>❌ Ignores real informal market cash-flow timing</div>
            </div>
          </div>

          {/* Netify Approach */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '20px',
            border: '2px solid #00A581',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: isLight ? tokens.shadowCard : '0 10px 40px rgba(0, 165, 129, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581' }}>
                <CheckCircle2 size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: tokens.textPrimary }}>Netify Relational Intelligence</h3>
            </div>
            <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Tracks WhatsApp promises, understands market cycles, and proposes respectful reminders for human approval.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '16px', fontSize: '13px', color: '#00A581' }}>
              <div>✓ Recovers cash 41% faster without losing customers</div>
              <div>✓ 100% audit timeline for every promise and payment</div>
              <div>✓ Protects the trust that drives repeat trade sales</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. 21ST-CENTURY BENTO GRID: CORE CAPABILITIES                            */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Complete Architecture
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: tokens.textPrimary, marginTop: '8px', letterSpacing: '-1px' }}>
            Engineered for High-Velocity African Trading Houses
          </h2>
        </div>

        {/* Bento Grid Container */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {/* Bento Cell 1 (Wide: 2 cols) */}
          <div style={{
            gridColumn: 'span 2',
            backgroundColor: tokens.surface,
            borderRadius: '20px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581', marginBottom: '16px' }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>
                Single Source of Truth & Business Memory
              </h3>
              <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', maxWidth: '580px' }}>
                Every invoice, cash receipt, bank transfer, WhatsApp promise, and phone note is linked to the customer debtor record. No more arguments about whether goods were delivered or when money was promised.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '28px', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '20px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00A581' }}>pgvector Memory</div>
                <div style={{ fontSize: '12px', color: tokens.textMuted }}>Semantic trade search</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00A581' }}>4-Tab Ledger</div>
                <div style={{ fontSize: '12px', color: tokens.textMuted }}>Invoices, payments, promises, notes</div>
              </div>
            </div>
          </div>

          {/* Bento Cell 2 (Tall / Single col) */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '20px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', marginBottom: '16px' }}>
                <TrendingUp size={22} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>
                Mathematical Priority Queue
              </h3>
              <p style={{ color: tokens.textSecondary, fontSize: '13.5px', lineHeight: '1.6' }}>
                Accounts are ranked deterministically by risk score, overdue days, and commitment default weight.
              </p>
            </div>
            <div style={{ backgroundColor: isLight ? '#F1F5F9' : '#001D31', padding: '14px', borderRadius: '10px', border: `1px solid ${tokens.surfaceBorder}`, marginTop: '20px' }}>
              <div style={{ fontSize: '11px', color: tokens.textMuted }}>Urgency Ranking Formula</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', marginTop: '2px' }}>
                (Days Overdue × 0.4) + (Broken Promises × 25)
              </div>
            </div>
          </div>

          {/* Bento Cell 3 (Single col) */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '20px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: '36px',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581', marginBottom: '16px' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>
              Human Authorization Guarantee
            </h3>
            <p style={{ color: tokens.textSecondary, fontSize: '13.5px', lineHeight: '1.6' }}>
              AI agents never dispatch outbound messages autonomously. Every draft requires human approval, protecting your business reputation.
            </p>
          </div>

          {/* Bento Cell 4 (Wide: 2 cols) */}
          <div style={{
            gridColumn: 'span 2',
            backgroundColor: tokens.surface,
            borderRadius: '20px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isLight ? '#EFF6FF' : 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: '16px' }}>
                <Terminal size={22} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px' }}>
                W3C WebMCP Browser-Native Standard
              </h3>
              <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', maxWidth: '620px' }}>
                Netify implements the emerging Web Model Context Protocol (<code style={{ color: '#00A581' }}>document.modelContext.registerTool</code>). Autonomous browser agents like Chrome built-in Gemini Nano or ChatGPT can safely inspect priorities and propose reminders without handling API credentials.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '24px' }}>
              <Link
                href="/webmcp"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                <span>Read WebMCP Documentation</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE WORKING CAPITAL RECOVERY CALCULATOR                         */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '24px',
          border: `1px solid ${isLight ? '#A7F3D0' : '#00A581'}`,
          padding: '48px 40px',
          boxShadow: isLight ? tokens.shadowCard : '0 0 50px rgba(0, 165, 129, 0.15)',
          transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px', alignItems: 'center' }}>
            {/* Left Controls */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Calculator size={20} color="#00A581" />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Working Capital Impact
                </span>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
                How Much Cash is Trapped in Your Overdue Receivables?
              </h3>
              <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
                Select your approximate monthly credit sales volume to see estimated liquidity recovered through disciplined promise tracking.
              </p>

              {/* Volume Selector Buttons */}
              <div style={{ marginTop: '28px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, display: 'block', marginBottom: '10px' }}>
                  Monthly Trade Credit Dispatched:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { label: '₦5 Million', val: 5000000 },
                    { label: '₦25 Million', val: 25000000 },
                    { label: '₦75 Million', val: 75000000 },
                    { label: '₦200 Million+', val: 200000000 },
                  ].map((tier) => (
                    <button
                      key={tier.val}
                      onClick={() => setCalcVolume(tier.val)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: calcVolume === tier.val ? '#00A581' : (isLight ? '#F1F5F9' : '#001D31'),
                        color: calcVolume === tier.val ? '#FFFFFF' : tokens.textPrimary,
                        border: `1px solid ${calcVolume === tier.val ? '#00A581' : tokens.surfaceBorder}`,
                        fontWeight: 'bold',
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Output Card */}
            <div style={{
              backgroundColor: isLight ? '#F8FAFC' : '#00192B',
              borderRadius: '18px',
              border: `1px solid ${tokens.surfaceBorder}`,
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: tokens.textMuted, fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Estimated Monthly Cash Recovered
                </span>
                <div style={{ fontSize: '38px', fontWeight: '900', color: '#00A581', marginTop: '4px' }}>
                  {formatNaira(estimatedUnlocked)}
                </div>
                <div style={{ fontSize: '12px', color: tokens.textMuted, marginTop: '2px' }}>
                  Reinvested in high-turnover inventory
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '20px' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00A581' }}>
                    -{estimatedDsoDrop} Days
                  </div>
                  <div style={{ fontSize: '11.5px', color: tokens.textMuted, marginTop: '2px' }}>
                    DSO (Days Sales Outstanding) Reduction
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00A581' }}>
                    {estimatedHoursSaved} Hours
                  </div>
                  <div style={{ fontSize: '11.5px', color: tokens.textMuted, marginTop: '2px' }}>
                    Manual collection tracking saved / mo
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                style={{
                  textAlign: 'center',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
                }}
              >
                Unlock This Liquidity Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. AFRICAN TRADER PERSONAS & DOSSIERS                                     */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Built for Real African Trade
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: tokens.textPrimary, marginTop: '8px', letterSpacing: '-1px' }}>
            Powering Everyday African Commerce
          </h2>
          <p style={{ color: tokens.textSecondary, fontSize: '15px', maxWidth: '640px', margin: '12px auto 0' }}>
            From wholesale grain depots in Northern Nigeria to bus parcel textiles in East Africa.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Persona 1: Alhaji Musa */}
          <div style={{
            backgroundColor: tokens.surface,
            padding: '32px',
            borderRadius: '20px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🌾
                </div>
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: 'bold', color: tokens.textPrimary }}>Alhaji Musa</h4>
                  <p style={{ fontSize: '12px', color: '#00A581', fontWeight: '600' }}>Grain & Flour Distributor • Kano</p>
                </div>
              </div>
              <p style={{ color: tokens.textSecondary, fontSize: '13.5px', lineHeight: '1.6' }}>
                "I dispatch 100 bags of wheat to 35 bakery retailers every Monday. They promise to pay after baking on Friday. Netify remembers every promise date so my staff doesn't need to ask three times."
              </p>
            </div>
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${tokens.surfaceBorder}`, display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: tokens.textMuted }}>
              <span>Credit Volume: ₦45M/mo</span>
              <span style={{ color: '#00A581', fontWeight: 'bold' }}>0 Broken Disputes</span>
            </div>
          </div>

          {/* Persona 2: Grace Wanjiku */}
          <div style={{
            backgroundColor: tokens.surface,
            padding: '32px',
            borderRadius: '20px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: isLight ? '#EFF6FF' : 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  👗
                </div>
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: 'bold', color: tokens.textPrimary }}>Grace Wanjiku</h4>
                  <p style={{ fontSize: '12px', color: '#2563EB', fontWeight: '600' }}>Textile Importer • Nairobi</p>
                </div>
              </div>
              <p style={{ color: tokens.textSecondary, fontSize: '13.5px', lineHeight: '1.6' }}>
                "We ship fashion apparel via bus parcels to Eldoret and Mombasa on 14-day terms. The AI drafts polite M-Pesa reminders that keep payments flowing without souring relationships."
              </p>
            </div>
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${tokens.surfaceBorder}`, display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: tokens.textMuted }}>
              <span>Credit Volume: KSh 3.8M/mo</span>
              <span style={{ color: '#2563EB', fontWeight: 'bold' }}>16 Days DSO Drop</span>
            </div>
          </div>

          {/* Persona 3: Kwame Mensah */}
          <div style={{
            backgroundColor: tokens.surface,
            padding: '32px',
            borderRadius: '20px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  📦
                </div>
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: 'bold', color: tokens.textPrimary }}>Kwame Mensah</h4>
                  <p style={{ fontSize: '12px', color: '#D97706', fontWeight: '600' }}>FMCG Wholesaler • Accra</p>
                </div>
              </div>
              <p style={{ color: tokens.textSecondary, fontSize: '13.5px', lineHeight: '1.6' }}>
                "Supplying 120 provisioning shops was chaos on paper notebooks. With Netify’s collections priority queue, my drivers know exactly which stores have overdue accounts before making today’s delivery."
              </p>
            </div>
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${tokens.surfaceBorder}`, display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: tokens.textMuted }}>
              <span>Credit Volume: GH₵ 680k/mo</span>
              <span style={{ color: '#D97706', fontWeight: 'bold' }}>100% Audit Record</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. HIGH-CONVERTING BOTTOM HERO CTA                                        */}
      {/* ========================================================================= */}
      <section style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          backgroundColor: isLight ? '#F1F5F9' : '#00253E',
          borderRadius: '28px',
          border: '2px solid #00A581',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: isLight ? tokens.shadowCard : '0 20px 60px rgba(0, 165, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}>
          {/* Subtle Accent Glow inside CTA */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(0, 165, 129, 0.15), transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-1px', marginBottom: '14px' }}>
            Ready to Take Control of Your Receivables?
          </h2>
          <p style={{ color: tokens.textSecondary, fontSize: '16px', maxWidth: '640px', margin: '0 auto 36px', lineHeight: '1.6' }}>
            Join forward-thinking African trading businesses replacing chaotic paper ledgers and forgotten WhatsApp promises with grounded AI collections.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link
                href="/workspace"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '16px 36px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
                }}
              >
                <span>Open Collections Workspace</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#00A581',
                    color: '#FFFFFF',
                    padding: '16px 36px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
                  }}
                >
                  <span>Start Free with 25 Accounts</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  style={{
                    padding: '16px 28px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    color: tokens.textPrimary,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    boxShadow: isLight ? tokens.shadowCard : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Sign In to Workspace
                </Link>
              </>
            )}
          </div>

          <div style={{ marginTop: '28px', color: tokens.textMuted, fontSize: '12.5px' }}>
            Free tier forever • Multi-currency (₦, KSh, GH₵, $) • W3C WebMCP Standard
          </div>
        </div>
      </section>
    </div>
  );
}
