'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Check, 
  HelpCircle, 
  ArrowRight, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Lock
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

type CurrencyCode = 'NGN' | 'KES' | 'GHS' | 'USD';

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const { tokens, isLight } = useTheme();
  const [currency, setCurrency] = useState<CurrencyCode>('NGN');
  const [openFaq, setOpenFaq] = useState<number | null>(0); // first open by default

  const priceMap: Record<CurrencyCode, { symbol: string; starter: string; pro: string; enterprise: string }> = {
    NGN: { symbol: '₦', starter: '0', pro: '15,000', enterprise: '75,000' },
    KES: { symbol: 'KSh', starter: '0', pro: '1,800', enterprise: '9,000' },
    GHS: { symbol: 'GH₵', starter: '0', pro: '180', enterprise: '900' },
    USD: { symbol: '$', starter: '0', pro: '19', enterprise: '89' },
  };

  const currentPrices = priceMap[currency];

  const faqs = [
    {
      q: 'Does Netify send messages automatically without my review?',
      a: 'Never. Netify is built on a strict human-in-the-loop guarantee. AI drafts the reminder message grounded in actual invoices and promised dates, but you have complete control to edit, review, and approve before it is dispatched.',
    },
    {
      q: 'How does Netify handle partial payments like cash or M-Pesa?',
      a: 'You can record partial payments against any open receivable anytime. Netify automatically recalculates the remaining balance, updates aging days, and tracks the exact timeline of partial installments without error.',
    },
    {
      q: 'What is WebMCP and why does it matter for my business?',
      a: 'WebMCP is the new browser-native standard that allows client-side AI assistants (like ChatGPT or Google Chrome) to safely query your collections queue and draft follow-ups directly in the web browser without sharing fragile API keys.',
    },
    {
      q: 'Is our customer debt and invoice data secure?',
      a: 'Yes. Netify enforces strict PostgreSQL tenant isolation and encrypted sessions. Your customer ledgers and financial records are never shared across organizations or used to train public foundation models.',
    },
    {
      q: 'Can I upgrade or downgrade my plan at any time?',
      a: 'Yes. You can switch between Starter Free, Growth Pro, or Enterprise Scale whenever your trading volume changes. No long-term lock-in contracts.',
    },
  ];

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '80px 24px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: '88px',
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
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
          <Sparkles size={14} color="#00A581" />
          <span>Predictable Pricing • Built for African Commerce</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: '900',
          color: tokens.textPrimary,
          letterSpacing: '-1.5px',
          lineHeight: '1.12',
        }}>
          Simple, Fair Plans for{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00A581 0%, #3AD0A9 50%, #00A581 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Growing Merchants
          </span>
        </h1>
        <p style={{ color: tokens.textSecondary, fontSize: '17px', lineHeight: '1.6', marginTop: '16px' }}>
          Start free with your primary customers, then scale as your trade receivables and distribution network expand.
        </p>

        {/* Currency Switcher Bar */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '6px',
          borderRadius: '12px',
          marginTop: '32px',
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <span style={{ fontSize: '12.5px', color: tokens.textMuted, marginLeft: '10px', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Globe size={14} color="#00A581" />
            <span>Currency:</span>
          </span>
          {(['NGN', 'KES', 'GHS', 'USD'] as CurrencyCode[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                backgroundColor: currency === c ? '#00A581' : 'transparent',
                color: currency === c ? '#FFFFFF' : tokens.textSecondary,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid (3 Columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '28px',
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Starter Plan */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '24px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary }}>Starter Free</h3>
            <p style={{ color: tokens.textMuted, fontSize: '13.5px', marginTop: '6px' }}>For single retail shops and new merchants.</p>
            
            <div style={{ margin: '28px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '42px', fontWeight: '900', color: tokens.textPrimary }}>
                {currentPrices.symbol}{currentPrices.starter}
              </span>
              <span style={{ color: tokens.textMuted, fontSize: '14px' }}>/ forever free</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: tokens.textPrimary }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Up to 25 customer accounts</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Basic invoice & credit sale tracking</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>WhatsApp promise schedule logs</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Standard WebMCP read-only tools</span>
              </li>
            </ul>
          </div>

          <Link
            href="/register"
            style={{
              textAlign: 'center',
              padding: '14px',
              backgroundColor: isLight ? '#F1F5F9' : '#00192B',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Get Started Free
          </Link>
        </div>

        {/* Growth Pro (Featured Luxury Card) */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '24px',
          border: '2px solid #00A581',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: isLight ? tokens.shadowCard : '0 20px 50px rgba(0, 165, 129, 0.25)',
          transition: 'all 0.2s ease',
        }}>
          <div style={{
            position: 'absolute',
            top: '-14px',
            right: '28px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '4px 12px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Most Popular
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary }}>Growth Pro</h3>
            <p style={{ color: tokens.textMuted, fontSize: '13.5px', marginTop: '6px' }}>For active wholesalers and regional distributors.</p>
            
            <div style={{ margin: '28px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '42px', fontWeight: '900', color: '#00A581' }}>
                {currentPrices.symbol}{currentPrices.pro}
              </span>
              <span style={{ color: tokens.textMuted, fontSize: '14px' }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: tokens.textPrimary }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span><strong>Unlimited</strong> customer debtor accounts</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Deterministic priority collections queue</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Culturally grounded AI message drafting</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>pgvector semantic business memory</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>All 8 WebMCP agent tools active</span>
              </li>
            </ul>
          </div>

          <Link
            href={isAuthenticated ? "/workspace" : "/register"}
            style={{
              textAlign: 'center',
              padding: '14px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              boxShadow: '0 8px 25px rgba(0, 165, 129, 0.4)',
            }}
          >
            {isAuthenticated ? 'Launch Pro Workspace' : 'Register for Pro'}
          </Link>
        </div>

        {/* Enterprise Scale */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '24px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary }}>Enterprise Scale</h3>
            <p style={{ color: tokens.textMuted, fontSize: '13.5px', marginTop: '6px' }}>For multi-branch & regional supply chains.</p>
            
            <div style={{ margin: '28px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '42px', fontWeight: '900', color: tokens.textPrimary }}>
                {currentPrices.symbol}{currentPrices.enterprise}
              </span>
              <span style={{ color: tokens.textMuted, fontSize: '14px' }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: tokens.textPrimary }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Multi-branch & store organizations</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>ERP & external banking API sync</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Custom WebMCP tool extensions</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#00A581" />
                <span>Dedicated account manager & 99.9% SLA</span>
              </li>
            </ul>
          </div>

          <Link
            href="/about"
            style={{
              textAlign: 'center',
              padding: '14px',
              backgroundColor: isLight ? '#F1F5F9' : '#00192B',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Contact Enterprise Team
          </Link>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div style={{ maxWidth: '880px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Got Questions?
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '6px' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                style={{
                  backgroundColor: tokens.surface,
                  borderRadius: '14px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  boxShadow: isLight ? tokens.shadowCard : 'none',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: tokens.textPrimary,
                    fontSize: '15px',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#00A581" /> : <ChevronDown size={18} color={tokens.textMuted} />}
                </button>

                {isOpen && (
                  <div style={{ padding: '0 24px 22px', color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
