'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, ShieldCheck, Terminal, Heart, ExternalLink } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export function PublicFooter() {
  const { tokens, isLight } = useTheme();

  return (
    <footer style={{
      backgroundColor: isLight ? '#FFFFFF' : '#001422',
      borderTop: `1px solid ${tokens.surfaceBorder}`,
      color: tokens.textMuted,
      padding: '60px 24px 32px',
      fontSize: '13px',
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '40px',
        marginBottom: '48px',
      }}>
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#00A581',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: '900', color: tokens.textPrimary }}>NETIFY</span>
          </div>
          <p style={{ lineHeight: '1.6', color: tokens.textSecondary, fontSize: '13px' }}>
            The Agent-Ready Collections Workspace for African SMEs. Built for <strong>The WebMCP Challenge</strong> on Devpost.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#00A581',
              fontWeight: '600',
            }}>
              <Globe size={12} />
              <span>NGN • KES • GHS • USD</span>
            </span>
          </div>
        </div>

        {/* Product Capabilities */}
        <div>
          <h4 style={{ color: tokens.textPrimary, fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            Collections Platform
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link href="/workspace" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Command Center Dashboard</Link></li>
            <li><Link href="/receivables" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Receivables Ledger</Link></li>
            <li><Link href="/commitments" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Payment Commitments</Link></li>
            <li><Link href="/collections" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Collections Priority Queue</Link></li>
            <li><Link href="/customers" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Customer Intelligence Hub</Link></li>
            <li><Link href="/messages/draft" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Grounded Action Drafts</Link></li>
          </ul>
        </div>

        {/* WebMCP & AI Architecture */}
        <div>
          <h4 style={{ color: tokens.textPrimary, fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            WebMCP & Developers
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link href="/webmcp" style={{ color: '#00A581', fontWeight: '600', textDecoration: 'none' }}>WebMCP Judge Showcase</Link></li>
            <li><Link href="/webmcp#tools" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>8 Registered WebMCP Tools</Link></li>
            <li><Link href="/chat" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>AI Copilot & Business Memory</Link></li>
            <li>
              <a href="https://webmcp.devpost.com/" target="_blank" rel="noreferrer" style={{ color: tokens.textSecondary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>The WebMCP Challenge</span>
                <ExternalLink size={12} />
              </a>
            </li>
            <li>
              <a href="https://github.com/Marinijibia/netify-app" target="_blank" rel="noreferrer" style={{ color: tokens.textSecondary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>GitHub Repository</span>
                <ExternalLink size={12} />
              </a>
            </li>
          </ul>
        </div>

        {/* Company & Trust */}
        <div>
          <h4 style={{ color: tokens.textPrimary, fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            Company & Trust
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link href="/about" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>About Our Mission</Link></li>
            <li><Link href="/pricing" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Transparent Pricing</Link></li>
            <li><Link href="/security" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Security & Human Safeguards</Link></li>
            <li><Link href="/privacy" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Privacy Policy</Link></li>
            <li><Link href="/terms" style={{ color: tokens.textSecondary, textDecoration: 'none' }}>Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: `1px solid ${tokens.surfaceBorder}`,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        fontSize: '12px',
      }}>
        <p style={{ margin: 0, color: tokens.textMuted }}>
          © {new Date().getFullYear()} Netify Technologies. Released under the open-source MIT License.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.textMuted }}>
          <span>Empowering African SME trade cashflow</span>
          <Heart size={12} color="#00A581" />
          <span>with human + agent collaboration.</span>
        </div>
      </div>
    </footer>
  );
}
