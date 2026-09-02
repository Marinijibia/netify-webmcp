'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  notificationApi, 
  AppNotification 
} from '@/lib/api';
import { formatTimeAgo } from '@/lib/formatters';
import { 
  Bell,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  RefreshCw,
  Loader2,
  Sparkles,
  Inbox,
  Trash2,
  ExternalLink,
  Filter,
  X,
  TrendingUp,
  MessageSquare,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useNotificationStream } from '@/lib/hooks/useNotificationStream';

type Category = 'ALL' | 'RISK' | 'PAYMENT' | 'COMMITMENT' | 'AI' | 'SYSTEM';

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'ALL',        label: 'All',         emoji: '🔔', color: '#6B7280' },
  { value: 'RISK',       label: 'Urgent/Risk', emoji: '🚨', color: '#EF4444' },
  { value: 'PAYMENT',    label: 'Payments',    emoji: '💰', color: '#10B981' },
  { value: 'COMMITMENT', label: 'Promises',    emoji: '🤝', color: '#F59E0B' },
  { value: 'AI',         label: 'AI Signals',  emoji: '🤖', color: '#8B5CF6' },
  { value: 'SYSTEM',     label: 'System',      emoji: '⚙️', color: '#6B7280' },
];

function getPriorityStyles(priority: string, isLight: boolean) {
  if (priority === 'HIGH') return {
    icon: <AlertTriangle size={15} />,
    color: '#EF4444',
    bg: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
  };
  if (priority === 'MEDIUM') return {
    icon: <Clock size={15} />,
    color: '#F59E0B',
    bg: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
  };
  return {
    icon: <Bell size={15} />,
    color: '#6B7280',
    bg: isLight ? '#F9FAFB' : 'rgba(107, 114, 128, 0.12)',
  };
}

function getContextualActions(n: AppNotification): { label: string; href: string; icon: React.ReactNode }[] {
  const actions = [];
  if (n.data?.customerId) {
    actions.push({ label: 'View Customer', href: `/customers/${n.data.customerId}`, icon: <ExternalLink size={11} /> });
  }
  if (n.data?.receivableId) {
    actions.push({ label: 'View Invoice', href: `/receivables/${n.data.receivableId}`, icon: <ExternalLink size={11} /> });
  }
  if (n.signalType === 'PROMISE_MISSED' || n.signalType === 'COLLECTION_FOLLOWUP_DUE') {
    actions.push({ label: 'Draft Follow-up', href: '/messages/draft', icon: <MessageSquare size={11} /> });
  }
  if (n.signalType === 'PAYMENT_RECEIVED') {
    actions.push({ label: 'View Receivables', href: '/receivables', icon: <DollarSign size={11} /> });
  }
  return actions;
}

