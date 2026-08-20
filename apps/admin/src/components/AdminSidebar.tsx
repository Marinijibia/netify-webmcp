'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, BarChart3, Building2, Cpu, ShieldCheck } from 'lucide-react';

const navigation = [
  { name: 'Platform Overview', href: '/', icon: BarChart3 },
  { name: 'Tenant Organizations', href: '/tenants', icon: Building2 },
  { name: 'AI Telemetry & System', href: '/system', icon: Cpu },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0F172A',
      borderRight: '1px solid #1E293B',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          backgroundColor: '#3B82F6',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          N
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F8FAFC' }}>Netify Admin</h1>
          <p style={{ fontSize: '11px', color: '#94A3B8' }}>Platform Operations</p>
        </div>
      </div>

      {/* Nav */}
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
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                backgroundColor: isActive ? '#3B82F6' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? '#FFFFFF' : '#94A3B8'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px', margin: '12px', borderRadius: '8px', backgroundColor: '#1E293B', fontSize: '11px', color: '#94A3B8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8', fontWeight: 'bold', marginBottom: '4px' }}>
          <ShieldCheck size={14} />
          <span>Multi-Tenant Mesh</span>
        </div>
        <span>Isolation: TenantGuard JWT</span>
      </div>
    </aside>
  );
}
