'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  HelpCircle, 
  ArrowRight, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

type CurrencyCode = 'NGN' | 'KES' | 'GHS' | 'USD';

export default function PricingPage() {
  const [currency, setCurrency] = useState<CurrencyCode>('NGN');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      a: 'Never. Netify is built on a strict human-in-the-loop guarantee. AI drafts the message grounded in actual invoices and promises, but you have complete control to edit, review, and approve before it is dispatched.',
    },
    {
      q: 'How does Netify handle partial payments like cash or M-Pesa?',
      a: 'You can record partial payments against any open receivable anytime. Netify automatically recalculates the remaining balance, updates aging days, and tracks the exact timeline of partial installments.',
    },
    {
      q: 'What is WebMCP and why does it matter for my business?',
      a: 'WebMCP is the new browser-native standard that allows client-side AI assistants (like ChatGPT or Google Chrome) to safely query your collections queue and draft follow-ups directly in the web browser without fragile API key configuration.',
    },
    {
      q: 'Is our customer debt and invoice data secure?',
      a: 'Yes. Netify enforces strict PostgreSQL tenant isolation and encrypted sessions. Your customer ledgers and financial records are never shared across organizations or used to train public AI models.',
    },
  ];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '60px 24px 80px', display: 'flex', flexDirection: 'column', gap: '64px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Transparent Pricing
        </span>
        <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#FFFFFF', marginTop: '8px', letterSpacing: '-1px' }}>
          Simple, Fair Plans for African Merchants
        </h1>
        <p style={{ color: '#8FB7C7', fontSize: '16px', lineHeight: '1.6', marginTop: '12px' }}>
          Start free with your primary customers, then scale as your trade receivables and distribution networks grow.
        </p>

        {/* Currency Switcher Bar */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#003051',
          border: '1px solid #0F5470',
          padding: '6px',
          borderRadius: '10px',
          marginTop: '28px',
        }}>
          <span style={{ fontSize: '12px', color: '#8FB7C7', marginLeft: '8px', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={14} color="#00A581" />
            <span>Currency:</span>
          </span>
          {(['NGN', 'KES', 'GHS', 'USD'] as CurrencyCode[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                backgroundColor: currency === c ? '#00A581' : 'transparent',
                color: currency === c ? '#FFFFFF' : '#8FB7C7',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        {/* Starter Plan */}
        <div style={{
          backgroundColor: '#003051',
          borderRadius: '16px',
          border: '1px solid #0F5470',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>Starter Free</h3>
            <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>For single retail shops and new traders.</p>
            
            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: '900', color: '#FFFFFF' }}>
                {currentPrices.symbol}{currentPrices.starter}
              </span>
              <span style={{ color: '#8FB7C7', fontSize: '13px' }}>/ forever free</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: '#DCEAF0' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Up to 25 customer accounts</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Basic invoice & credit sale tracking</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>WhatsApp promise schedule logs</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Standard WebMCP read-only tools</span>
              </li>
            </ul>
          </div>

          <Link
            href="/register"
            style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#001D31',
              border: '1px solid #0F5470',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            Get Started Free
          </Link>
        </div>

        {/* Growth Pro (Featured) */}
        <div style={{
          backgroundColor: '#003051',
          borderRadius: '16px',
          border: '2px solid #00A581',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: '0 15px 35px rgba(0, 165, 129, 0.2)',
        }}>
          <div style={{
            position: 'absolute',
            top: '-12px',
            right: '24px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '3px 10px',
            borderRadius: '12px',
            textTransform: 'uppercase',
          }}>
            Most Popular
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>Growth Pro</h3>
            <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>For active wholesalers and distributors.</p>
            
            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: '900', color: '#00A581' }}>
                {currentPrices.symbol}{currentPrices.pro}
              </span>
              <span style={{ color: '#8FB7C7', fontSize: '13px' }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: '#FFFFFF' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span><strong>Unlimited</strong> customer debtor accounts</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Deterministic priority collections queue</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Culturally grounded AI message drafting</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>pgvector semantic business memory</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>All 8 WebMCP agent tools active</span>
              </li>
            </ul>
          </div>

          <Link
            href="/"
            style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 'bold',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0, 165, 129, 0.3)',
            }}
          >
            Launch Pro Workspace
          </Link>
        </div>

        {/* Enterprise Scale */}
        <div style={{
          backgroundColor: '#003051',
          borderRadius: '16px',
          border: '1px solid #0F5470',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>Enterprise Scale</h3>
            <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>For multi-branch & regional supply chains.</p>
            
            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: '900', color: '#FFFFFF' }}>
                {currentPrices.symbol}{currentPrices.enterprise}
              </span>
              <span style={{ color: '#8FB7C7', fontSize: '13px' }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: '#DCEAF0' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Multi-branch & store organizations</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>ERP & external banking API integration</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Custom WebMCP tool extensions</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#00A581" />
                <span>Dedicated account manager & SLA</span>
              </li>
            </ul>
          </div>

          <Link
            href="/about"
            style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#001D31',
              border: '1px solid #0F5470',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            Contact Enterprise Team
          </Link>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: '32px' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                style={{
                  backgroundColor: '#003051',
                  borderRadius: '10px',
                  border: '1px solid #0F5470',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '14.5px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#00A581" /> : <ChevronDown size={18} color="#8FB7C7" />}
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 18px', color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.6' }}>
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
