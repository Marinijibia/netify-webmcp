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
  LogOut,
  Building,
  ShieldCheck
} from 'lucide-react';

const navigation = [
  { name: 'Command Center', href: '/', icon: LayoutDashboard },
  { name: 'Collections Queue', href: '/collections', icon: Layers },
  { name: 'Customer Directory', href: '/customers', icon: Users },
  { name: 'AI Action Drafts', href: '/messages/draft', icon: MessageSquareQuote },
  { name: 'Copilot Chat', href: '/chat', icon: BrainCircuit },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization, isAuthenticated, logout } = useAuth();

  // Hide sidebar on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#001D31',
      borderRight: '1px solid #0F5470',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #0F5470',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          backgroundColor: '#00A581',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 165, 129, 0.3)',
        }}>
          N
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', letterSpacing: '-0.5px' }}>Netify</h1>
          <p style={{ fontSize: '11px', color: '#8FB7C7' }}>AI Collections & Memory</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#FFFFFF' : '#8FB7C7',
                backgroundColor: isActive ? '#00A581' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} color={isActive ? '#FFFFFF' : '#8FB7C7'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Organization Badge & User Session */}
      <div style={{
        padding: '14px',
        margin: '12px',
        borderRadius: '10px',
        backgroundColor: '#003051',
        border: '1px solid #0F5470',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Building size={16} color="#00A581" />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {organization?.name || 'My Organization'}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#8FB7C7', marginLeft: '24px' }}>
          {organization?.currency || 'NGN'} • {organization?.role || 'OWNER'}
        </p>

        {isAuthenticated && (
          <button
            onClick={() => logout()}
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#FCA5A5',
              fontSize: '11px',
              fontWeight: '500',
            }}
          >
            <span>Sign Out ({user?.firstName || 'User'})</span>
            <LogOut size={12} />
          </button>
        )}
      </div>
    </aside>
  );
}
