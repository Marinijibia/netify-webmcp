'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  receivablesApi, 
  paymentsApi, 
  commitmentsApi, 
  collectionActivitiesApi, 
  ReceivableItem 
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquareQuote,
  CalendarCheck,
  Phone,
  SlidersHorizontal,
  Check,
  X,
  CheckSquare,
  Square,
  User
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type StatusFilter = 'ALL' | 'OPEN' | 'PARTIALLY_PAID' | 'OVERDUE' | 'PAID';
type SortOption = 'BALANCE_DESC' | 'DUE_DATE_ASC' | 'ISSUED_DESC' | 'NAME_ASC';

interface PaymentModalData {
  isOpen: boolean;
  receivableId: string;
  customerId: string;
  customerName: string;
  reference: string;
  amount: number;
  currency: string;
  method: string;
  paidAt: string;
  paymentRef: string;
  notes: string;
  isSaving: boolean;
}

interface PromiseModalData {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  receivableId: string;
  amount: number;
  currency: string;
  promisedFor: string;
  notes: string;
  isSaving: boolean;
}

export default function ReceivablesPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('BALANCE_DESC');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Selection
  const [selectedReceivableIds, setSelectedReceivableIds] = useState<Set<string>>(new Set());

  // In-line Payment Modal
  const [paymentModal, setPaymentModal] = useState<PaymentModalData>({
    isOpen: false,
    receivableId: '',
    customerId: '',
    customerName: '',
    reference: '',
    amount: 0,
    currency: 'NGN',
    method: 'BANK_TRANSFER',
    paidAt: new Date().toISOString().split('T')[0],
    paymentRef: '',
    notes: '',
    isSaving: false,
  });

  // In-line Promise Modal
  const [promiseModal, setPromiseModal] = useState<PromiseModalData>({
    isOpen: false,
    customerId: '',
    customerName: '',
    receivableId: '',
    amount: 0,
    currency: 'NGN',
    promisedFor: '',
    notes: '',
    isSaving: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadReceivables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await receivablesApi.list({ pageSize: 300 });
      setReceivables(list);
    } catch (err: any) {
      console.warn('Failed to load receivables from live API:', err);
      setError(err?.message || 'Failed to load receivables from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceivables();
  }, [loadReceivables]);

  // Filter and Sort
  const filteredReceivables = useMemo(() => {
    return receivables
      .filter((rec) => {
        const isOverdue = rec.isOverdue || (rec.dueDate && new Date(rec.dueDate) < new Date() && rec.status !== 'PAID');

        // Status filter
        if (statusFilter === 'OPEN' && (rec.status !== 'OPEN' || isOverdue)) return false;
        if (statusFilter === 'PARTIALLY_PAID' && rec.status !== 'PARTIALLY_PAID') return false;
        if (statusFilter === 'OVERDUE' && !isOverdue) return false;
        if (statusFilter === 'PAID' && rec.status !== 'PAID') return false;

        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const refMatch = rec.reference ? rec.reference.toLowerCase().includes(q) : false;
          const descMatch = rec.description ? rec.description.toLowerCase().includes(q) : false;
          const custMatch = rec.customer?.name ? rec.customer.name.toLowerCase().includes(q) : false;
          const phoneMatch = rec.customer?.phone ? rec.customer.phone.toLowerCase().includes(q) : false;
          if (!refMatch && !descMatch && !custMatch && !phoneMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const balA = parseFloat(String(a.balance)) || 0;
        const balB = parseFloat(String(b.balance)) || 0;

        if (sortOption === 'BALANCE_DESC') return balB - balA;
        if (sortOption === 'DUE_DATE_ASC') return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
        if (sortOption === 'ISSUED_DESC') return new Date(b.issuedAt || b.createdAt).getTime() - new Date(a.issuedAt || a.createdAt).getTime();
        if (sortOption === 'NAME_ASC') return (a.customer?.name || '').localeCompare(b.customer?.name || '');
        return 0;
      });
  }, [receivables, statusFilter, search, sortOption]);

  // Metrics
  const totalOpenSum = receivables
    .filter((r) => r.status !== 'PAID' && r.status !== 'CANCELLED')
    .reduce((sum, r) => sum + (parseFloat(String(r.balance)) || 0), 0);

  const totalOverdueSum = receivables
    .filter((r) => r.isOverdue || (r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'PAID'))
    .reduce((sum, r) => sum + (parseFloat(String(r.balance)) || 0), 0);

  const totalCollectedSum = receivables
    .reduce((sum, r) => sum + (parseFloat(String(r.amountPaid)) || 0), 0);

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedReceivableIds.size === filteredReceivables.length) {
      setSelectedReceivableIds(new Set());
    } else {
      setSelectedReceivableIds(new Set(filteredReceivables.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedReceivableIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (rec: ReceivableItem) => {
    const bal = parseFloat(String(rec.balance)) || parseFloat(String(rec.originalAmount));
    setPaymentModal({
      isOpen: true,
      receivableId: rec.id,
      customerId: rec.customerId,
      customerName: rec.customer?.name || 'Customer',
      reference: rec.reference || `REC-${rec.id.slice(0, 8)}`,
      amount: bal,
      currency: rec.currency || currency,
      method: 'BANK_TRANSFER',
      paidAt: new Date().toISOString().split('T')[0],
      paymentRef: `PAY-${Date.now().toString().slice(-6)}`,
      notes: 'Direct customer settlement',
      isSaving: false,
    });
  };

  // Save Payment
  const handleSavePayment = async () => {
    if (!paymentModal.amount || paymentModal.amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setPaymentModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await paymentsApi.record({
        customerId: paymentModal.customerId,
        receivableId: paymentModal.receivableId,
        amount: Number(paymentModal.amount),
        method: paymentModal.method,
        paidAt: new Date(paymentModal.paidAt).toISOString(),
        reference: paymentModal.paymentRef || undefined,
        notes: paymentModal.notes || undefined,
      });

      setToastMessage(`Payment for ${paymentModal.reference} recorded successfully!`);
      setTimeout(() => setToastMessage(null), 3500);
      setPaymentModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadReceivables();
    } catch (err: any) {
      alert(`Could not record payment: ${err?.message || 'Server error'}`);
      setPaymentModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Open Promise Modal
  const handleOpenPromiseModal = (rec: ReceivableItem) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateStr = nextDate.toISOString().split('T')[0];
    const bal = parseFloat(String(rec.balance)) || parseFloat(String(rec.originalAmount));

    setPromiseModal({
      isOpen: true,
      customerId: rec.customerId,
      customerName: rec.customer?.name || 'Customer',
      receivableId: rec.id,
      amount: bal,
      currency: rec.currency || currency,
      promisedFor: dateStr,
      notes: `Promise for invoice ${rec.reference || rec.id.slice(0, 8)}`,
      isSaving: false,
    });
  };

  // Save Promise
  const handleSavePromise = async () => {
    if (!promiseModal.amount || promiseModal.amount <= 0 || !promiseModal.promisedFor) {
      alert('Please specify an amount and agreed date.');
      return;
    }

    setPromiseModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await commitmentsApi.createCommitment({
        customerId: promiseModal.customerId,
        receivableId: promiseModal.receivableId,
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

      setToastMessage(`Promise for ${promiseModal.customerName} logged!`);
      setTimeout(() => setToastMessage(null), 3000);
      setPromiseModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
    } catch (err: any) {
      alert(`Could not log promise: ${err?.message || 'Server error'}`);
      setPromiseModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedReceivableIds.size > 0
      ? filteredReceivables.filter((r) => selectedReceivableIds.has(r.id))
      : filteredReceivables;

    if (listToExport.length === 0) {
      alert('No invoice records to export.');
      return;
    }

    const headers = [
      'Reference',
      'Customer Name',
      'Phone',
      'Original Amount',
      'Amount Paid',
      'Balance Due',
      'Status',
      'Due Date',
      'Days Overdue',
      'Description',
    ];

    const rows = listToExport.map((r) => [
      `"${r.reference || `REC-${r.id.slice(0, 8)}`}"`,
      `"${(r.customer?.name || '').replace(/"/g, '""')}"`,
      `"${r.customer?.phone || ''}"`,
      r.originalAmount,
      r.amountPaid || 0,
      r.balance,
      r.status,
      r.dueDate ? formatDate(r.dueDate) : '',
      r.daysOverdue || 0,
      `"${(r.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Netify_Receivables_Report_${new Date().toISOString().split('T')[0]}.csv`);
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

      {/* 1. Header & Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.6px', margin: 0 }}>
              {t('receivables.title')}
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              color: '#00A581',
              fontSize: '12px',
              fontWeight: '700',
            }}>
              {receivables.length} Invoices
            </span>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            Trade credit transactions, invoice aging schedules, and cash recovery status.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
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
            }}
          >
            <Download size={14} color="#00A581" />
            <span>{selectedReceivableIds.size > 0 ? `Export (${selectedReceivableIds.size})` : 'Export CSV'}</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadReceivables()}
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
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{t('common.refresh')}</span>
          </button>

          {/* Create Invoice */}
          <Link
            href="/receivables/create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #00A581 0%, #007D62 100%)',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
            }}
          >
            <Plus size={15} />
            <span>{t('receivables.addReceivable')}</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive KPI Bento Summary */}
      <div className="responsive-grid-3">
        {/* Total Active Open */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Open Balance
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(totalOpenSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Active trade credit awaiting settlement
          </span>
        </div>

        {/* Delinquent Overdue */}
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
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isLight ? '#DC2626' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Past-Due Overdue Balance
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(totalOverdueSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
            Requires immediate collections escalation
          </span>
        </div>

        {/* Total Settled & Collected */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${tokens.accentBorder}`,
          background: isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#00A581', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Cash Collected
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: '#00A581', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(totalCollectedSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Successfully recovered & verified payments
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
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Search, Filter Tabs & Sort */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 280px)' }}>
          <Search size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice reference, debtor name, or description..."
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
          {search && (
            <button
              onClick={() => setSearch('')}
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
            { key: 'ALL', label: `All (${receivables.length})` },
            { key: 'OPEN', label: `Open (${receivables.filter((r) => r.status === 'OPEN' && !r.isOverdue).length})` },
            { key: 'PARTIALLY_PAID', label: `Partial (${receivables.filter((r) => r.status === 'PARTIALLY_PAID').length})` },
            { key: 'OVERDUE', label: `Overdue (${receivables.filter((r) => r.isOverdue || (r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'PAID')).length})` },
            { key: 'PAID', label: `Paid (${receivables.filter((r) => r.status === 'PAID').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as StatusFilter)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: statusFilter === tab.key ? '700' : '500',
                color: statusFilter === tab.key ? '#FFFFFF' : tokens.textSecondary,
                backgroundColor: statusFilter === tab.key ? '#00A581' : 'transparent',
                border: statusFilter === tab.key ? '1px solid #00A581' : '1px solid transparent',
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

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={13} color={tokens.textMuted} />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
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
            <option value="BALANCE_DESC">Sort: Highest Balance Due</option>
            <option value="DUE_DATE_ASC">Sort: Due Date (Urgent First)</option>
            <option value="ISSUED_DESC">Sort: Issue Date (Newest)</option>
            <option value="NAME_ASC">Sort: Customer Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Select All Toggle */}
      {filteredReceivables.length > 0 && (
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
            {selectedReceivableIds.size === filteredReceivables.length ? (
              <CheckSquare size={14} color="#00A581" />
            ) : (
              <Square size={14} color={tokens.textMuted} />
            )}
            <span>Select All ({filteredReceivables.length} Invoices)</span>
          </button>

          {selectedReceivableIds.size > 0 && (
            <span style={{ fontWeight: '700', color: '#00A581' }}>
              {selectedReceivableIds.size} invoices selected
            </span>
          )}
        </div>
      )}

      {/* 4. Invoices Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 8vw, 80px)', gap: '10px', color: tokens.textMuted }}>
          <Loader2 size={36} className="animate-spin text-teal-500" />
          <span style={{ fontSize: '13px' }}>Loading receivables & invoice ledgers...</span>
        </div>
      ) : filteredReceivables.length === 0 ? (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '60px 20px',
          textAlign: 'center',
          color: tokens.textSecondary,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <FileText size={36} color={tokens.textMuted} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>No Invoices Found</h3>
          <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
            {search ? 'No invoices match your search query.' : 'Get started by creating your first trade credit invoice.'}
          </p>
          <Link
            href="/receivables/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '16px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            <Plus size={14} />
            <span>Create Invoice</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReceivables.map((rec) => {
            const isSelected = selectedReceivableIds.has(rec.id);
            const isOverdue = rec.isOverdue || (rec.dueDate && new Date(rec.dueDate) < new Date() && rec.status !== 'PAID');
            const bal = parseFloat(String(rec.balance)) || 0;
            const orig = parseFloat(String(rec.originalAmount)) || 0;
            const paid = parseFloat(String(rec.amountPaid)) || 0;

            const badgeBg = rec.status === 'PAID' ? '#DCFCE7' : isOverdue ? '#FEE2E2' : rec.status === 'PARTIALLY_PAID' ? '#FEF3C7' : tokens.accentSoft;
            const badgeColor = rec.status === 'PAID' ? '#16A34A' : isOverdue ? '#DC2626' : rec.status === 'PARTIALLY_PAID' ? '#D97706' : '#00A581';

            return (
              <div
                key={rec.id}
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
                    onClick={() => toggleSelectOne(rec.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      marginTop: '2px',
                      color: isSelected ? '#00A581' : tokens.textMuted,
                    }}
                  >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Link
                        href={`/receivables/${rec.id}`}
                        style={{ fontSize: '15.5px', fontWeight: '800', color: tokens.textPrimary, textDecoration: 'none' }}
                      >
                        {rec.reference || `REC-${rec.id.slice(0, 8)}`}
                      </Link>

                      {/* Status Badge */}
                      <span style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}40`,
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '800',
                      }}>
                        {isOverdue && rec.status !== 'PAID' ? 'OVERDUE' : rec.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '12.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      {rec.customer && (
                        <Link
                          href={`/customers/${rec.customerId}`}
                          style={{ color: '#00A581', textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <User size={12} />
                          <span>{rec.customer.name}</span>
                        </Link>
                      )}
                      {rec.description && <span>• {rec.description}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      <span>Due: <strong style={{ color: isOverdue ? '#DC2626' : tokens.textPrimary }}>{rec.dueDate ? formatDate(rec.dueDate) : 'No due date'}</strong></span>
                      <span>•</span>
                      <span>Paid: <strong>{formatCurrency(paid, rec.currency || currency)}</strong></span>
                      {isOverdue && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#DC2626', fontWeight: 'bold' }}>
                            ⚠️ {rec.daysOverdue || Math.round((new Date().getTime() - new Date(rec.dueDate).getTime()) / (1000 * 3600 * 24))} days past due
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance & Actions Hub */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '17px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.4px' }}>
                      {formatCurrency(bal > 0 ? bal : orig, rec.currency || currency)}
                    </div>
                    {bal > 0 ? (
                      <p style={{ fontSize: '12px', color: isOverdue ? '#EF4444' : tokens.textSecondary, fontWeight: '700', marginTop: '2px', margin: 0 }}>
                        {formatCurrency(bal, rec.currency || currency)} remaining
                      </p>
                    ) : (
                      <p style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: '700', marginTop: '2px', margin: 0 }}>
                        Fully Settled
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Record Payment Button */}
                    {bal > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(rec)}
                        title="Record payment received"
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#16A34A',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                        }}
                      >
                        <DollarSign size={13} />
                        <span>Pay</span>
                      </button>
                    )}

                    {/* Log Promise */}
                    {bal > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenPromiseModal(rec)}
                        title="Log verbal promise-to-pay date"
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          backgroundColor: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
                          border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.4)'}`,
                          color: isLight ? '#D97706' : '#FCD34D',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CalendarCheck size={13} />
                        <span>Promise</span>
                      </button>
                    )}

                    {/* WhatsApp Reminder Bridge */}
                    {rec.customerId && bal > 0 && (
                      <Link
                        href={`/messages/draft?customerId=${rec.customerId}&receivableId=${rec.id}`}
                        title="Draft WhatsApp payment reminder"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '7px 12px',
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
                        <span>WhatsApp</span>
                      </Link>
                    )}

                    {/* Inspect Invoice Drilldown */}
                    <Link
                      href={`/receivables/${rec.id}`}
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
                      <span>Inspect</span>
                      <ChevronRight size={13} color={tokens.textMuted} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-Line Payment Modal */}
      {paymentModal.isOpen && (
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
          onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
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
                <DollarSign size={18} color="#16A34A" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Record Payment for {paymentModal.reference}
                </h3>
              </div>
              <button
                onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Recording a payment updates the remaining balance and logs a verified receipt for <strong>{paymentModal.customerName}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Payment Amount ({paymentModal.currency}) *
                </label>
                <input
                  type="number"
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13.5px',
                    fontWeight: '700',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentModal.method}
                    onChange={(e) => setPaymentModal((prev) => ({ ...prev, method: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      backgroundColor: isLight ? '#F8FAFC' : '#001424',
                      color: tokens.textPrimary,
                      fontSize: '12.5px',
                    }}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="POS">POS Terminal</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CARD">Card Payment</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentModal.paidAt}
                    onChange={(e) => setPaymentModal((prev) => ({ ...prev, paidAt: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      backgroundColor: isLight ? '#F8FAFC' : '#001424',
                      color: tokens.textPrimary,
                      fontSize: '12.5px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Reference / Teller Number
                </label>
                <input
                  type="text"
                  value={paymentModal.paymentRef}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, paymentRef: e.target.value }))}
                  placeholder="e.g. GTB/TRF/889231"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '12.5px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
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
                onClick={handleSavePayment}
                disabled={paymentModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: paymentModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {paymentModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Record Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Line Promise Modal */}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Notes
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
    </div>
  );
}
