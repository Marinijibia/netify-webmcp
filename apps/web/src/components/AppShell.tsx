'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { WebMCPInspector } from './WebMCPInspector';

const PUBLIC_ROUTES = [
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
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  if (isPublicRoute) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: '#001D31', color: '#FFFFFF' }}>
        <PublicHeader />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
        <PublicFooter />
        <WebMCPInspector />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#001D31', color: '#FFFFFF' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', backgroundColor: '#001D31' }}>
          {children}
        </main>
      </div>
      <WebMCPInspector />
    </div>
  );
}
