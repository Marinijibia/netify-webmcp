'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  notificationApi, 
  AppNotification 
} from '@/lib/api';
import { formatTimeAgo } from '@/lib/formatters';
import { 
  Bell, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  Loader2, 
  X,
  Sparkles,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (newCount: number) => void;
}

export function NotificationPopover({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}: NotificationPopoverProps) {
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterUnread, setFilterUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load preview notifications when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    notificationApi.getNotifications({
      unreadOnly: filterUnread,
      page: 1,
      pageSize: 8,
    })
      .then((res) => {
        if (isMounted) {
          setNotifications(res.items || []);
          if (res.unreadCount !== undefined) {
            onUnreadCountChange(res.unreadCount);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load notification preview:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, filterUnread, onUnreadCountChange]);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n))
      );
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ', readAt: new Date().toISOString() }))
      );
      onUnreadCountChange(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 998,
        }}
      />

      {/* Popover Card */}
      <div
        ref={popoverRef}
        className="animate-fade-in"
        style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: 'min(400px, calc(100vw - 24px))',
          maxHeight: 'min(560px, calc(100vh - 90px))',
          backgroundColor: tokens.surface,
          borderRadius: '16px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight
            ? '0 16px 40px rgba(0, 30, 50, 0.15), 0 4px 12px rgba(0, 165, 129, 0.08)'
            : '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 165, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${tokens.surfaceBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isLight ? '#F8FAFC' : '#00192B',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={17} color="#00A581" />
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '2px 7px',
                borderRadius: '10px',
              }}>
                {unreadCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#00A581',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: tokens.textMuted,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Filter Switcher */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 16px',
          borderBottom: `1px solid ${tokens.surfaceBorder}`,
          backgroundColor: tokens.surface,
        }}>
          <button
            type="button"
            onClick={() => setFilterUnread(false)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '600',
              border: 'none',
              backgroundColor: !filterUnread ? (isLight ? '#E2E8F0' : '#003051') : 'transparent',
              color: !filterUnread ? tokens.textPrimary : tokens.textMuted,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterUnread(true)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '600',
              border: 'none',
              backgroundColor: filterUnread ? (isLight ? '#E2E8F0' : '#003051') : 'transparent',
              color: filterUnread ? tokens.textPrimary : tokens.textMuted,
              cursor: 'pointer',
            }}
          >
            Unread Only
          </button>
        </div>

        {/* Scrollable Notification Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <Loader2 size={24} className="animate-spin text-teal-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: tokens.textMuted }}>
              <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontSize: '13px', fontWeight: '600', color: tokens.textSecondary }}>
                {filterUnread ? 'No unread alerts' : 'No notifications yet'}
              </div>
              <div style={{ fontSize: '11.5px', marginTop: '3px' }}>
                You're up to date on all payment and collection signals.
              </div>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = n.status !== 'READ';
              const isHigh = n.priority === 'HIGH';

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isUnread
                      ? (isLight ? 'rgba(0, 165, 129, 0.04)' : 'rgba(0, 165, 129, 0.08)')
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Priority Icon */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    backgroundColor: isHigh
                      ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)')
                      : tokens.accentSoft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isHigh ? '#EF4444' : '#00A581',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {isHigh ? <AlertTriangle size={14} /> : <Bell size={14} />}
                  </div>

                  {/* Body & Actions */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{
                        fontSize: '12.5px',
                        fontWeight: isUnread ? 'bold' : '600',
                        color: tokens.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '10.5px', color: tokens.textMuted, flexShrink: 0 }}>
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p style={{
                      margin: '3px 0 0',
                      fontSize: '12px',
                      color: tokens.textSecondary,
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {n.body}
                    </p>

                    {/* Action Links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '11px' }}>
                      {n.data?.customerId && (
                        <Link
                          href={`/customers/${n.data.customerId}`}
                          onClick={onClose}
                          style={{
                            color: '#00A581',
                            fontWeight: '700',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <span>Customer Ledger</span>
                          <ExternalLink size={10} />
                        </Link>
                      )}

                      {n.signalType === 'PROMISE_MISSED' && (
                        <Link
                          href="/messages/draft"
                          onClick={onClose}
                          style={{
                            color: '#00A581',
                            fontWeight: '700',
                            textDecoration: 'none',
                          }}
                        >
                          Draft Follow-up →
                        </Link>
                      )}

                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(e, n.id)}
                          style={{
                            marginLeft: 'auto',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: tokens.textMuted,
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="Mark as read"
                        >
                          <Check size={11} />
                          <span>Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: `1px solid ${tokens.surfaceBorder}`,
          backgroundColor: isLight ? '#F8FAFC' : '#00192B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link
            href="/notifications"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#00A581',
              textDecoration: 'none',
            }}
          >
            <span>Open Notification Center</span>
            <ArrowRight size={13} />
          </Link>

          <Link
            href="/settings"
            onClick={onClose}
            title="Notification Settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: tokens.textMuted,
              textDecoration: 'none',
              padding: '4px',
            }}
          >
            <Settings size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
