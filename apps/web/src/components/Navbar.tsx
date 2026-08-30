'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, Bell, Plus, Sun, Moon, Mic, Radio } from 'lucide-react';
import { notificationApi } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/lib/theme/theme-context';
import LiveVoiceAssistantModal from './LiveVoiceAssistantModal';

export function Navbar() {
  const pathname = usePathname();
  const { user, organization, isAuthenticated } = useAuth();
  const { currentLanguageInfo, openLanguageModal, t } = useLanguage();
  const { tokens, isLight, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getUnreadCount().then(setUnreadCount).catch(() => {});
    }
  }, [isAuthenticated, pathname]);

  // Hide navbar on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.firstName ? user.firstName[0].toUpperCase() : 'U');

  return (
    <header style={{
      height: '68px',
      borderBottom: `1px solid ${tokens.navBorder}`,
      backgroundColor: tokens.navBackground,
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 15,
      transition: 'all 0.2s ease',
    }}>
      {/* Left: Organization Context & Live Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.7)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          fontSize: '12.5px',
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00A581',
            boxShadow: '0 0 10px #00A581',
          }}></span>
          <span style={{ color: tokens.textPrimary, fontWeight: '700' }}>
            {organization?.name || 'Netify Workspace'}
          </span>
          <span style={{ color: tokens.textMuted }}>|</span>
          <span style={{ color: '#00A581', fontSize: '11.5px', fontWeight: '600' }}>
            {organization?.currency || 'NGN'}
          </span>
        </div>
      </div>

      {/* Right: Actions, Theme Switcher, Language, Notifications, & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Quick Create Invoice Button */}
        <Link
          href="/receivables/create"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: tokens.accentSoft,
            border: `1px solid ${tokens.accentBorder}`,
            color: '#00A581',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={14} />
          <span>{t('commandCenter.addInvoice')}</span>
        </Link>

        {/* Ask Copilot Button */}
        <Link
          href="/chat"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
            color: '#FFFFFF',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: '700',
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
          }}
        >
          <Sparkles size={13} />
          <span>{t('common.askCopilot')}</span>
        </Link>

        {/* Live AI Voice Assistant Button */}
        <button
          type="button"
          onClick={() => setIsVoiceAssistantOpen(true)}
          title="Open Live Hands-Free AI Voice Assistant"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: tokens.accentSoft,
            border: `1px solid ${tokens.accentBorder}`,
            color: '#00A581',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Radio size={14} color="#00A581" className="animate-pulse" />
          <span>Live Voice</span>
        </button>

        {/* ☀️ / 🌙 Light / Dark Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode (🌙)' : 'Switch to Light Mode (☀️)'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
            border: `1px solid ${tokens.surfaceBorder}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}
        >
          {isLight ? (
            <Moon size={17} color="#003051" />
          ) : (
            <Sun size={17} color="#F59E0B" />
          )}
        </button>

        {/* Language Selector Button with Flag Sign */}
        <button
          type="button"
          onClick={openLanguageModal}
          title="Change language / Harshe / Èdè / Asụsụ"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.85)',
            border: `1px solid ${tokens.surfaceBorder}`,
            color: tokens.textPrimary,
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{currentLanguageInfo.flag}</span>
          <span style={{ color: '#00A581' }}>{currentLanguageInfo.code.toUpperCase()}</span>
          <span style={{ color: tokens.textMuted, fontSize: '11.5px', fontWeight: '500' }}>
            {currentLanguageInfo.nativeName.split(' ')[0]}
          </span>
          <span style={{ fontSize: '10px', color: '#00A581', marginLeft: '2px' }}>▼</span>
        </button>

        {/* Notification Bell */}
        <Link
          href="/notifications"
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: unreadCount > 0 ? '#00A581' : tokens.textMuted,
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10.5px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${tokens.background}`,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Pill */}
        {isAuthenticated && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '5px 12px 5px 6px',
            borderRadius: '24px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00A581 0%, #005F4B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: tokens.textPrimary, lineHeight: 1.2 }}>
                {user?.firstName || 'Merchant'}
              </span>
              <span style={{ fontSize: '10px', color: tokens.textMuted, lineHeight: 1, textTransform: 'capitalize' }}>
                {organization?.role?.toLowerCase() || 'Owner'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live AI Voice Assistant Fullscreen Modal */}
      <LiveVoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
      />
    </header>
  );
}
