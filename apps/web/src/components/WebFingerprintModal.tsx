'use client';

import React, { useState, useEffect } from 'react';
import { X, Fingerprint, CheckCircle, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { WebBiometricService } from '@/lib/biometrics';
import { useTheme } from '@/lib/theme/theme-context';

interface WebFingerprintModalProps {
  isOpen: boolean;
  email?: string;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function WebFingerprintModal({
  isOpen,
  email,
  onSuccess,
  onClose,
  title = 'Hardware Fingerprint Verification',
  subtitle = 'Touch your device fingerprint sensor or Windows Hello to sign in',
}: WebFingerprintModalProps) {
  const { tokens, isLight } = useTheme();
  const [stage, setStage] = useState<'PROMPTING' | 'VERIFIED' | 'FAILED'>('PROMPTING');
  const [statusMessage, setStatusMessage] = useState('Awaiting fingerprint touch...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const triggerVerification = async () => {
    setStage('PROMPTING');
    setErrorMessage(null);
    setIsVerifying(true);
    setStatusMessage('Touch your computer fingerprint sensor or confirm Windows Hello...');

    try {
      const result = await WebBiometricService.authenticateWithFingerprint(email);
      if (result.success) {
        setStage('VERIFIED');
        setStatusMessage('Fingerprint verified! Unlocking workspace...');
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setStage('FAILED');
        setErrorMessage(result.error || 'Fingerprint verification failed.');
        setStatusMessage('Authentication could not be completed.');
      }
    } catch (err: any) {
      setStage('FAILED');
      setErrorMessage(err?.message || 'Biometric hardware communication error.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setStage('PROMPTING');
      setErrorMessage(null);
      return;
    }

    triggerVerification();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 16, 28, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            padding: '18px 24px',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLight ? '#F8FAFC' : '#00253F',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: tokens.accentSoft,
                border: '1px solid #00A581',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Fingerprint size={20} color="#00A581" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary }}>{title}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.textSecondary }}>{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: tokens.textSecondary,
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Animated Fingerprint Graphic */}
        <div
          style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            margin: '32px 0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer Ripple Rings */}
          <div
            style={{
              position: 'absolute',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              border: `2px solid ${
                stage === 'VERIFIED'
                  ? 'rgba(0, 165, 129, 0.4)'
                  : stage === 'FAILED'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(0, 165, 129, 0.2)'
              }`,
              animation: stage === 'PROMPTING' ? 'pulse 2s infinite' : 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              border: `2px solid ${
                stage === 'VERIFIED'
                  ? 'rgba(0, 165, 129, 0.6)'
                  : stage === 'FAILED'
                  ? 'rgba(239, 68, 68, 0.5)'
                  : 'rgba(0, 165, 129, 0.35)'
              }`,
            }}
          />

          {/* Core Fingerprint Sensor Target */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor:
                stage === 'VERIFIED'
                  ? tokens.accentSoft
                  : stage === 'FAILED'
                  ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)')
                  : (isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.9)'),
              border: `2px solid ${
                stage === 'VERIFIED' ? '#00A581' : stage === 'FAILED' ? '#EF4444' : tokens.surfaceBorder
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 30px ${
                stage === 'VERIFIED'
                  ? 'rgba(0, 165, 129, 0.4)'
                  : stage === 'FAILED'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(0, 165, 129, 0.15)'
              }`,
              transition: 'all 0.3s ease',
            }}
          >
            {stage === 'VERIFIED' ? (
              <CheckCircle size={46} color="#00A581" />
            ) : (
              <Fingerprint
                size={48}
                color={stage === 'FAILED' ? '#EF4444' : '#00A581'}
              />
            )}
          </div>
        </div>

        {/* Status Message & Buttons */}
        <div style={{ padding: '0 24px 24px', textAlign: 'center', width: '100%' }}>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '14px',
              fontWeight: '600',
              color: stage === 'VERIFIED' ? '#00A581' : stage === 'FAILED' ? '#EF4444' : tokens.textPrimary,
            }}
          >
            {statusMessage}
          </p>

          {errorMessage && (
            <div
              style={{
                backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '8px 14px',
                borderRadius: '8px',
                color: isLight ? '#B91C1C' : '#FCA5A5',
                fontSize: '12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          {stage === 'FAILED' && (
            <button
              type="button"
              onClick={triggerVerification}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              <RefreshCw size={14} />
              <span>Scan Again</span>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '12px',
              fontSize: '11.5px',
              color: tokens.textMuted,
            }}
          >
            <Shield size={12} color="#00A581" />
            <span>FIDO2 / WebAuthn Hardware Authenticator (TPM Protected)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
