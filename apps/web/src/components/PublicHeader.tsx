'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X, ArrowRight, ShieldCheck, Terminal, Layers } from 'lucide-react';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Overview', href: '/landing' },
    { name: 'Features', href: '/features' },
    { name: 'WebMCP Engine', href: '/webmcp', badge: 'W3C' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Security', href: '/security' },
  ];

  return (
    <header style={{
      backgroundColor: 'rgba(0, 29, 49, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #0F5470',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo */}
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#00A581',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 165, 129, 0.4)',
          }}>
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px', color: '#FFFFFF' }}>
                NETIFY
              </span>
              <span style={{
                backgroundColor: 'rgba(0, 165, 129, 0.2)',
                color: '#3AD0A9',
                border: '1px solid rgba(0, 165, 129, 0.4)',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '1px 6px',
                borderRadius: '4px',
              }}>
                WebMCP
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#8FB7C7', margin: 0 }}>
              Agent-Ready Collections Workspace
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                style={{
                  fontSize: '13.5px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#3AD0A9' : '#DCEAF0',
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
                    backgroundColor: '#003051',
                    border: '1px solid #0F5470',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/login"
            style={{
              padding: '8px 14px',
              color: '#DCEAF0',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
              transition: 'transform 0.1s ease',
            }}
          >
            <span>Open Workspace</span>
            <ArrowRight size={14} />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              backgroundColor: '#003051',
              border: '1px solid #0F5470',
              color: '#8FB7C7',
              padding: '6px',
              borderRadius: '6px',
              display: 'none',
            }}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#001D31',
          borderTop: '1px solid #0F5470',
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
                color: '#DCEAF0',
                padding: '8px 0',
                borderBottom: '1px solid rgba(15, 84, 112, 0.4)',
                textDecoration: 'none',
              }}
            >
              {link.name}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <Link
              href="/login"
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '10px',
                backgroundColor: '#003051',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/"
              style={{
                flex: 2,
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
          </div>
        </div>
      )}
    </header>
  );
}
