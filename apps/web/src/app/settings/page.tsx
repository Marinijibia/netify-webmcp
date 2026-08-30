'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Settings, 
  Globe, 
  Sparkles, 
  Building, 
  Check, 
  User, 
  ShieldCheck,
  Fingerprint,
  Camera,
  CheckCircle2,
  Trash2,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { WebBiometricService, ComputerBiometricCapabilities } from '@/lib/biometrics';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';
import WebFaceRecognitionScanner from '@/components/WebFaceRecognitionScanner';

export default function SettingsPage() {
  const { user, organization } = useAuth();
  const { theme, resolvedTheme, setTheme, tokens, isLight } = useTheme();
  const { t, currentLanguage, currentLanguageInfo, setLanguage, openLanguageModal } = useLanguage();
  const [currency, setCurrency] = useState(organization?.currency || 'NGN');
  const [saved, setSaved] = useState(false);

  // Biometrics State
  const [capabilities, setCapabilities] = useState<ComputerBiometricCapabilities>({
    hasPlatformAuthenticator: false,
    hasWebcam: false,
    isFingerprintEnabled: false,
    isFaceEnabled: false,
    rememberedEmail: null,
  });
  const [isFaceEnrollModalOpen, setIsFaceEnrollModalOpen] = useState(false);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCapabilities() {
      const caps = await WebBiometricService.getCapabilities();
      setCapabilities(caps);
    }
    loadCapabilities();
  }, []);

  const handleToggleFingerprint = async (enabled: boolean) => {
    if (enabled && user?.email) {
      const res = await WebBiometricService.enrollPlatformAuthenticator(user.email);
      if (res.success) {
        setCapabilities((prev) => ({ ...prev, isFingerprintEnabled: true }));
        setEnrollSuccessMsg('Windows Hello / Touch ID enabled on this computer!');
        setTimeout(() => setEnrollSuccessMsg(null), 3000);
      }
    } else {
      WebBiometricService.setFingerprintEnabled(false);
      setCapabilities((prev) => ({ ...prev, isFingerprintEnabled: false }));
    }
  };

  const handleToggleFace = (enabled: boolean) => {
    if (enabled) {
      setIsFaceEnrollModalOpen(true);
    } else {
      WebBiometricService.setFaceEnabled(false);
      setCapabilities((prev) => ({ ...prev, isFaceEnabled: false }));
    }
  };

  const handleFaceEnrollSuccess = () => {
    setIsFaceEnrollModalOpen(false);
    WebBiometricService.setFaceEnabled(true);
    setCapabilities((prev) => ({ ...prev, isFaceEnabled: true }));
    setEnrollSuccessMsg('Computer camera face recognition successfully enrolled!');
    setTimeout(() => setEnrollSuccessMsg(null), 3000);
  };

  const handleClearBiometrics = () => {
    WebBiometricService.clearBiometricVault();
    setCapabilities((prev) => ({
      ...prev,
      isFingerprintEnabled: false,
      isFaceEnabled: false,
      rememberedEmail: null,
    }));
    setEnrollSuccessMsg('Biometric credentials cleared from this computer.');
    setTimeout(() => setEnrollSuccessMsg(null), 3000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={24} color="#00A581" />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
            Settings & Workspace Preferences
          </h2>
        </div>
        <p style={{ color: tokens.textMuted, fontSize: '13px', marginTop: '6px' }}>
          Manage your display theme, multi-currency settings, computer biometrics, and AI provider integrations.
        </p>
      </div>

      {/* 1. Appearance & Theme Section */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={18} color="#00A581" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
              Appearance & Display Theme
            </h3>
          </div>
          <span style={{
            fontSize: '11.5px',
            color: '#00A581',
            backgroundColor: tokens.accentSoft,
            padding: '3px 10px',
            borderRadius: '12px',
            border: `1px solid ${tokens.accentBorder}`,
            fontWeight: '700',
          }}>
            Active: {theme.toUpperCase()} ({resolvedTheme})
          </span>
        </div>
        <p style={{ fontSize: '13px', color: tokens.textMuted, margin: 0 }}>
          Customize the visual appearance of your Netify Workspace. Choose between high-contrast Light mode, signature Dark mode, or automatically match your computer system.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { id: 'light', label: 'Light Mode', desc: 'Crisp slate white & navy', icon: Sun },
            { id: 'dark', label: 'Dark Mode', desc: 'Signature deep navy & teal', icon: Moon },
            { id: 'system', label: 'System Default', desc: 'Syncs with OS preference', icon: Monitor },
          ].map((t) => {
            const isSelected = theme === t.id;
            const Icon = t.icon;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected 
                    ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.15)') 
                    : (isLight ? '#F8FAFC' : '#001D31'),
                  border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected && isLight ? '0 2px 8px rgba(0, 165, 129, 0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Icon size={18} color={isSelected ? '#00A581' : tokens.textMuted} />
                  {isSelected && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00A581' }} />
                  )}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: isSelected ? tokens.textPrimary : tokens.textSecondary }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '11.5px', color: tokens.textMuted, marginTop: '2px' }}>
                  {t.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. App & AI Language Section */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#00A581" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
              {t('settings.appLanguage')}
            </h3>
          </div>
          <button
            type="button"
            onClick={openLanguageModal}
            style={{
              fontSize: '12px',
              color: '#00A581',
              backgroundColor: tokens.accentSoft,
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1px solid ${tokens.accentBorder}`,
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{currentLanguageInfo.flag}</span>
            <span>{currentLanguageInfo.name} ({currentLanguageInfo.nativeName})</span>
            <span>▼</span>
          </button>
        </div>
        <p style={{ fontSize: '13px', color: tokens.textMuted, margin: 0 }}>
          Choose your primary commerce language for the user interface, Copilot voice interaction, and customer communication drafts.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected 
                    ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.15)') 
                    : (isLight ? '#F8FAFC' : '#001D31'),
                  border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: isSelected ? '#00A581' : tokens.textPrimary }}>
                    {lang.name}
                  </div>
                  <div style={{ fontSize: '11px', color: tokens.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lang.nativeName}
                  </div>
                </div>
                {isSelected && <Check size={16} color="#00A581" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Organization Profile */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
            Organization Profile
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: tokens.textMuted, fontWeight: 'bold', textTransform: 'uppercase' }}>
              Organization Name
            </label>
            <input
              type="text"
              readOnly
              value={organization?.name || 'Workspace Account'}
              style={{
                width: '100%',
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: tokens.textPrimary,
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: tokens.textMuted, fontWeight: 'bold', textTransform: 'uppercase' }}>
              Your Role & Slug
            </label>
            <input
              type="text"
              readOnly
              value={`${organization?.role || 'OWNER'} (${organization?.slug || 'workspace'})`}
              style={{
                width: '100%',
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: tokens.textPrimary,
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. User Account */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
            User Account
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: tokens.textMuted, fontWeight: 'bold', textTransform: 'uppercase' }}>
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              style={{
                width: '100%',
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: tokens.textPrimary,
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: tokens.textMuted, fontWeight: 'bold', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <input
              type="text"
              readOnly
              value={user?.email || '—'}
              style={{
                width: '100%',
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: tokens.textPrimary,
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Multi-Currency Configuration */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
            Base Operating Currency
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: tokens.textMuted, margin: 0 }}>
          Select the base currency for debtor ledgers, invoices, and risk exposure thresholds.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { code: 'NGN', name: 'Nigerian Naira (₦)' },
            { code: 'KES', name: 'Kenyan Shilling (KSh)' },
            { code: 'GHS', name: 'Ghanaian Cedi (GH₵)' },
            { code: 'USD', name: 'US Dollar ($)' },
            { code: 'ZAR', name: 'South African Rand (R)' },
            { code: 'GBP', name: 'British Pound (£)' },
          ].map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrency(c.code)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: currency === c.code 
                  ? (isLight ? '#F0FDF4' : '#00A581') 
                  : (isLight ? '#F8FAFC' : '#001D31'),
                border: `1px solid ${currency === c.code ? '#00A581' : tokens.surfaceBorder}`,
                color: currency === c.code 
                  ? (isLight ? '#00A581' : '#FFFFFF') 
                  : tokens.textPrimary,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.code}</div>
              <div style={{ fontSize: '11px', color: tokens.textMuted }}>{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Computer Biometrics & Camera Security */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={20} color="#00A581" />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
                Computer Biometrics & Camera Security
              </h3>
            </div>
            <p style={{ color: tokens.textMuted, fontSize: '12.5px', margin: '4px 0 0' }}>
              Fast, password-free login using your computer's built-in fingerprint sensor and webcam.
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: tokens.accentSoft,
            border: `1px solid ${tokens.accentBorder}`,
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            color: '#00A581',
            fontWeight: '600',
          }}>
            <ShieldCheck size={13} />
            <span>FIDO2 / WebAuthn Standards</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {enrollSuccessMsg && (
          <div style={{
            backgroundColor: tokens.accentSoft,
            border: '1px solid #00A581',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#00A581',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={16} />
            <span>{enrollSuccessMsg}</span>
          </div>
        )}

        {/* Hardware Capabilities Diagnostic Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: capabilities.hasPlatformAuthenticator ? tokens.accentSoft : (isLight ? '#F1F5F9' : 'rgba(15, 84, 112, 0.3)'),
              border: `1px solid ${capabilities.hasPlatformAuthenticator ? '#00A581' : tokens.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Fingerprint size={18} color={capabilities.hasPlatformAuthenticator ? '#00A581' : tokens.textMuted} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>Platform Fingerprint</div>
              <div style={{ fontSize: '11.5px', color: capabilities.hasPlatformAuthenticator ? '#00A581' : tokens.textMuted }}>
                {capabilities.hasPlatformAuthenticator ? 'Windows Hello / Touch ID Ready' : 'Hardware Not Detected'}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: capabilities.hasWebcam ? tokens.accentSoft : (isLight ? '#F1F5F9' : 'rgba(15, 84, 112, 0.3)'),
              border: `1px solid ${capabilities.hasWebcam ? '#00A581' : tokens.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Camera size={18} color={capabilities.hasWebcam ? '#00A581' : tokens.textMuted} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>Computer Camera</div>
              <div style={{ fontSize: '11.5px', color: capabilities.hasWebcam ? '#00A581' : tokens.textMuted }}>
                {capabilities.hasWebcam ? 'Webcam Ready for Face ID' : 'Webcam Standby'}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Fingerprint Toggle */}
          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px 16px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: tokens.textPrimary }}>
                Windows Hello / Touch ID Fingerprint Sign-In
              </div>
              <div style={{ fontSize: '11.5px', color: tokens.textMuted, marginTop: '2px' }}>
                Authenticate with your computer's fingerprint scanner instead of typing passwords.
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={capabilities.isFingerprintEnabled}
                onChange={(e) => handleToggleFingerprint(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#00A581', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Camera Face ID Toggle */}
          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px 16px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: tokens.textPrimary }}>
                Computer Camera Face Recognition
              </div>
              <div style={{ fontSize: '11.5px', color: tokens.textMuted, marginTop: '2px' }}>
                Use your webcam to sign in with 3D facial nodal vector recognition.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsFaceEnrollModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: tokens.accentSoft,
                  border: `1px solid ${tokens.accentBorder}`,
                  color: '#00A581',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Camera size={13} />
                <span>Test / Enroll Face</span>
              </button>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={capabilities.isFaceEnabled}
                  onChange={(e) => handleToggleFace(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#00A581', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Clear Credentials Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={handleClearBiometrics}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: tokens.textMuted,
              fontSize: '11.5px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
            <span>Clear Stored Biometrics on This PC</span>
          </button>
        </div>
      </div>

      {/* 6. AI Provider & WebMCP Integration */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
            AI Provider & WebMCP Integration
          </h3>
        </div>
        <div style={{
          backgroundColor: isLight ? '#F8FAFC' : '#001D31',
          borderRadius: '8px',
          padding: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          fontSize: '13px',
          color: tokens.textPrimary,
        }}>
          <div><strong>WebMCP Standard:</strong> W3C / Chrome Native (<code style={{ color: '#00A581' }}>document.modelContext</code>)</div>
          <div style={{ marginTop: '6px', color: tokens.textMuted, fontSize: '12px' }}>
            Backend automatically routes to Google Gemini or OpenAI GPT models based on server configuration.
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          style={{
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 165, 129, 0.3)',
          }}
        >
          {saved ? <Check size={16} /> : null}
          <span>{saved ? 'Preferences Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Face ID Test / Enrollment Modal */}
      <WebFaceRecognitionScanner
        isOpen={isFaceEnrollModalOpen}
        onSuccess={handleFaceEnrollSuccess}
        onClose={() => setIsFaceEnrollModalOpen(false)}
        title="Enroll Camera Face Recognition"
        subtitle="Hold steady in front of your computer webcam to register face biometrics"
        isEnrollment={true}
      />
    </div>
  );
}
