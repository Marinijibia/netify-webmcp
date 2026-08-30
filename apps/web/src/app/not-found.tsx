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
      height: '60vh',
      textAlign: 'center',
      gap: '16px',
    }}>
      <div style={{
        backgroundColor: tokens.accentSoft,
        padding: '16px',
        borderRadius: '50%',
        color: '#00A581',
        border: `1px solid ${tokens.accentBorder}`,
      }}>
        <HelpCircle size={36} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary }}>Page Not Found</h2>
      <p style={{ color: tokens.textSecondary, fontSize: '14px', maxWidth: '400px' }}>
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
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '13px',
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
