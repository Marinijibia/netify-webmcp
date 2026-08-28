'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, ShieldCheck, Terminal, Heart, ExternalLink } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer style={{
      backgroundColor: '#001422',
      borderTop: '1px solid #0F5470',
      color: '#8FB7C7',
      padding: '60px 24px 32px',
      fontSize: '13px',
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
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF' }}>NETIFY</span>
          </div>
          <p style={{ lineHeight: '1.6', color: '#8FB7C7', fontSize: '13px' }}>
            The Agent-Ready Collections Workspace for African SMEs. Built for <strong>The WebMCP Challenge</strong> on Devpost.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#003051',
              border: '1px solid #0F5470',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#3AD0A9',
              fontWeight: '600',
            }}>
              <Globe size={12} />
              <span>NGN • KES • GHS • USD</span>
            </span>
          </div>
        </div>

        {/* Product Capabilities */}
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            Collections Platform
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link href="/" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Command Center Dashboard</Link></li>
            <li><Link href="/receivables" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Receivables Ledger</Link></li>
            <li><Link href="/commitments" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Payment Commitments</Link></li>
            <li><Link href="/collections" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Collections Priority Queue</Link></li>
            <li><Link href="/customers" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Customer Intelligence Hub</Link></li>
            <li><Link href="/messages/draft" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Grounded Action Drafts</Link></li>
          </ul>
        </div>

        {/* WebMCP & AI Architecture */}
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            WebMCP & Developers
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link href="/webmcp" style={{ color: '#3AD0A9', fontWeight: '600', textDecoration: 'none' }}>WebMCP Judge Showcase</Link></li>
            <li><Link href="/webmcp#tools" style={{ color: '#8FB7C7', textDecoration: 'none' }}>8 Registered WebMCP Tools</Link></li>
            <li><Link href="/chat" style={{ color: '#8FB7C7', textDecoration: 'none' }}>AI Copilot & Business Memory</Link></li>
            <li>
              <a href="https://webmcp.devpost.com/" target="_blank" rel="noreferrer" style={{ color: '#8FB7C7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>The WebMCP Challenge</span>
                <ExternalLink size={12} />
              </a>
            </li>
            <li>
              <a href="https://github.com/Marinijibia/netify-app" target="_blank" rel="noreferrer" style={{ color: '#8FB7C7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>GitHub Repository</span>
                <ExternalLink size={12} />
              </a>
            </li>
          </ul>
        </div>

        {/* Company & Trust */}
        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            Company & Trust
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link href="/about" style={{ color: '#8FB7C7', textDecoration: 'none' }}>About Our Mission</Link></li>
            <li><Link href="/pricing" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Transparent Pricing</Link></li>
            <li><Link href="/security" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Security & Human Safeguards</Link></li>
            <li><Link href="/privacy" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Privacy Policy</Link></li>
            <li><Link href="/terms" style={{ color: '#8FB7C7', textDecoration: 'none' }}>Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: '1px solid #0F5470',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        fontSize: '12px',
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} Netify Technologies. Released under the open-source MIT License.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Empowering African SME trade cashflow</span>
          <Heart size={12} color="#00A581" />
          <span>with human + agent collaboration.</span>
        </div>
      </div>
    </footer>
  );
}
