'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { WebMCPInspector } from './WebMCPInspector';

const PUBLIC_PAGES = [
  '/',
  '/landing',
  '/features',
  '/webmcp',
  '/pricing',
  '/about',
  '/security',
  '/privacy',
  '/terms',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/onboarding',
];

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

const PROTECTED_ROUTES = [
  '/workspace',
  '/receivables',
  '/commitments',
  '/customers',
  '/collections',
  '/chat',
  '/messages',
  '/notifications',
  '/settings',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { tokens, isLight } = useTheme();

  const isPublicPage = pathname === '/' || PUBLIC_PAGES.some((route) => route !== '/' && (pathname === route || pathname?.startsWith(`${route}/`)));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  // Protect internal workspace routes
  useEffect(() => {
    if (isProtectedRoute && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isProtectedRoute, isLoading, isAuthenticated, router]);

  // Dedicated clean layout for auth screens
  if (isAuthRoute) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: tokens.background, color: tokens.textPrimary }}>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
        <WebMCPInspector />
      </div>
    );
  }

  // Public marketing layout with header & footer
  if (isPublicPage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: tokens.background, color: tokens.textPrimary }}>
        <PublicHeader />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
        <PublicFooter />
        <WebMCPInspector />
      </div>
    );
  }

  // Protected workspace layout with sidebar & navbar
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: tokens.background, color: tokens.textPrimary }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        <Navbar />
        <main style={{
          flex: 1,
          padding: '28px 36px 48px',
          overflowY: 'auto',
          backgroundColor: tokens.background,
          backgroundImage: `radial-gradient(circle at 50% -10%, ${isLight ? 'rgba(0, 165, 129, 0.04)' : 'rgba(0, 165, 129, 0.08)'} 0%, transparent 60%)`,
        }}>
          {children}
        </main>
      </div>
      <WebMCPInspector />
    </div>
  );
}
