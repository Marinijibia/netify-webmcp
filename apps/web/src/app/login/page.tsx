'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Zap,
  ArrowLeft,
  Fingerprint,
  Camera,
  Laptop
} from 'lucide-react';
import { WebBiometricService, ComputerBiometricCapabilities } from '@/lib/biometrics';
import WebFaceRecognitionScanner from '@/components/WebFaceRecognitionScanner';
import WebFingerprintModal from '@/components/WebFingerprintModal';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithBiometrics } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t, currentLanguageInfo, openLanguageModal } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computer Biometric State
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [capabilities, setCapabilities] = useState<ComputerBiometricCapabilities>({
    hasPlatformAuthenticator: false,
    hasWebcam: false,
    isFingerprintEnabled: false,
    isFaceEnabled: false,
    rememberedEmail: null,
  });

  useEffect(() => {
    async function loadCapabilities() {
      try {
        const caps = await WebBiometricService.getCapabilities();
        setCapabilities(caps);
        if (caps.rememberedEmail) {
          setEmail(caps.rememberedEmail);
        }
      } catch (err) {
        console.warn('Could not inspect computer biometrics:', err);
      }
    }
    loadCapabilities();
  }, []);

  const handleBiometricSuccess = async () => {
    setIsFingerprintModalOpen(false);
    setIsFaceModalOpen(false);
    try {
      await loginWithBiometrics(email || capabilities.rememberedEmail || undefined);
    } catch (err: any) {
      setError(err?.message || 'Biometric verification passed, but session unlock failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      if (err?.message?.includes('EMAIL_NOT_VERIFIED') || err?.message?.includes('verify your email')) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err?.message || 'Login failed. Please check your credentials or register a new account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('merchant@netify.ng');
    setPassword('Password123!');
  };

  return (
    <div className="responsive-auth-grid" style={{
      minHeight: '100vh',
      backgroundColor: tokens.background,
      position: 'relative',
    }}>
      {/* Left Brand & Social Proof Showcase Panel */}
      <div className="auth-showcase-panel" style={{
        backgroundColor: isLight ? '#F8FAFC' : '#001D31',
        borderRight: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(40px, 5vw, 60px) clamp(24px, 4vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0, 165, 129, 0.18), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div>
          {/* Top Logo Link */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/logo-icon.png"
              alt="Netify Logo"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                objectFit: 'contain',
                boxShadow: '0 0 20px rgba(0, 165, 129, 0.4)',
              }}
            />
            <div>
              <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: tokens.textPrimary }}>NETIFY</span>
              <span style={{ fontSize: '11px', color: '#00A581', marginLeft: '6px', fontWeight: 'bold' }}>WebMCP</span>
            </div>
          </Link>

          <div style={{ marginTop: '64px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              padding: '4px 12px',
              borderRadius: '20px',
              color: '#00A581',
              fontSize: '11px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}>
              <Sparkles size={12} />
              <span>The WebMCP Challenge Submission</span>
            </div>

            <h2 style={{ fontSize: '32px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-1px', lineHeight: '1.2' }}>
              Welcome back to your collections command center.
            </h2>
            <p style={{ color: tokens.textSecondary, fontSize: '15px', lineHeight: '1.6', marginTop: '12px' }}>
              Access your grounded ledger, monitor promises due today, and draft respectful reminders with human authorization.
            </p>
          </div>
        </div>

        {/* Testimonial Quote */}
        <div style={{
          backgroundColor: isLight ? '#FFFFFF' : '#00253E',
          borderRadius: '16px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          padding: '24px',
          marginTop: '40px',
        }}>
          <p style={{ color: tokens.textPrimary, fontSize: '13.5px', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>
            "Netify helped us track ₦4.2M in overdue flour receivables across Kano bakeries in our first month. The WhatsApp promise schedule removed all friction."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#00A581', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', color: '#FFFFFF' }}>
              AM
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>Alhaji Musa</div>
              <div style={{ fontSize: '11px', color: tokens.textMuted }}>Grain Distributor • Dawanau Market Kano</div>
            </div>
          </div>
        </div>

        {/* Security Footer Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.textMuted, fontSize: '12px', marginTop: '32px' }}>
          <ShieldCheck size={16} color="#00A581" />
          <span>Encrypted with TLS 1.3 & PostgreSQL Tenant Isolation</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(56px, 8vw, 80px) clamp(16px, 4vw, 36px)',
        position: 'relative',
        backgroundColor: tokens.background,
        transition: 'all 0.2s ease',
      }}>
        {/* Back to Homepage Button */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: tokens.textSecondary,
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Card Title & Pre-Login Language Switcher */}
          <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
                {t('auth.welcomeBack')}
              </h1>
              <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px' }}>
                {t('auth.tagline')}
              </p>
            </div>
            <button
              type="button"
              onClick={openLanguageModal}
              title="Change Language"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.85)',
                border: `1px solid ${tokens.surfaceBorder}`,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: isLight ? tokens.shadowCard : 'none',
              }}
            >
              <span>{currentLanguageInfo.flag}</span>
              <span style={{ color: '#00A581' }}>{currentLanguageInfo.code.toUpperCase()}</span>
              <span style={{ fontSize: '9px', color: '#00A581' }}>▼</span>
            </button>
          </div>

          {/* Quick Demo Credentials Fill Card for Judges */}
          <div style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.accentBorder}`,
            borderRadius: '14px',
            padding: '16px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: isLight ? tokens.shadowCard : '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 165, 129, 0.08)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#00A581" />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>
                    Hackathon Judge Fast-Track
                  </span>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)',
                  color: isLight ? '#B45309' : '#FCD34D',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.3)'}`,
                  letterSpacing: '0.2px',
                }}>
                  To be removed after judging
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: tokens.textMuted, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Pre-fills seeded merchant account</span>
                <code style={{
                  backgroundColor: isLight ? '#F1F5F9' : '#00192B',
                  color: '#00A581',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  fontWeight: '600',
                }}>
                  (merchant@netify.ng)
                </code>
              </div>
            </div>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="hover-lift tap-press"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={13} />
              <span>Fill Demo Login</span>
            </button>
          </div>

          {/* Computer Biometric Quick Sign-In Card */}
          <div style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Laptop size={15} color="#00A581" />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Computer Biometric Sign-In
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#00A581', fontWeight: '600' }}>
                {capabilities.hasPlatformAuthenticator ? 'Windows Hello / Touch ID Ready' : 'Biometrics Active'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {/* Fingerprint / Touch ID Button */}
              <button
                type="button"
                onClick={() => setIsFingerprintModalOpen(true)}
                className="hover-lift tap-press"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: tokens.accentSoft,
                  border: '1px solid #00A581',
                  color: '#00A581',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Fingerprint size={17} color="#00A581" />
                <span>Touch ID / Fingerprint</span>
              </button>

              {/* Camera Face ID Button */}
              <button
                type="button"
                onClick={() => setIsFaceModalOpen(true)}
                className="hover-lift tap-press"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.8)',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Camera size={17} color="#00A581" />
                <span>Face Camera Scan</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: isLight ? '#B91C1C' : '#FCA5A5',
              fontSize: '13px',
            }}>
              <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px', textTransform: 'uppercase' }}>
                {t('auth.emailOrPhone')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
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
                    transition: 'border-color 0.15s ease',
                  }}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: tokens.textPrimary, textTransform: 'uppercase' }}>
                  {t('auth.password')}
                </label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '12px', color: '#00A581', fontWeight: '600', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={tokens.textMuted} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
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
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#00A581',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '13px', color: tokens.textSecondary, cursor: 'pointer' }}>
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="hover-lift tap-press"
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
                fontSize: '14.5px',
                fontWeight: 'bold',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(0, 165, 129, 0.4)',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '6px',
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isSubmitting ? 'Authenticating...' : t('auth.loginButton')}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Bottom Switch to Register */}
          <div style={{ textAlign: 'center', marginTop: '32px', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '20px', fontSize: '13.5px', color: tokens.textSecondary }}>
            <span>{t('auth.registerPrompt')} </span>
            <Link href="/register" style={{ color: '#00A581', fontWeight: 'bold', textDecoration: 'none' }}>
              {t('auth.signUp')}
            </Link>
          </div>
        </div>
      </div>

      {/* Computer Biometric Modals */}
      <WebFingerprintModal
        isOpen={isFingerprintModalOpen}
        email={email || capabilities.rememberedEmail || undefined}
        onSuccess={handleBiometricSuccess}
        onClose={() => setIsFingerprintModalOpen(false)}
      />

      <WebFaceRecognitionScanner
        isOpen={isFaceModalOpen}
        onSuccess={handleBiometricSuccess}
        onClose={() => setIsFaceModalOpen(false)}
      />
    </div>
  );
}
