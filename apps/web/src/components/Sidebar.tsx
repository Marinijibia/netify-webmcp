'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  MessageSquareQuote, 
  BrainCircuit, 
  Settings,
  ShieldCheck
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Collections Queue', href: '/collections', icon: Layers },
  { name: 'Customer Directory', href: '/customers', icon: Users },
  { name: 'AI Follow-up Drafts', href: '/messages/draft', icon: MessageSquareQuote },
  { name: 'Business Memory Chat', href: '/chat', icon: BrainCircuit },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#111827',
      borderRight: '1px solid #1F2937',
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
        borderBottom: '1px solid #1F2937',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          backgroundColor: '#10B981',
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
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB', letterSpacing: '-0.5px' }}>Netify</h1>
          <p style={{ fontSize: '11px', color: '#9CA3AF' }}>AI Collections & Memory</p>
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
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#FFFFFF' : '#9CA3AF',
                backgroundColor: isActive ? '#10B981' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Organization Badge Footer */}
      <div style={{
        padding: '16px',
        margin: '12px',
        borderRadius: '10px',
        backgroundColor: '#1E293B',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldCheck size={16} color="#10B981" />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#F9FAFB' }}>Apex Trading Ltd</span>
        </div>
        <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Lagos FMCG Distribution</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: '#6EE7B7' }}>
          <span>PRO ENTITLED</span>
          <span>CURRENCY: NGN (₦)</span>
        </div>
      </div>
    </aside>
  );
}
