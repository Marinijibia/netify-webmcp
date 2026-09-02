'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { tokens, isLight } = useTheme();

  useEffect(() => {
    console.error('App Router Uncaught Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px)',
      position: 'relative',
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.surfaceBorder}`,
        borderRadius: '20px',
        padding: 'clamp(28px, 5vw, 40px)',
        maxWidth: '480px',
        width: '100%',
        boxShadow: isLight ? tokens.shadowCard : '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <AlertTriangle size={28} />
        </div>

        <h2 style={{
          fontSize: 'clamp(20px, 3.5vw, 24px)',
          fontWeight: '900',
          color: tokens.textPrimary,
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          Something went wrong
        </h2>

        <p style={{
          color: tokens.textSecondary,
          fontSize: '13.5px',
          lineHeight: '1.6',
          margin: 0,
        }}>
          An unexpected glitch occurred while rendering this view. Our telemetry has logged the incident for review.
        </p>

        {error.digest && (
          <span style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: tokens.textMuted,
            backgroundColor: isLight ? '#F1F5F9' : '#001424',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            Error Digest: {error.digest}
          </span>
        )}

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '12px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
            }}
          >
            <RotateCcw size={15} />
            <span>Try Again</span>
          </button>

          <Link
            href="/workspace"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#F1F5F9' : '#001424',
              color: tokens.textPrimary,
              border: `1px solid ${tokens.surfaceBorder}`,
              padding: '12px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            <Home size={15} />
            <span>Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
