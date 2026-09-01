'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, Menu, X, ArrowRight, ShieldCheck, Terminal, Layers, Sun, Moon } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/lib/theme/theme-context';

export function PublicHeader() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { currentLanguageInfo, openLanguageModal } = useLanguage();
  const { theme, setTheme, tokens, isLight } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Overview', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'WebMCP Engine', href: '/webmcp', badge: 'W3C' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Security', href: '/security' },
  ];

  return (
    <header style={{
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 29, 49, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${tokens.surfaceBorder}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 clamp(12px, 3vw, 24px)',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', minWidth: 0, flexShrink: 0 }}>
          <img
            src="/logo-icon.png"
            alt="Netify Logo"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              objectFit: 'contain',
              boxShadow: '0 0 15px rgba(0, 165, 129, 0.4)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '-0.5px', color: tokens.textPrimary }}>
                NETIFY
              </span>
              <span style={{
                backgroundColor: tokens.accentSoft,
                color: '#00A581',
                border: `1px solid ${tokens.accentBorder}`,
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '1px 5px',
                borderRadius: '4px',
              }}>
                WebMCP
              </span>
            </div>
            <p className="hide-on-mobile" style={{ fontSize: '10px', color: tokens.textMuted, margin: 0 }}>
              Agent-Ready Collections Workspace
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ alignItems: 'center', gap: '28px' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                style={{
                  fontSize: '13.5px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#00A581' : tokens.textSecondary,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'color 0.15s ease',
                }}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span style={{
                    fontSize: '9px',
                    backgroundColor: tokens.accentSoft,
                    border: `1px solid ${tokens.accentBorder}`,
                    color: '#00A581',
                    padding: '0 4px',
                    borderRadius: '3px',
                    fontWeight: 'bold',
                  }}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Language Selector Button with Flag */}
          <button
            type="button"
            onClick={openLanguageModal}
            title="Change language / Harshe / Èdè / Asụsụ"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 37, 62, 0.7)',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              padding: '5px 11px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{currentLanguageInfo.flag}</span>
            <span style={{ color: '#00A581' }}>{currentLanguageInfo.code.toUpperCase()}</span>
            <span style={{ fontSize: '9px', color: '#00A581' }}>▼</span>
          </button>

          {/* 1-Click Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            title={isLight ? 'Switch to Dark Mode (🌙)' : 'Switch to Light Mode (☀️)'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 37, 62, 0.7)',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: isLight ? '#D97706' : '#3AD0A9',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {!isAuthenticated && (
            <Link
              href="/login"
              className="desktop-nav"
              style={{
                padding: '8px 14px',
                color: tokens.textPrimary,
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          )}

          {isAuthenticated ? (
            <Link
              href="/workspace"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
                transition: 'transform 0.1s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Workspace</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <Link
              href="/register"
              className="desktop-nav"
              style={{
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
                transition: 'transform 0.1s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Register</span>
              <ArrowRight size={13} />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              backgroundColor: isLight ? '#F1F5F9' : '#003051',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              padding: '7px',
              borderRadius: '8px',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: tokens.surface,
          borderTop: `1px solid ${tokens.surfaceBorder}`,
          padding: '16px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '14px',
                color: tokens.textPrimary,
                padding: '8px 0',
                borderBottom: `1px solid ${tokens.surfaceBorder}`,
                textDecoration: 'none',
              }}
            >
              {link.name}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            {isAuthenticated ? (
              <Link
                href="/workspace"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  backgroundColor: '#00A581',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                Open Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: isLight ? '#F1F5F9' : '#003051',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '6px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: '#00A581',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                  }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
