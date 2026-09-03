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
import { webMCPTools } from '@/lib/webmcp/tools';
import { Menu } from 'lucide-react';

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
  '/payments',
  '/analytics',
  '/chat',
  '/messages',
  '/notifications',
  '/settings',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { tokens, isLight } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const isPublicPage = pathname === '/' || PUBLIC_PAGES.some((route) => route !== '/' && (pathname === route || pathname?.startsWith(`${route}/`)));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  // Protect internal workspace routes & handle onboarding flow
  useEffect(() => {
    if (isProtectedRoute && !isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (isAuthenticated && !isLoading && user && !user.onboardingCompleted && pathname !== '/onboarding' && isProtectedRoute) {
      router.replace('/onboarding');
    } else if (isAuthenticated && !isLoading && user && user.onboardingCompleted && pathname === '/onboarding') {
      router.replace('/workspace');
    }
  }, [isProtectedRoute, isLoading, isAuthenticated, user, pathname, router]);

  const webmcpScript = (
    <script
      id="webmcp-tools-manifest"
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          standard: 'document.modelContext.registerTool',
          status: 'ACTIVE',
          toolCount: webMCPTools.length,
          tools: webMCPTools.map((t) => ({
            name: t.name,
            description: t.description,
            category: t.category,
            inputSchema: t.inputSchema,
          })),
        }),
      }}
    />
  );

  // Dedicated clean layout for auth screens
  if (isAuthRoute) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: tokens.background, color: tokens.textPrimary }}>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
        <WebMCPInspector />
        {webmcpScript}
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
        {webmcpScript}
      </div>
    );
  }

  // Protected workspace layout with sidebar & navbar
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: tokens.background, color: tokens.textPrimary, overflowX: 'hidden' }}>
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowX: 'hidden' }}>
        {/* Mobile top bar with hamburger */}
        <div
          className="mobile-sidebar-toggle"
          style={{
            display: 'none', // shown via CSS at <1024px
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            backgroundColor: isLight ? '#FFFFFF' : '#001424',
            position: 'sticky',
            top: 0,
            zIndex: 14,
          }}
        >
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: tokens.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <Menu size={22} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: '700', color: tokens.textPrimary }}>Netify</span>
        </div>
        <Navbar />
        <main style={{
          flex: 1,
          padding: 'clamp(16px, 3vw, 28px) clamp(12px, 3vw, 36px) 48px',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: tokens.background,
          backgroundImage: `radial-gradient(circle at 50% -10%, ${isLight ? 'rgba(0, 165, 129, 0.04)' : 'rgba(0, 165, 129, 0.08)'} 0%, transparent 60%)`,
        }}>
          {children}
        </main>
      </div>
      <WebMCPInspector />
      {webmcpScript}
    </div>
  );
}
