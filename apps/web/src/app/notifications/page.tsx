'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  notificationApi, 
  AppNotification 
} from '@/lib/api';
import { formatDate, formatTimeAgo } from '@/lib/formatters';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Check, 
  RefreshCw, 
  Loader2, 
  Sparkles,
  Inbox
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

export default function NotificationsPage() {
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications({ unreadOnly });
      setNotifications(res.items || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err: any) {
      console.warn('Failed to load notifications:', err);
      setError(err?.message || 'Failed to load notifications from live API.');
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ', readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const [isScanning, setIsScanning] = useState(false);

  const handleScanSignals = async () => {
    setIsScanning(true);
    try {
      await notificationApi.scanSignals();
      await loadNotifications();
    } catch (err: any) {
      console.warn('Failed to scan signals:', err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={24} color="#00A581" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>{t('notifications.title')}</h2>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13px', margin: '4px 0 0' }}>
            Real-time collection signals, broken promise alerts, and debtor risk escalations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleScanSignals}
            disabled={isScanning || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              color: '#00A581',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: isScanning || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Scanning Signals...' : 'Scan Business Signals'}</span>
          </button>

          <button
            type="button"
            onClick={() => loadNotifications()}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#FFFFFF' : '#003051',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textSecondary,
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLight ? tokens.shadowCard : 'none',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 165, 129, 0.3)',
              }}
            >
              <Check size={14} />
              <span>{t('notifications.markAllRead')} ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setUnreadOnly(false)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: '600',
            backgroundColor: !unreadOnly ? '#00A581' : (isLight ? '#FFFFFF' : '#003051'),
            color: !unreadOnly ? '#FFFFFF' : tokens.textSecondary,
            border: `1px solid ${!unreadOnly ? '#00A581' : tokens.surfaceBorder}`,
            cursor: 'pointer',
            boxShadow: isLight && unreadOnly ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          {t('common.all')}
        </button>

        <button
          onClick={() => setUnreadOnly(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: '600',
            backgroundColor: unreadOnly ? '#00A581' : (isLight ? '#FFFFFF' : '#003051'),
            color: unreadOnly ? '#FFFFFF' : tokens.textSecondary,
            border: `1px solid ${unreadOnly ? '#00A581' : tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: isLight && !unreadOnly ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <span>{t('common.pending')}</span>
          {unreadCount > 0 && (
            <span style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '11px',
              fontWeight: 'bold',
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          color: isLight ? '#B91C1C' : '#FCA5A5',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '60px 20px',
            textAlign: 'center',
            color: tokens.textSecondary,
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <Inbox size={36} color={tokens.textMuted} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary }}>No Notifications</h3>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
              {unreadOnly ? 'You have caught up with all alerts.' : 'No alerts have been generated yet.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = n.status !== 'READ';
            const isHigh = n.priority === 'HIGH';

            return (
              <div
                key={n.id}
                style={{
                  backgroundColor: isUnread ? tokens.surface : (isLight ? '#F8FAFC' : '#001D31'),
                  borderRadius: '10px',
                  border: `1px solid ${isUnread ? '#00A581' : tokens.surfaceBorder}`,
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  boxShadow: isLight ? (isUnread ? '0 2px 8px rgba(0, 165, 129, 0.12)' : tokens.shadowCard) : 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isHigh ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)') : tokens.accentSoft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isHigh ? '#EF4444' : '#00A581',
                    flexShrink: 0,
                  }}>
                    {isHigh ? <AlertTriangle size={18} /> : <Bell size={18} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span style={{
                          backgroundColor: '#00A581',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}>
                          NEW
                        </span>
                      )}
                    </div>

                    <p style={{ color: tokens.textSecondary, fontSize: '13px', marginTop: '4px', lineHeight: '1.5', margin: '4px 0 0' }}>
                      {n.body}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: tokens.textMuted }}>
                      <span>{formatTimeAgo(n.createdAt)}</span>
                      {n.signalType && <span>• Signal: {n.signalType}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#00A581',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Read
                    </button>
                  )}

                  {n.data?.customerId && (
                    <Link
                      href={`/customers/${n.data.customerId}`}
                      style={{
                        fontSize: '12px',
                        color: '#00A581',
                        fontWeight: '600',
                        textDecoration: 'none',
                      }}
                    >
                      View Customer →
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
