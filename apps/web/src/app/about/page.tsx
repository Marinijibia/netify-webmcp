'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Heart, Globe, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 24px 80px', display: 'flex', flexDirection: 'column', gap: '56px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Our Mission
        </span>
        <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#FFFFFF', marginTop: '8px', letterSpacing: '-1px' }}>
          Empowering African Commerce with Relational Business Memory
        </h1>
        <p style={{ color: '#8FB7C7', fontSize: '16px', lineHeight: '1.6', marginTop: '12px', maxWidth: '720px', margin: '12px auto 0' }}>
          We believe debt collection in emerging markets shouldn’t be aggressive, adversarial, or chaotic. It should be respectful, grounded in data, and clear.
        </p>
      </div>

      {/* Story & Thesis */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '16px',
        border: '1px solid #0F5470',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        lineHeight: '1.7',
        color: '#DCEAF0',
        fontSize: '14.5px',
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>
          The $330 Billion Trade Credit Paradox
        </h2>
        <p>
          Across markets like Alaba in Lagos, Gikomba in Nairobi, and Kantamanto in Accra, formal bank lending is virtually non-existent for small businesses. Instead, trade runs on <strong>supplier credit</strong>: wholesalers advance goods to retailers based on relationship, reputation, and mutual trust.
        </p>
        <p>
          However, as trading networks scale to hundreds of buyers, keeping track of verbal promises made over WhatsApp becomes humanly impossible. Promises like <em>"I will pay after Friday’s market"</em> get buried. Weeks pass, cash flows choke, and business owners are forced to choose between awkwardly confronting valued customers or suffering crippling liquidity shortages.
        </p>
        <p>
          Western collections software assumes an adversarial relationship: automated phone dialers, threats of legal action, and ruined credit scores. In Africa, that burns relationships and destroys businesses.
        </p>
        <p>
          <strong>Netify exists to solve this.</strong> By tracking promises, keeping a verified timeline, and drafting culturally grounded follow-ups, we give African SMEs the confidence to extend credit and the clarity to get paid.
        </p>
      </div>

      {/* The 3 Guiding Principles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: '#003051', borderRadius: '12px', border: '1px solid #0F5470', padding: '24px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤝</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '6px' }}>
            Respect is Non-Negotiable
          </h3>
          <p style={{ color: '#8FB7C7', fontSize: '13px', lineHeight: '1.6' }}>
            We treat debt collection as an extension of customer service. Reminders are polite, context-aware, and acknowledge past commitments.
          </p>
        </div>

        <div style={{ backgroundColor: '#003051', borderRadius: '12px', border: '1px solid #0F5470', padding: '24px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '6px' }}>
            Human Controls Every Action
          </h3>
          <p style={{ color: '#8FB7C7', fontSize: '13px', lineHeight: '1.6' }}>
            AI should prepare, analyze, and draft proposals. But human business owners make the final decision before any communication is dispatched.
          </p>
        </div>

        <div style={{ backgroundColor: '#003051', borderRadius: '12px', border: '1px solid #0F5470', padding: '24px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌐</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '6px' }}>
            Browser-Native Open Standards
          </h3>
          <p style={{ color: '#8FB7C7', fontSize: '13px', lineHeight: '1.6' }}>
            By adopting WebMCP, we believe enterprise software should be inherently open to autonomous AI agents working alongside humans.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        backgroundColor: '#001D31',
        borderRadius: '16px',
        border: '1px solid #0F5470',
        padding: '32px',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
          Ready to experience the workspace?
        </h3>
        <p style={{ color: '#8FB7C7', fontSize: '13.5px', marginBottom: '20px' }}>
          Access the live Netify Collections Workspace built for The WebMCP Challenge.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          <span>Launch Workspace</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
