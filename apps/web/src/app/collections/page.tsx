'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  commandCenterApi, 
  commitmentsApi, 
  collectionActivitiesApi, 
  PriorityCustomerSummary,
  ActivityOutcome,
  CollectionChannel
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { 
  Layers, 
  AlertCircle, 
  Clock, 
  MessageSquareQuote, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Phone,
  Search,
  Download,
  CalendarCheck,
  Check,
  X,
  SlidersHorizontal,
  Building,
  UserCheck,
  PhoneCall,
  CheckSquare,
  Square
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type FilterType = 'ALL' | 'OVERDUE' | 'HIGH_URGENCY' | 'BROKEN_PROMISES';
type SortType = 'PRIORITY_DESC' | 'AMOUNT_DESC' | 'OVERDUE_DAYS_DESC' | 'NAME_ASC';

interface PromiseModalData {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  promisedFor: string;
  notes: string;
  isSaving: boolean;
}

interface CallModalData {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  phone?: string;
  channel: CollectionChannel;
  outcome: ActivityOutcome;
  notes: string;
  isSaving: boolean;
}

export default function CollectionsPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  // Queue state
  const [queue, setQueue] = useState<PriorityCustomerSummary[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sort, setSort] = useState<SortType>('PRIORITY_DESC');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Selection
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  // In-line Promise Logger Modal State
  const [promiseModal, setPromiseModal] = useState<PromiseModalData>({
    isOpen: false,
    customerId: '',
    customerName: '',
    amount: 0,
    currency: 'NGN',
    promisedFor: '',
    notes: '',
    isSaving: false,
  });

  // Quick Call Logger Modal State
  const [callModal, setCallModal] = useState<CallModalData>({
    isOpen: false,
    customerId: '',
    customerName: '',
    phone: '',
    channel: 'PHONE',
    outcome: 'CONTACTED',
    notes: '',
    isSaving: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await commandCenterApi.getPriorities({ limit: 100, currency });
      setQueue(data);
    } catch (err: any) {
      console.warn('Failed to load collections priority queue:', err);
      setError(err?.message || 'Failed to load priority queue from live API.');
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Filter and Search
  const filteredQueue = useMemo(() => {
    return queue
      .filter((item) => {
        // Tab Filter
        if (filter === 'OVERDUE' && item.totalOverdue <= 0) return false;
        if (filter === 'HIGH_URGENCY' && item.urgency !== 'HIGH' && item.priorityScore < 70) return false;
        if (filter === 'BROKEN_PROMISES' && item.missedCommitmentsCount <= 0) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = item.customerName.toLowerCase().includes(q);
          const phoneMatch = item.phone ? item.phone.toLowerCase().includes(q) : false;
          const reasonMatch = item.reasons ? item.reasons.some((r) => r.toLowerCase().includes(q)) : false;
          if (!nameMatch && !phoneMatch && !reasonMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === 'PRIORITY_DESC') return b.priorityScore - a.priorityScore;
        if (sort === 'AMOUNT_DESC') return b.totalOverdue - a.totalOverdue;
        if (sort === 'OVERDUE_DAYS_DESC') return b.oldestOverdueDays - a.oldestOverdueDays;
        if (sort === 'NAME_ASC') return a.customerName.localeCompare(b.customerName);
        return 0;
      });
  }, [queue, filter, searchQuery, sort]);

  // Summary Metrics
  const totalOverdueSum = queue.reduce((sum, q) => sum + (q.totalOverdue || 0), 0);
  const highUrgencyCount = queue.filter((q) => q.urgency === 'HIGH' || q.priorityScore >= 70).length;
  const missedCommitmentsCount = queue.reduce((sum, q) => sum + (q.missedCommitmentsCount || 0), 0);

  // Bulk Selection toggle
  const toggleSelectAll = () => {
    if (selectedCustomerIds.size === filteredQueue.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(filteredQueue.map((item) => item.customerId)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Promise Modal
  const handleOpenPromiseModal = (item: PriorityCustomerSummary) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateStr = nextDate.toISOString().split('T')[0];

    setPromiseModal({
      isOpen: true,
      customerId: item.customerId,
      customerName: item.customerName,
      amount: item.totalOverdue > 0 ? item.totalOverdue : item.totalOutstanding,
      currency: item.currency || currency,
      promisedFor: dateStr,
      notes: 'Customer agreed to settle payment via WhatsApp/Phone',
      isSaving: false,
    });
  };

  // Submit Promise-to-Pay
  const handleSavePromise = async () => {
    if (!promiseModal.customerId || promiseModal.amount <= 0 || !promiseModal.promisedFor) {
      alert('Please specify a valid amount and agreed payment date.');
      return;
    }

    setPromiseModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await commitmentsApi.createCommitment({
        customerId: promiseModal.customerId,
        amount: Number(promiseModal.amount),
        currency: promiseModal.currency,
        promisedFor: new Date(promiseModal.promisedFor).toISOString(),
        notes: promiseModal.notes,
      });

      try {
        await collectionActivitiesApi.createActivity({
          customerId: promiseModal.customerId,
          type: 'PAYMENT_REMINDER',
          channel: 'PHONE',
          outcome: 'PROMISED_PAYMENT',
          notes: `Promise recorded for ${formatCurrency(promiseModal.amount, promiseModal.currency)} on ${promiseModal.promisedFor}`,
        });
      } catch {}

      setToastMessage(`Payment promise for ${promiseModal.customerName} recorded successfully!`);
      setTimeout(() => setToastMessage(null), 3500);

      setPromiseModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadQueue();
    } catch (err: any) {
      alert(`Could not log promise: ${err?.message || 'Server error'}`);
      setPromiseModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Open Call Logger Modal
  const handleOpenCallModal = (item: PriorityCustomerSummary) => {
    setCallModal({
      isOpen: true,
      customerId: item.customerId,
      customerName: item.customerName,
      phone: item.phone || '',
      channel: 'PHONE',
      outcome: 'CONTACTED',
      notes: `Called debtor regarding ${formatCurrency(item.totalOverdue, item.currency || currency)} overdue balance.`,
      isSaving: false,
    });
  };

  // Save Call Activity
  const handleSaveCallActivity = async () => {
    setCallModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await collectionActivitiesApi.createActivity({
        customerId: callModal.customerId,
        type: 'CALL',
        channel: callModal.channel,
        outcome: callModal.outcome,
        notes: callModal.notes,
      });

      setToastMessage(`Call outcome for ${callModal.customerName} logged!`);
      setTimeout(() => setToastMessage(null), 3500);

      setCallModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadQueue();
    } catch (err: any) {
      alert(`Could not log activity: ${err?.message || 'Server error'}`);
      setCallModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const listToExport = selectedCustomerIds.size > 0
      ? filteredQueue.filter((item) => selectedCustomerIds.has(item.customerId))
      : filteredQueue;

    if (listToExport.length === 0) {
      alert('No debtor records to export.');
      return;
    }

    const headers = [
      'Rank',
      'Customer Name',
      'Phone',
      'Urgency Tier',
      'Priority Score',
      'Total Outstanding',
      'Total Overdue',
      'Oldest Overdue Days',
      'Open Invoices',
      'Missed Promises',
      'Reasons',
    ];

    const rows = listToExport.map((item, idx) => [
      idx + 1,
      `"${item.customerName.replace(/"/g, '""')}"`,
      `"${item.phone || ''}"`,
      item.urgency,
      item.priorityScore,
      item.totalOutstanding,
      item.totalOverdue,
      item.oldestOverdueDays,
      item.openReceivablesCount,
      item.missedCommitmentsCount,
      `"${(item.reasons || []).join('; ').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Netify_Collections_Priority_Queue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 999999,
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Executive Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.6px', margin: 0 }}>
              {t('commandCenter.todaysQueue')}
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              color: '#00A581',
              fontSize: '12px',
              fontWeight: '700',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00A581', boxShadow: '0 0 8px #00A581' }}></span>
              Deterministic AI Ranking
            </span>
          </div>

          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            {t('commandCenter.queueSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Download collections queue as CSV"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: isLight ? tokens.shadowCard : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} color="#00A581" />
            <span>{selectedCustomerIds.size > 0 ? `Export (${selectedCustomerIds.size})` : 'Export CSV'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadQueue()}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textSecondary,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: isLight ? tokens.shadowCard : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* WebMCP Tool Integration Notice */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: '12px',
        backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.8)',
        border: '1px solid rgba(0, 165, 129, 0.4)',
        fontSize: '12.5px',
        color: tokens.textSecondary,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={16} color="#00A581" />
          <span>
            Exposed live to autonomous browser agents via the <strong style={{ color: '#00A581' }}>get_collection_priority</strong> WebMCP tool.
          </span>
        </div>
        <Link
          href="/webmcp"
          style={{
            color: '#00A581',
            fontWeight: '700',
            fontSize: '12px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>Test in WebMCP Sandbox</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* 2. Executive KPI Bento Summary Cards */}
      <div className="responsive-grid-3">
        {/* Total Overdue in Queue */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)'}`,
          background: isLight ? '#FEF2F2' : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: 0,
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isLight ? '#DC2626' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Delinquent Overdue
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(totalOverdueSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
            Across {queue.length} priority debtor accounts
          </span>
        </div>

        {/* High Urgency Cases */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: 0,
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            High Urgency Debtors
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : highUrgencyCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#00A581', fontWeight: '600' }}>
            Immediate outreach recommended
          </span>
        </div>

        {/* Broken Promises */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.35)'}`,
          background: isLight ? '#FFFBEB' : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: 0,
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isLight ? '#D97706' : '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Defaulted Promises
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: isLight ? '#D97706' : '#F59E0B', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : missedCommitmentsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#92400E' : '#FCD34D' }}>
            Broken WhatsApp / phone promises
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: isLight ? '#B91C1C' : '#FCA5A5',
          fontSize: '13px',
        }}>
          <AlertCircle size={16} color="#EF4444" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Search & Multi-Criteria Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 280px)' }}>
          <Search size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debtor name, phone number, or tags..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '8px',
              fontSize: '12.5px',
              color: tokens.textPrimary,
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: tokens.textMuted,
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="no-scrollbar" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.7)',
          padding: '4px',
          borderRadius: '10px',
          border: `1px solid ${tokens.surfaceBorder}`,
          overflowX: 'auto',
          maxWidth: '100%',
        }}>
          {[
            { key: 'ALL', label: `All (${queue.length})` },
            { key: 'OVERDUE', label: `Overdue (${queue.filter((q) => q.totalOverdue > 0).length})` },
            { key: 'HIGH_URGENCY', label: `High Urgency (${highUrgencyCount})` },
            { key: 'BROKEN_PROMISES', label: `Broken Promises (${queue.filter((q) => q.missedCommitmentsCount > 0).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: filter === tab.key ? '700' : '500',
                color: filter === tab.key ? '#FFFFFF' : tokens.textSecondary,
                backgroundColor: filter === tab.key ? '#00A581' : 'transparent',
                border: filter === tab.key ? '1px solid #00A581' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={13} color={tokens.textMuted} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: tokens.textPrimary,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="PRIORITY_DESC">Sort: Priority Score (High to Low)</option>
            <option value="AMOUNT_DESC">Sort: Overdue Balance (Highest)</option>
            <option value="OVERDUE_DAYS_DESC">Sort: Days Overdue (Oldest)</option>
            <option value="NAME_ASC">Sort: Customer Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Select All Toggle if list not empty */}
      {filteredQueue.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: tokens.textSecondary, padding: '0 4px' }}>
          <button
            type="button"
            onClick={toggleSelectAll}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: tokens.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
            }}
          >
            {selectedCustomerIds.size === filteredQueue.length ? (
              <CheckSquare size={14} color="#00A581" />
            ) : (
              <Square size={14} color={tokens.textMuted} />
            )}
            <span>Select All ({filteredQueue.length} Debtors)</span>
          </button>

          {selectedCustomerIds.size > 0 && (
            <span style={{ fontWeight: '700', color: '#00A581' }}>
              {selectedCustomerIds.size} debtor accounts selected
            </span>
          )}
        </div>
      )}

      {/* 4. Priority Queue Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 8vw, 80px)', gap: '10px', color: tokens.textMuted }}>
          <Loader2 size={36} className="animate-spin text-teal-500" />
          <span style={{ fontSize: '13px' }}>Evaluating collection priorities & ledger exposures...</span>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '60px 20px',
          textAlign: 'center',
          color: tokens.textSecondary,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <CheckCircle2 size={36} color="#00A581" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>Zero Collections Priorities</h3>
          <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
            {searchQuery ? 'No accounts match the search query.' : 'All accounts are current or no delinquent receivables match the active filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredQueue.map((item, index) => {
            const isHighRisk = item.urgency === 'HIGH' || item.priorityScore >= 70;
            const isMediumRisk = item.urgency === 'MEDIUM' || item.priorityScore >= 40;
            const badgeColor = isHighRisk ? (isLight ? '#DC2626' : '#EF4444') : isMediumRisk ? (isLight ? '#D97706' : '#F59E0B') : '#00A581';
            const badgeBg = isHighRisk ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)') : isMediumRisk ? (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)') : tokens.accentSoft;

            const isSelected = selectedCustomerIds.has(item.customerId);

            // Aging Delinquency Bracket
            const days = item.oldestOverdueDays || 0;
            const agingBracket = days > 90 
              ? { label: '90+ Days (Critical Default Risk)', color: '#DC2626', bg: '#FEE2E2' }
              : days > 60 
              ? { label: '61-90 Days (Severe)', color: '#EA580C', bg: '#FFEDD5' }
              : days > 30 
              ? { label: '31-60 Days (Moderate)', color: '#D97706', bg: '#FEF3C7' }
              : { label: '1-30 Days (Early)', color: '#16A34A', bg: '#DCFCE7' };

            return (
              <div
                key={item.customerId}
                className="hover-lift"
                style={{
                  backgroundColor: isSelected ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.08)') : tokens.surface,
                  borderRadius: '14px',
                  border: isSelected ? '1.5px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: isLight ? tokens.shadowCard : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minWidth: 'min(100%, 360px)', flex: 1 }}>
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(item.customerId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      marginTop: '4px',
                      color: isSelected ? '#00A581' : tokens.textMuted,
                    }}
                  >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  {/* Queue Rank Badge */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 20, 36, 0.8)',
                    border: `1px solid ${tokens.accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    color: '#00A581',
                    fontSize: '13px',
                    flexShrink: 0,
                  }}>
                    #{index + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Link
                        href={`/customers/${item.customerId}`}
                        style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, textDecoration: 'none' }}
                      >
                        {item.customerName}
                      </Link>
                      
                      <span style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}40`,
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '800',
                      }}>
                        {item.urgency} RISK • SCORE {item.priorityScore}
                      </span>

                      {/* Aging Bracket Tag */}
                      <span style={{
                        backgroundColor: isLight ? agingBracket.bg : 'rgba(0,0,0,0.3)',
                        color: agingBracket.color,
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {agingBracket.label}
                      </span>
                    </div>

                    <p style={{ color: tokens.textSecondary, fontSize: '12px', marginTop: '4px', lineHeight: '1.4' }}>
                      {item.phone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: tokens.textPrimary, marginRight: '8px' }}>
                          <Phone size={12} color="#00A581" />
                          <span>{item.phone}</span>
                          <span>•</span>
                        </span>
                      ) : null}
                      {item.reasons && item.reasons.length > 0 ? item.reasons.join(' • ') : `${item.oldestOverdueDays} days overdue`}
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      <span>Overdue: <strong style={{ color: item.oldestOverdueDays > 30 ? '#DC2626' : tokens.textPrimary }}>{item.oldestOverdueDays} days</strong></span>
                      <span>•</span>
                      <span>{item.openReceivablesCount} open invoice{item.openReceivablesCount > 1 ? 's' : ''}</span>
                      {item.missedCommitmentsCount > 0 ? (
                        <>
                          <span>•</span>
                          <span style={{ color: isLight ? '#D97706' : '#FCD34D', fontWeight: 'bold' }}>
                            ⚠️ {item.missedCommitmentsCount} broken promise{item.missedCommitmentsCount > 1 ? 's' : ''}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions Hub */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '17px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.4px' }}>
                      {formatCurrency(item.totalOutstanding, item.currency || currency)}
                    </div>
                    <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700', marginTop: '2px', margin: 0 }}>
                      {formatCurrency(item.totalOverdue, item.currency || currency)} overdue
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Log Call Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenCallModal(item)}
                      title="Log phone call conversation outcome"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.8)',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <PhoneCall size={13} color="#00A581" />
                      <span>Log Call</span>
                    </button>

                    {/* Log Promise Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPromiseModal(item)}
                      title="Log agreed promise-to-pay date"
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
                        border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.4)'}`,
                        color: isLight ? '#D97706' : '#FCD34D',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CalendarCheck size={13} />
                      <span>Log Promise</span>
                    </button>

                    {/* Customer Ledger Link */}
                    <Link
                      href={`/customers/${item.customerId}`}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 20, 36, 0.7)',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Ledger</span>
                      <ChevronRight size={13} color={tokens.textMuted} />
                    </Link>

                    {/* Draft AI Follow-Up Bridge */}
                    <Link
                      href={`/messages/draft?customerId=${item.customerId}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(0, 165, 129, 0.25)',
                      }}
                    >
                      <MessageSquareQuote size={13} />
                      <span>Draft Message</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. In-Line Promise-to-Pay Logger Modal */}
      {promiseModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPromiseModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={18} color="#00A581" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Log Payment Promise
                </h3>
              </div>
              <button
                onClick={() => setPromiseModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Recording a verbal promise sets automated reminder alerts and tracks fulfillment memory for <strong>{promiseModal.customerName}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Promised Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Promised Amount ({promiseModal.currency})
                </label>
                <input
                  type="number"
                  value={promiseModal.amount}
                  onChange={(e) => setPromiseModal((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                />
              </div>

              {/* Promised Date */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Promised Payment Date
                </label>
                <input
                  type="date"
                  value={promiseModal.promisedFor}
                  onChange={(e) => setPromiseModal((prev) => ({ ...prev, promisedFor: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Agreed Channel & Notes
                </label>
                <textarea
                  value={promiseModal.notes}
                  onChange={(e) => setPromiseModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '12px',
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setPromiseModal((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: 'transparent',
                  color: tokens.textSecondary,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePromise}
                disabled={promiseModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: promiseModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {promiseModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Promise</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Quick Call Logger Modal */}
      {callModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={18} color="#00A581" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Log Call Outcome
                </h3>
              </div>
              <button
                onClick={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Recording phone outreach updates collection timelines for <strong>{callModal.customerName}</strong> {callModal.phone ? `(${callModal.phone})` : ''}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Outcome Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Call Result / Outcome
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { key: 'PROMISED_PAYMENT', label: '🤝 Promised Payment' },
                    { key: 'CONTACTED', label: '📞 Contacted & Reminded' },
                    { key: 'NO_RESPONSE', label: '📵 No Answer / Busy' },
                    { key: 'REQUESTED_EXTENSION', label: '⏳ Asked for Extension' },
                    { key: 'DISPUTE', label: '⚠️ Disputed Invoice' },
                    { key: 'WRONG_CONTACT', label: '❌ Wrong Number' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setCallModal((prev) => ({ ...prev, outcome: opt.key as ActivityOutcome }))}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        textAlign: 'left',
                        cursor: 'pointer',
                        backgroundColor: callModal.outcome === opt.key ? '#00A581' : (isLight ? '#F1F5F9' : '#001424'),
                        color: callModal.outcome === opt.key ? '#FFFFFF' : tokens.textPrimary,
                        border: callModal.outcome === opt.key ? '1px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Call Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Call Notes
                </label>
                <textarea
                  value={callModal.notes}
                  onChange={(e) => setCallModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '12px',
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: 'transparent',
                  color: tokens.textSecondary,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCallActivity}
                disabled={callModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: callModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {callModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Log Outcome</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
