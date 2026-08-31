'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { authApi } from '@/lib/api/auth';
import { WebStorageService } from '@/lib/api/storage';

function VerifyEmailForm() {
  const { tokens, isLight } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleCodeChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('').trim();
    if (!email) {
      setError('Please provide your account email address.');
      return;
    }
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authApi.verifyEmail({ email: email.trim().toLowerCase(), code: fullCode });
      const data = ((res.data as any)?.data || res.data);
      if (data?.tokens) {
        WebStorageService.setAccessToken(data.tokens.accessToken);
        WebStorageService.setRefreshToken(data.tokens.refreshToken);
      }
      setIsVerified(true);
      setTimeout(() => {
        router.push('/workspace');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email to resend the code.');
      return;
    }
    setResendCountdown(60);
    setResendSuccess(false);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.app.netify.ng/api/v1';
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        setResendSuccess(true);
      }
    } catch (e) {
      console.error('Failed to resend code:', e);
    }

    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
        maxWidth: '460px',
        backgroundColor: tokens.surface,
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: '40px 32px',
        boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        {/* Back to Sign In */}
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
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: tokens.accentSoft,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00A581',
            marginBottom: '16px',
          }}>
            <Mail size={24} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            Verify Your Email
          </h1>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5' }}>
            We've sent a 6-digit confirmation code to {email ? <strong style={{ color: tokens.textPrimary }}>{email}</strong> : 'your email'}. Enter it below to activate your organization workspace.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {resendSuccess && (
          <div style={{
            backgroundColor: tokens.accentSoft,
            border: '1px solid #00A581',
            color: '#00A581',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>New 6-digit code has been sent to your email.</span>
          </div>
        )}

        {isVerified ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: tokens.accentSoft,
              border: '1px solid #00A581',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: tokens.textSecondary,
              fontSize: '14px',
            }}>
              <CheckCircle2 size={24} color="#00A581" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: tokens.textPrimary, display: 'block' }}>Email Verified Successfully!</strong>
                Your workspace is ready. Redirecting you now...
              </div>
            </div>

            <Link
              href="/workspace"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '14px',
                borderRadius: '10px',
                fontSize: '14.5px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(0, 165, 129, 0.4)',
              }}
            >
              <span>Enter Collections Workspace</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Email field if not provided in URL */}
            {!emailParam && (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.ng"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    color: tokens.textPrimary,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* 6 Digit Input Group */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  id={`code-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: '46px',
                    height: '52px',
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '10px',
                    color: tokens.textPrimary,
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Submit Button */}
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
              <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
              {!isLoading && <ArrowRight size={16} />}
            </button>

            {/* Resend Code Section */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: tokens.textSecondary }}>
              <span>Didn't receive the code? </span>
              {resendCountdown > 0 ? (
                <span style={{ color: '#00A581' }}>Resend in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#00A581',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="#00A581" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