export default function NotificationsPage() {
  const { tokens, isLight } = useTheme();
  const { unreadCount, setUnreadCount } = useNotificationStream();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [highPriorityCount, setHighPriorityCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [category, setCategory] = useState<Category>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const loadNotifications = useCallback(async (reset = false) => {
    const targetPage = reset ? 1 : page;
    setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications({
        category: category === 'ALL' ? undefined : category,
        search: search || undefined,
        unreadOnly: unreadOnly || undefined,
        page: targetPage,
        pageSize: 20,
      });
      const items = res.items || [];
      setNotifications(reset ? items : (prev) => [...prev, ...items]);
      setUnreadCount(res.unreadCount || 0);
      setTotalCount(res.pagination?.totalCount || items.length);
      setHasMore(res.pagination?.hasMore || false);

      // Compute KPI counts from fresh ALL fetch
      if (reset && category === 'ALL' && !search && !unreadOnly) {
        const today = new Date().toDateString();
        setHighPriorityCount(items.filter(n => n.priority === 'HIGH').length);
        setTodayCount(items.filter(n => new Date(n.createdAt).toDateString() === today).length);
      }
    } catch (err: any) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category, search, unreadOnly, page, setUnreadCount]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
    loadNotifications(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, unreadOnly]);

  useEffect(() => {
    if (page > 1) loadNotifications(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ', readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleBulkRead = async () => {
    if (!selectedIds.size) return;
    setBulkLoading(true);
    try {
      await notificationApi.bulkAction(Array.from(selectedIds), 'READ');
      setNotifications(prev =>
        prev.map(n => selectedIds.has(n.id) ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n)
      );
      const wasUnread = notifications.filter(n => selectedIds.has(n.id) && n.status !== 'READ').length;
      setUnreadCount(prev => Math.max(0, prev - wasUnread));
      setSelectedIds(new Set());
    } catch {} finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    setBulkLoading(true);
    try {
      await notificationApi.bulkAction(Array.from(selectedIds), 'DELETE');
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setTotalCount(prev => Math.max(0, prev - selectedIds.size));
      setSelectedIds(new Set());
    } catch {} finally {
      setBulkLoading(false);
    }
  };

  const handleScanSignals = async () => {
    setIsScanning(true);
    try {
      const res = await notificationApi.scanSignals();
      if (res.detectedCount > 0) {
        setPage(1);
        loadNotifications(true);
      }
    } catch {} finally {
      setIsScanning(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = notifications.length > 0 && notifications.every(n => selectedIds.has(n.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  const cardStyle = {
    backgroundColor: tokens.surface,
    borderRadius: '12px',
    border: `1px solid ${tokens.surfaceBorder}`,
    boxShadow: isLight ? tokens.shadowCard : 'none',
  };

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 28px)', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={22} color="#00A581" />
            <h1 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '20px',
                padding: '2px 9px',
                fontSize: '12px',
                fontWeight: '800',
              }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: tokens.textMuted }}>
            Real-time alerts, payment signals, and AI-driven collection intelligence
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleScanSignals}
            disabled={isScanning}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              backgroundColor: isLight ? '#F0FBF8' : 'rgba(0, 165, 129, 0.12)',
              border: '1px solid #00A581',
              borderRadius: '8px',
              color: '#00A581',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              opacity: isScanning ? 0.7 : 1,
            }}
          >
            {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>Scan Signals</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                color: tokens.textSecondary,
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Check size={14} />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Bento Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Alerts', value: totalCount, color: '#00A581', icon: <Bell size={16} /> },
          { label: 'Unread', value: unreadCount, color: '#3B82F6', icon: <Inbox size={16} /> },
          { label: 'Urgent', value: highPriorityCount, color: '#EF4444', icon: <AlertTriangle size={16} /> },
          { label: "Today's", value: todayCount, color: '#F59E0B', icon: <Clock size={16} /> },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              backgroundColor: kpi.color + (isLight ? '18' : '25'),
              color: kpi.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: tokens.textPrimary, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: '11px', color: tokens.textMuted, marginTop: '2px' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ ...cardStyle, padding: '14px 16px', marginBottom: '16px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: tokens.textMuted }} />
          <input
            type="text"
            placeholder="Search notifications…"
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 36px',
              borderRadius: '8px',
              border: `1px solid ${tokens.surfaceBorder}`,
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,30,50,0.4)',
              color: tokens.textPrimary,
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: tokens.textMuted, cursor: 'pointer', padding: '2px' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: category === cat.value ? `1.5px solid ${cat.color}` : `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: category === cat.value
                  ? (isLight ? cat.color + '18' : cat.color + '25')
                  : 'transparent',
                color: category === cat.value ? cat.color : tokens.textMuted,
                fontSize: '12px',
                fontWeight: category === cat.value ? '700' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}

          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => { setUnreadOnly(prev => !prev); setPage(1); }}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: unreadOnly ? '1.5px solid #3B82F6' : `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: unreadOnly ? (isLight ? '#EFF6FF' : 'rgba(59,130,246,0.15)') : 'transparent',
                color: unreadOnly ? '#3B82F6' : tokens.textMuted,
                fontSize: '12px',
                fontWeight: unreadOnly ? '700' : '500',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <Filter size={11} />
              <span>Unread Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bulk Selection Bar ── */}
      {selectedIds.size > 0 && (
        <div style={{
          ...cardStyle,
          padding: '10px 16px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: isLight ? '#F0FBF8' : 'rgba(0, 165, 129, 0.1)',
          borderColor: '#00A581',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: tokens.textPrimary }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={handleBulkRead}
              disabled={bulkLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: bulkLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              <span>Mark Read</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                border: '1px solid #EF4444',
                fontSize: '12px',
                fontWeight: '700',
                cursor: bulkLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ background: 'none', border: 'none', color: tokens.textMuted, cursor: 'pointer', padding: '4px' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Notification List ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {/* List Header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${tokens.surfaceBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,25,43,0.6)',
        }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#00A581' }}
          />
          <span style={{ fontSize: '12px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {category === 'ALL' ? 'All Notifications' : CATEGORIES.find(c => c.value === category)?.label}
          </span>
          {totalCount > 0 && (
            <span style={{ fontSize: '11px', color: tokens.textMuted }}>({totalCount})</span>
          )}
        </div>

        {/* Loading */}
        {isLoading && notifications.length === 0 ? (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} style={{ color: '#00A581', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Inbox size={36} style={{ color: tokens.textMuted, margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: '700', color: tokens.textSecondary }}>
              {search ? 'No results found' : unreadOnly ? 'All caught up!' : 'No notifications yet'}
            </div>
            <div style={{ fontSize: '13px', color: tokens.textMuted, marginTop: '4px' }}>
              {search
                ? `No notifications match "${search}"`
                : 'Business signals will appear here as they are detected.'}
            </div>
            <button
              onClick={handleScanSignals}
              style={{
                marginTop: '16px',
                padding: '9px 18px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={14} />
              <span>Scan for Signals</span>
            </button>
          </div>
        ) : (
          <>
            {notifications.map((n, idx) => {
              const isUnread = n.status !== 'READ';
              const ps = getPriorityStyles(n.priority, isLight);
              const isSelected = selectedIds.has(n.id);
              const contextActions = getContextualActions(n);

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: idx < notifications.length - 1 ? `1px solid ${tokens.surfaceBorder}` : 'none',
                    backgroundColor: isSelected
                      ? (isLight ? '#E6F7F3' : 'rgba(0, 165, 129, 0.12)')
                      : isUnread
                        ? (isLight ? 'rgba(0, 165, 129, 0.03)' : 'rgba(0, 165, 129, 0.06)')
                        : 'transparent',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(n.id)}
                    style={{ marginTop: '4px', width: '14px', height: '14px', cursor: 'pointer', accentColor: '#00A581', flexShrink: 0 }}
                  />

                  {/* Priority Icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: ps.bg,
                    color: ps.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {ps.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: isUnread ? '800' : '600',
                          color: tokens.textPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}>
                          <span>{n.title}</span>
                          {isUnread && (
                            <span style={{
                              width: '7px', height: '7px',
                              borderRadius: '50%',
                              backgroundColor: '#3B82F6',
                              flexShrink: 0,
                              display: 'inline-block',
                            }} />
                          )}
                          {n.priority === 'HIGH' && (
                            <span style={{
                              fontSize: '10px', fontWeight: '700',
                              color: '#EF4444',
                              border: '1px solid #EF4444',
                              borderRadius: '4px',
                              padding: '1px 5px',
                            }}>URGENT</span>
                          )}
                        </div>
                        <p style={{
                          margin: '4px 0 0',
                          fontSize: '12.5px',
                          color: tokens.textSecondary,
                          lineHeight: '1.45',
                        }}>
                          {n.body}
                        </p>
                      </div>
                      <span style={{ fontSize: '11px', color: tokens.textMuted, flexShrink: 0, whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Contextual Action Buttons + Mark Read */}
                    {contextActions.length > 0 || isUnread ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {contextActions.map(action => (
                          <Link
                            key={action.label}
                            href={action.href}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              color: '#00A581',
                              textDecoration: 'none',
                              padding: '4px 9px',
                              borderRadius: '6px',
                              border: '1px solid rgba(0, 165, 129, 0.4)',
                              backgroundColor: isLight ? 'rgba(0, 165, 129, 0.05)' : 'rgba(0, 165, 129, 0.08)',
                              transition: 'all 0.1s ease',
                            }}
                          >
                            {action.icon}
                            <span>{action.label}</span>
                          </Link>
                        ))}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                          {isUnread && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              title="Mark as read"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                background: 'none', border: 'none',
                                color: tokens.textMuted,
                                fontSize: '11.5px', fontWeight: '600', cursor: 'pointer',
                                padding: '3px 6px',
                              }}
                            >
                              <Check size={11} />
                              <span>Done</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
                            title="Delete notification"
                            style={{
                              display: 'inline-flex', alignItems: 'center',
                              background: 'none', border: 'none',
                              color: tokens.textMuted,
                              cursor: 'pointer', padding: '3px 6px',
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <div style={{ padding: '16px', textAlign: 'center', borderTop: `1px solid ${tokens.surfaceBorder}` }}>
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={isLoading}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: 'transparent',
                    color: tokens.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  <span>Load More</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Settings Link ── */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Link
          href="/settings"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12.5px', color: tokens.textMuted, textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          <Settings size={13} />
          <span>Manage notification preferences in Settings</span>
        </Link>
      </div>
    </div>
  );
}
