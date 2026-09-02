'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { authApi } from '@/lib/api/auth';

function ResetPasswordForm() {
  const { tokens, isLight } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const strengthScore = [hasMinLength, hasNumber, hasSpecial, hasUpper].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!token) {
      setError('Reset token is missing or expired. Please request a new password reset link.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired password reset token. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px', margin: 0 }}>
          Create New Password
        </h1>
        <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5' }}>
          Please choose a strong password to secure your account.
        </p>
      </div>

      {/* Error Banner */}
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

      {isSuccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.12)',
            border: `1px solid ${tokens.accentBorder}`,
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <CheckCircle2 size={40} color="#00A581" />
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary }}>
              Password Reset Complete!
            </div>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, margin: 0 }}>
              Your password has been successfully updated. Redirecting you to sign in...
            </p>
          </div>

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
            Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: tokens.textSecondary, marginBottom: '6px' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '10px',
                  color: tokens.textPrimary,
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: tokens.textMuted,
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength Meter */}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        backgroundColor: step <= strengthScore 
                          ? (strengthScore >= 3 ? '#00A581' : strengthScore === 2 ? '#F59E0B' : '#EF4444')
                          : (isLight ? '#E2E8F0' : '#001424'),
                        borderRadius: '2px',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: tokens.textSecondary, marginTop: '4px' }}>
                  {strengthScore >= 3 ? 'Strong password' : strengthScore === 2 ? 'Medium strength' : 'Weak password'}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: tokens.textSecondary, marginBottom: '6px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
            <span>{isLoading ? 'Updating Password...' : 'Reset Password'}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const { tokens } = useTheme();

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

      <Suspense fallback={<Loader2 size={36} className="animate-spin text-teal-500" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
