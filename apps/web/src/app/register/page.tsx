'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Lock, 
  Mail, 
  User, 
  Building, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Globe, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowLeft 
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

export default function RegisterPage() {
  const { register } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t, currentLanguageInfo, openLanguageModal } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: '',
    currency: 'NGN',
    country: 'NG',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.organizationName) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms of service and privacy policy to continue.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register(formData);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      backgroundColor: tokens.background,
      position: 'relative',
    }}>
      {/* Left Brand & Social Proof Panel */}
      <div style={{
        backgroundColor: isLight ? '#F8FAFC' : '#001D31',
        borderRight: `1px solid ${tokens.surfaceBorder}`,
        padding: '60px 48px',
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
          {/* Logo */}
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

          <div style={{ marginTop: '56px' }}>
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
              <span>Free Starter Workspace Included</span>
            </div>

            <h2 style={{ fontSize: '32px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-1px', lineHeight: '1.2' }}>
              Turn informal trade debt into predictable cash flow.
            </h2>
            <p style={{ color: tokens.textSecondary, fontSize: '15px', lineHeight: '1.6', marginTop: '12px' }}>
              Set up your organization workspace in less than 2 minutes. No credit card required.
            </p>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: tokens.textSecondary, fontSize: '13.5px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: tokens.accentSoft, border: `1px solid ${tokens.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581' }}>
                  <Check size={13} />
                </div>
                <span>Free forever tier for up to 25 active customer accounts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: tokens.textSecondary, fontSize: '13.5px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: tokens.accentSoft, border: `1px solid ${tokens.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581' }}>
                  <Check size={13} />
                </div>
                <span>WhatsApp and verbal promise schedule logs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: tokens.textSecondary, fontSize: '13.5px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: tokens.accentSoft, border: `1px solid ${tokens.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581' }}>
                  <Check size={13} />
                </div>
                <span>8 live registered WebMCP autonomous agent tools</span>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Quote */}
        <div style={{
          backgroundColor: isLight ? '#FFFFFF' : '#00253E',
          borderRadius: '16px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          padding: '24px',
          marginTop: '36px',
        }}>
          <p style={{ color: tokens.textPrimary, fontSize: '13px', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>
            "We supply fashion boutiques across East Africa via bus parcels. The AI drafts respectful M-Pesa reminders that keep money moving without damaging supplier trust."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#00A581', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#FFFFFF' }}>
              GW
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: tokens.textPrimary }}>Grace Wanjiku</div>
              <div style={{ fontSize: '11px', color: tokens.textMuted }}>Textile Importer • Nairobi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 24px',
        position: 'relative',
        backgroundColor: tokens.background,
        transition: 'all 0.2s ease',
      }}>
        {/* Back to Homepage Button */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
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

        <div style={{ width: '100%', maxWidth: '480px' }}>
          {/* Card Title & Pre-Register Language Switcher */}
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
                Create Organization Workspace
              </h1>
              <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px' }}>
                Start collecting trade receivables with grounded business memory.
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* First Name & Last Name in 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px', textTransform: 'uppercase' }}>
                  First Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Musa"
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 36px',
                      backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      borderRadius: '8px',
                      color: tokens.textPrimary,
                      fontSize: '13px',
                      outline: 'none',
                      boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ibrahim"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px', textTransform: 'uppercase' }}>
                {t('auth.emailOrPhone')} *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="musa@kanograins.com"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  }}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px', textTransform: 'uppercase' }}>
                {t('auth.password')} *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 36px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
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
                    top: '11px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: tokens.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Organization Name */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px', textTransform: 'uppercase' }}>
                Trading Organization Name *
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="Kano Wholesale Grains Depot"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  }}
                  required
                />
              </div>
            </div>

            {/* Currency & Country in 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Primary Currency *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  }}
                >
                  <option value="NGN">₦ Nigerian Naira (NGN)</option>
                  <option value="KES">KSh Kenyan Shilling (KES)</option>
                  <option value="GHS">GH₵ Ghanaian Cedi (GHS)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Operating Country *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  }}
                >
                  <option value="NG">🇳🇬 Nigeria</option>
                  <option value="KE">🇰🇪 Kenya</option>
                  <option value="GH">🇬🇭 Ghana</option>
                  <option value="UG">🇺🇬 Uganda</option>
                  <option value="TZ">🇹🇿 Tanzania</option>
                  <option value="ZA">🇿🇦 South Africa</option>
                  <option value="OTHER">Other African Market</option>
                </select>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#00A581',
                  marginTop: '2px',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="terms" style={{ fontSize: '12.5px', color: tokens.textSecondary, lineHeight: '1.5', cursor: 'pointer' }}>
                I agree to the <Link href="/terms" target="_blank" style={{ color: '#00A581' }}>Terms of Service</Link> and <Link href="/privacy" target="_blank" style={{ color: '#00A581' }}>Privacy Policy</Link>.
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
                padding: '13px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(0, 165, 129, 0.4)',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '8px',
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isSubmitting ? 'Creating Workspace...' : 'Create Free Organization'}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Bottom Switch to Login */}
          <div style={{ textAlign: 'center', marginTop: '24px', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '16px', fontSize: '13px', color: tokens.textSecondary }}>
            <span>Already have an account? </span>
            <Link href="/login" style={{ color: '#00A581', fontWeight: 'bold', textDecoration: 'none' }}>
              {t('auth.loginButton')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
