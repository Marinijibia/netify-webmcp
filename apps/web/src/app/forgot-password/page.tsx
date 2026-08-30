'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export default function ForgotPasswordPage() {
  const { tokens, isLight } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: tokens.background,
      position: 'relative',
      transition: 'all 0.2s ease',
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 165, 129, 0.14), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: tokens.surface,
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: '40px 32px',
        boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        {/* Back Link */}
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: tokens.textSecondary,
            fontSize: '13px',
            textDecoration: 'none',
            marginBottom: '24px',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: tokens.accentSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00A581',
            marginBottom: '16px',
          }}>
            <Mail size={20} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            Reset Password
          </h1>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5' }}>
            Enter your business email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: tokens.accentSoft,
              border: '1px solid #00A581',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: tokens.textSecondary,
              fontSize: '13.5px',
              lineHeight: '1.5',
            }}>
              <CheckCircle2 size={20} color="#00A581" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: tokens.textPrimary, display: 'block', marginBottom: '4px' }}>Reset instructions dispatched</strong>
                We've sent a secure reset link to <strong style={{ color: '#00A581' }}>{email}</strong>. Check your inbox and spam folder.
              </div>
            </div>

            <div style={{
              backgroundColor: isLight ? '#F1F5F9' : '#00192B',
              padding: '14px 16px',
              borderRadius: '10px',
              border: `1px dashed ${tokens.surfaceBorder}`,
              fontSize: '12.5px',
              color: tokens.textSecondary,
              textAlign: 'center',
            }}>
              <span>Demo simulation link: </span>
              <Link href="/reset-password" style={{ color: '#00A581', fontWeight: 'bold' }}>
                Open Reset Password Screen →
              </Link>
            </div>

            <button
              onClick={() => setIsSubmitted(false)}
              style={{
                padding: '12px',
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                color: tokens.textSecondary,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Try another email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="musa@kanograins.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '10px',
                    color: tokens.textPrimary,
                    fontSize: '14px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(0, 165, 129, 0.35)',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isLoading ? 'Dispatching Link...' : 'Send Reset Instructions'}</span>
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
