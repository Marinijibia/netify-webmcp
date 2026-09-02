'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  Check, 
  X, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { AppNotification, notificationApi } from '@/lib/api';

interface NotificationToastProps {
  notification: AppNotification | null;
  onDismiss: () => void;
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const { tokens, isLight } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 6000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification, onDismiss]);

  // Pause auto-dismiss on mouse hover
  useEffect(() => {
    if (isHovered && timerRef.current) {
      clearTimeout(timerRef.current);
    } else if (!isHovered && isVisible) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
    }
  }, [isHovered, isVisible, onDismiss]);

  if (!notification || !isVisible) return null;

  const isHigh = notification.priority === 'HIGH';
  const isPayment = notification.signalType === 'PAYMENT_RECEIVED';

  const getActionLink = () => {
    if (notification.signalType === 'PROMISE_MISSED' || notification.signalType === 'COLLECTION_FOLLOWUP_DUE') {
      return { label: 'Draft Follow-up', href: '/messages/draft', icon: <MessageSquare size={12} /> };
    }
    if (notification.data?.customerId) {
      return { label: 'Customer Ledger', href: `/customers/${notification.data.customerId}`, icon: <ExternalLink size={12} /> };
    }
    if (notification.data?.receivableId) {
      return { label: 'View Invoice', href: `/receivables/${notification.data.receivableId}`, icon: <ExternalLink size={12} /> };
    }
    if (isPayment) {
      return { label: 'View Receivables', href: '/receivables', icon: <DollarSign size={12} /> };
    }
    return { label: 'View Details', href: '/notifications', icon: <ArrowRight size={12} /> };
  };

  const action = getActionLink();

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(notification.id);
    } catch {
      // ignore
    }
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <aside
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: '76px',
        right: '20px',
        zIndex: 9999,
        width: 'min(380px, calc(100vw - 32px))',
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(0, 25, 43, 0.95)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: isHigh
          ? '1.5px solid #EF4444'
          : isPayment
          ? '1.5px solid #10B981'
          : `1.5px solid ${tokens.accentBorder || '#00A581'}`,
        boxShadow: isLight
          ? '0 12px 32px rgba(0, 30, 50, 0.16), 0 2px 8px rgba(0, 165, 129, 0.1)'
          : '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 165, 129, 0.2)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Toast Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: isHigh
              ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)')
              : isPayment
              ? (isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.2)')
              : (isLight ? '#F0FBF8' : 'rgba(0, 165, 129, 0.15)'),
            color: isHigh ? '#EF4444' : isPayment ? '#10B981' : '#00A581',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isHigh ? <AlertTriangle size={14} /> : isPayment ? <DollarSign size={14} /> : <Bell size={14} />}
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: isHigh ? '#EF4444' : isPayment ? '#10B981' : '#00A581' }}>
              {isHigh ? 'Urgent Alert' : isPayment ? 'Payment Signal' : 'Business Alert'}
            </span>
            <div style={{ fontSize: '13px', fontWeight: '700', color: tokens.textPrimary, lineHeight: 1.2 }}>
              {notification.title}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setIsVisible(false); setTimeout(onDismiss, 300); }}
          style={{
            background: 'none',
            border: 'none',
            color: tokens.textMuted,
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Toast Body */}
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: tokens.textSecondary,
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {notification.body}
      </p>

      {/* Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', gap: '8px' }}>
        <Link
          href={action.href}
          onClick={() => { setIsVisible(false); setTimeout(onDismiss, 300); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#00A581',
            textDecoration: 'none',
            backgroundColor: isLight ? '#F0FBF8' : 'rgba(0, 165, 129, 0.12)',
            border: '1px solid rgba(0, 165, 129, 0.4)',
            padding: '4px 10px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          {action.icon}
          <span>{action.label}</span>
        </Link>

        <button
          type="button"
          onClick={handleMarkRead}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            color: tokens.textMuted,
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '4px 6px',
          }}
        >
          <Check size={12} />
          <span>Dismiss</span>
        </button>
      </div>
    </aside>
  );
}
