'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export default function NotFound() {
  const { tokens, isLight } = useTheme();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      gap: '16px',
      padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px)',
    }}>
      <div style={{
        backgroundColor: tokens.accentSoft,
        padding: '18px',
        borderRadius: '50%',
        color: '#00A581',
        border: `1px solid ${tokens.accentBorder}`,
        flexShrink: 0,
      }}>
        <HelpCircle size={36} />
      </div>
      <h2 style={{
        fontSize: 'clamp(20px, 4vw, 28px)',
        fontWeight: 'bold',
        color: tokens.textPrimary,
        letterSpacing: '-0.5px',
      }}>
        Page Not Found
      </h2>
      <p style={{
        color: tokens.textSecondary,
        fontSize: 'clamp(13px, 2vw, 15px)',
        maxWidth: '360px',
        lineHeight: '1.6',
      }}>
        The page or workspace view you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#00A581',
          color: '#FFFFFF',
          padding: '11px 22px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          marginTop: '8px',
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
        }}
      >
        <ArrowLeft size={16} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
