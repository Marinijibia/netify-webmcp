'use client';

import React from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';
import { X, Check, Globe, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

export default function LanguageSelectorModal() {
  const { isLanguageModalOpen, closeLanguageModal, currentLanguage, currentLanguageInfo, setLanguage } = useLanguage();
  const { tokens, isLight } = useTheme();

  if (!isLanguageModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 16, 28, 0.82)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={closeLanguageModal}
    >
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: isLight ? '#F8FAFC' : '#00253F',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '11px',
                backgroundColor: tokens.accentSoft,
                border: '1px solid #00A581',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '24px', lineHeight: 1 }}>{currentLanguageInfo.flag}</span>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary }}>
                Select Business Language
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: tokens.textSecondary }}>
                Harshe • Èdè • Asụsụ • Fulfulde • Pidgin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLanguageModal}
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

        {/* Language Grid */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#00253F'),
                  border: `1px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isLight && !isSelected ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '24px' }}>{lang.flag}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isSelected ? 'bold' : '600',
                          color: isSelected ? '#00A581' : tokens.textPrimary,
                        }}
                      >
                        {lang.nativeName}
                      </span>
                      <span style={{ fontSize: '12px', color: tokens.textMuted }}>({lang.name})</span>
                    </div>

                    <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: tokens.textSecondary }}>
                      Greeting: <span style={{ color: tokens.textPrimary, fontStyle: 'italic', fontWeight: '500' }}>"{lang.greeting}"</span> • "{lang.samplePrompt}"
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                    backgroundColor: isSelected ? '#00A581' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: `1px solid ${tokens.surfaceBorder}`,
            backgroundColor: isLight ? '#F8FAFC' : '#00253F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#00A581" />
            <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
              Tailored for Nigerian & West African multi-lingual commerce
            </span>
          </div>

          <button
            type="button"
            onClick={closeLanguageModal}
            style={{
              padding: '6px 14px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
