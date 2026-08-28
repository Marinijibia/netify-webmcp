'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, Globe, User, LogIn, Bell } from 'lucide-react';
import { notificationApi } from '@/lib/api';

export function Navbar() {
  const pathname = usePathname();
  const { user, organization, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);

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
      height: '64px',
      borderBottom: '1px solid #0F5470',
      backgroundColor: '#001D31',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Search / Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          backgroundColor: '#003051',
          padding: '5px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#DCEAF0',
          border: '1px solid #0F5470',
          fontWeight: '500',
        }}>
          Workspace: {organization?.name || 'Live Workspace'}
        </span>
        <span style={{ fontSize: '12px', color: '#5F94A9' }}>•</span>
        <span style={{ fontSize: '12px', color: '#00A581', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00A581' }}></span>
          Live API Active
        </span>
      </div>

      {/* Action Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Currency Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#003051',
          border: '1px solid #0F5470',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#DCEAF0',
        }}>
          <Globe size={14} color="#00A581" />
          <span>Currency: {organization?.currency || 'NGN'}</span>
        </div>

        {/* Notifications Icon Button */}
        <Link
          href="/notifications"
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#003051',
            border: '1px solid #0F5470',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8FB7C7',
          }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Session Avatar / Login Link */}
        {isAuthenticated ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#003051',
            padding: '4px 10px 4px 6px',
            borderRadius: '20px',
            border: '1px solid #0F5470',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#00A581',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '12px',
            }}>
              {initials}
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#FFFFFF' }}>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#00A581',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#FFFFFF',
            }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
