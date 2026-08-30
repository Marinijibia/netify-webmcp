'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { Sparkles, Heart, Globe, ShieldCheck, ArrowRight, ExternalLink, Users, Zap, Check } from 'lucide-react';

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const { tokens, isLight } = useTheme();

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '80px 24px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: '72px',
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
          <Sparkles size={14} color="#00A581" />
          <span>Our Mission & Economic Thesis</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 54px)',
          fontWeight: '900',
          color: tokens.textPrimary,
          letterSpacing: '-1.5px',
          lineHeight: '1.15',
        }}>
          Empowering African Commerce with{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00A581 0%, #3AD0A9 50%, #00A581 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Relational Business Memory
          </span>
        </h1>
        <p style={{ color: tokens.textSecondary, fontSize: '17px', lineHeight: '1.6', marginTop: '16px' }}>
          We believe debt collection in emerging markets shouldn’t be aggressive, adversarial, or chaotic. It should be respectful, grounded in verified data, and clear.
        </p>
      </div>

      {/* Story & Economic Thesis */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        lineHeight: '1.8',
        color: tokens.textSecondary,
        fontSize: '15px',
        boxShadow: isLight ? tokens.shadowCard : '0 10px 40px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
          The $330 Billion Trade Credit Paradox
        </h2>
        <p>
          Across major commercial trade hubs like Alaba in Lagos, Gikomba in Nairobi, and Kantamanto in Accra, formal bank lending is virtually non-existent for small and growing businesses. Instead, trade runs on <strong>supplier credit</strong>: wholesalers advance goods to retailers based on relationship, reputation, and mutual trust.
        </p>
        <p>
          However, as trading networks scale to hundreds of buyers, keeping track of verbal promises made over WhatsApp becomes humanly impossible. Promises like <em>"I will pay after Friday’s market"</em> get buried under hundreds of daily chats. Weeks pass, working capital freezes, and business owners are forced to choose between awkwardly confronting valued customers or suffering crippling liquidity shortages.
        </p>
        <p>
          Western collections software assumes an adversarial relationship: automated phone dialers, threats of legal action, and ruined credit scores. In Africa, that burns relationships and destroys businesses.
        </p>
        <p>
          <strong>Netify exists to solve this.</strong> By tracking promises, keeping a verified timeline, and drafting culturally grounded follow-ups, we give African SMEs the confidence to extend credit and the clarity to get paid without losing their customers.
        </p>
      </div>

      {/* The 3 Guiding Principles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ backgroundColor: tokens.surface, borderRadius: '20px', border: `1px solid ${tokens.surfaceBorder}`, padding: '32px', boxShadow: isLight ? tokens.shadowCard : 'none', transition: 'all 0.2s ease' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }}>🤝</div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>
            Respect is Non-Negotiable
          </h3>
          <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
            We treat debt collection as an extension of customer service. Reminders are polite, context-aware, and acknowledge past commitments rather than threatening merchants.
          </p>
        </div>

        <div style={{ backgroundColor: tokens.surface, borderRadius: '20px', border: `1px solid ${tokens.surfaceBorder}`, padding: '32px', boxShadow: isLight ? tokens.shadowCard : 'none', transition: 'all 0.2s ease' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }}>🛡️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>
            Human Controls Every Action
          </h3>
          <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
            AI should prepare, analyze, and draft proposals. But human business owners make the final decision before any communication is dispatched.
          </p>
        </div>

        <div style={{ backgroundColor: tokens.surface, borderRadius: '20px', border: `1px solid ${tokens.surfaceBorder}`, padding: '32px', boxShadow: isLight ? tokens.shadowCard : 'none', transition: 'all 0.2s ease' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }}>🌐</div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>
            Browser-Native Open Standards
          </h3>
          <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
            By adopting WebMCP, we believe enterprise software should be inherently open to autonomous AI agents working alongside humans without sharing fragile API keys.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        backgroundColor: isLight ? '#F1F5F9' : '#00253E',
        borderRadius: '24px',
        border: '2px solid #00A581',
        padding: '48px 36px',
        textAlign: 'center',
        boxShadow: isLight ? tokens.shadowCard : '0 10px 40px rgba(0, 165, 129, 0.2)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px' }}>
          Ready to experience the workspace?
        </h3>
        <p style={{ color: tokens.textSecondary, fontSize: '14px', marginBottom: '28px' }}>
          Access the live Netify Collections Workspace built for The WebMCP Challenge.
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
