'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export default function ResetPasswordPage() {
  const { tokens, isLight } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simple password strength calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 800);
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
            <Lock size={20} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            Set New Password
          </h1>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px' }}>
            Create a secure password for your organization account.
          </p>
        </div>

        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: tokens.accentSoft,
              border: '1px solid #00A581',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: tokens.textSecondary,
              fontSize: '14px',
              lineHeight: '1.5',
            }}>
              <CheckCircle2 size={22} color="#00A581" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: tokens.textPrimary, display: 'block', marginBottom: '4px' }}>Password Successfully Updated</strong>
                Your new password is now active. You can now sign in to your collections workspace.
              </div>
            </div>

            <Link
              href="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '13px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(0, 165, 129, 0.35)',
              }}
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div style={{
                backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: isLight ? '#B91C1C' : '#FCA5A5',
              }}>
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px', textTransform: 'uppercase' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: tokens.textMuted,
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', height: '4px', marginBottom: '6px' }}>
                    <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strengthScore >= 1 ? '#EF4444' : (isLight ? '#E2E8F0' : '#0F5470') }} />
                    <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strengthScore >= 2 ? '#F59E0B' : (isLight ? '#E2E8F0' : '#0F5470') }} />
                    <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strengthScore >= 3 ? '#00A581' : (isLight ? '#E2E8F0' : '#0F5470') }} />
                  </div>
                  <div style={{ fontSize: '11px', color: strengthScore === 3 ? '#00A581' : strengthScore === 2 ? '#F59E0B' : '#EF4444' }}>
                    {strengthScore === 3 ? 'Strong password' : strengthScore === 2 ? 'Medium strength (add special character)' : 'Weak (min. 8 chars, numbers & symbols)'}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px', textTransform: 'uppercase' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
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
              <span>{isLoading ? 'Updating Password...' : 'Save New Password'}</span>
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
