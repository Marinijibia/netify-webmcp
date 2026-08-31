'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  MessageSquareQuote, 
  BrainCircuit, 
  FileText,
  Clock, 
  Bell, 
  Settings, 
  Building,
  LogOut,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/lib/theme/theme-context';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization, isAuthenticated, logout } = useAuth();
  const { currentLanguageInfo, openLanguageModal, t } = useLanguage();
  const { tokens, isLight } = useTheme();

  const navSections: { label: string; items: NavItem[] }[] = [
    {
      label: 'Core Operations',
      items: [
        { name: t('nav.commandCenter'), href: '/workspace', icon: LayoutDashboard },
        { name: t('nav.receivables'), href: '/receivables', icon: FileText },
        { name: t('nav.commitments'), href: '/commitments', icon: Clock },
        { name: t('common.followUp'), href: '/collections', icon: Layers, badge: 'Live' },
      ],
    },
    {
      label: 'Customer Intelligence',
      items: [
        { name: t('nav.customers'), href: '/customers', icon: Users },
        { name: t('common.askCopilot'), href: '/messages/draft', icon: MessageSquareQuote },
        { name: t('nav.copilot'), href: '/chat', icon: BrainCircuit, badge: 'AI' },
      ],
    },
    {
      label: 'Account & Settings',
      items: [
        { name: t('notifications.title'), href: '/notifications', icon: Bell },
        { name: t('nav.settings'), href: '/settings', icon: Settings },
        { name: 'Business Onboarding', href: '/onboarding', icon: Sparkles },
      ],
    },
  ];

  // Hide sidebar on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <aside style={{
      width: '272px',
      backgroundColor: isLight ? '#FFFFFF' : '#001424',
      borderRight: `1px solid ${tokens.surfaceBorder}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      userSelect: 'none',
      zIndex: 20,
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    }}>
      {/* Brand Header */}
      <Link href="/workspace" style={{
        padding: '20px 20px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
      }}>
        <img
          src="/logo-icon.png"
          alt="Netify Logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            objectFit: 'contain',
            boxShadow: '0 0 16px rgba(0, 165, 129, 0.4)',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: tokens.textPrimary, letterSpacing: '-0.4px' }}>Netify</span>
            <span style={{
              fontSize: '9.5px',
              fontWeight: 'bold',
              color: '#00A581',
              backgroundColor: tokens.accentSoft,
              padding: '1px 6px',
              borderRadius: '12px',
              border: `1px solid ${tokens.accentBorder}`,
            }}>
              2.0
            </span>
          </div>
          <p style={{ fontSize: '11px', color: tokens.textMuted, margin: '2px 0 0' }}>AI Collections & Memory</p>
        </div>
      </Link>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {navSections.map((section) => (
          <div key={section.label}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: tokens.textMuted,
              padding: '0 12px 6px',
            }}>
              {section.label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/workspace' && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9.5px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive 
                        ? (isLight ? '#00A581' : '#FFFFFF') 
                        : (isLight ? '#475569' : '#A2C4D3'),
                      backgroundColor: isActive 
                        ? (isLight ? 'rgba(0, 165, 129, 0.12)' : 'rgba(0, 165, 129, 0.16)') 
                        : 'transparent',
                      border: isActive 
                        ? `1px solid ${isLight ? 'rgba(0, 165, 129, 0.35)' : 'rgba(0, 165, 129, 0.45)'}` 
                        : '1px solid transparent',
                      boxShadow: isActive ? '0 2px 10px rgba(0, 165, 129, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={17} color={isActive ? '#00A581' : (isLight ? '#64748B' : '#729EAF')} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: tokens.accentSoft,
                        color: '#00A581',
                        border: `1px solid ${tokens.accentBorder}`,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Organization Card & User Bar */}
      <div style={{
        padding: '14px',
        margin: '12px',
        borderRadius: '12px',
        backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 32, 53, 0.8)',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'all 0.2s ease',
      }}>
        {/* Language Switcher Pill with Flag Sign */}
        <button
          type="button"
          onClick={openLanguageModal}
          title="Change language / Harshe / Èdè / Asụsụ"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 37, 62, 0.7)',
            border: `1px solid ${tokens.surfaceBorder}`,
            color: tokens.textPrimary,
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '4px',
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{currentLanguageInfo.flag}</span>
            <span style={{ fontWeight: '700', color: tokens.textPrimary }}>{currentLanguageInfo.nativeName}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#00A581', fontWeight: 'bold' }}>
            {currentLanguageInfo.code.toUpperCase()} ▾
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isLight ? '#F0FDF4' : '#00253E',
            border: `1px solid ${tokens.accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00A581',
            fontWeight: 'bold',
            fontSize: '13px',
            flexShrink: 0,
          }}>
            <Building size={16} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: tokens.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {organization?.name || 'Netify'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: tokens.textMuted, marginTop: '1px' }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#00A581',
                boxShadow: '0 0 6px #00A581',
              }}></span>
              <span>{organization?.currency || 'NGN'}</span>
              <span>•</span>
              <span style={{ textTransform: 'capitalize' }}>{organization?.role?.toLowerCase() || 'Owner'}</span>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => logout()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '7px 10px',
              borderRadius: '7px',
              backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.25)'}`,
              color: isLight ? '#DC2626' : '#FCA5A5',
              fontSize: '11.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('settings.signOut')} ({user?.firstName || 'User'})
            </span>
            <LogOut size={12} />
          </button>
        )}
      </div>
    </aside>
  );
}
