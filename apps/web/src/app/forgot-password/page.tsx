'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const { tokens, isLight } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setIsSubmitted(true);
      setCooldown(60);
    } catch (err: any) {
      setError(err?.message || 'Could not send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setIsLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setCooldown(60);
    } catch (err: any) {
      setError(err?.message || 'Could not resend email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(16px, 4vw, 24px)',
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
        borderRadius: 'clamp(16px, 3vw, 24px)',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(24px, 5vw, 40px) clamp(18px, 5vw, 32px)',
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px', margin: 0 }}>
            Reset Password
          </h1>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5' }}>
            Enter your business email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '10px 14px',
            color: isLight ? '#B91C1C' : '#FCA5A5',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.12)',
              border: `1px solid ${tokens.accentBorder}`,
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}>
              <CheckCircle2 size={36} color="#00A581" />
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary }}>
                Check Your Inbox
              </div>
              <p style={{ fontSize: '12.5px', color: tokens.textSecondary, margin: 0, lineHeight: '1.5' }}>
                If an account exists for <strong style={{ color: tokens.textPrimary }}>{email}</strong>, we&apos;ve sent password reset instructions.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: cooldown > 0 ? (isLight ? '#F1F5F9' : '#001424') : tokens.accentSoft,
                  color: cooldown > 0 ? tokens.textMuted : '#00A581',
                  border: `1px solid ${cooldown > 0 ? tokens.surfaceBorder : tokens.accentBorder}`,
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>{cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Reset Email'}</span>
              </button>

              <Link
                href="/login"
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: tokens.textSecondary, marginBottom: '6px' }}>
                Business Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '10px',
                    color: tokens.textPrimary,
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
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
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '6px',
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isLoading ? 'Sending Instructions...' : 'Send Reset Link'}</span>
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
