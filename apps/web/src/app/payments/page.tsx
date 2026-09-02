'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  paymentsApi, 
  customersApi, 
  receivablesApi,
  PaymentItem, 
  CustomerItem,
  ReceivableItem
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Loader2,
  ChevronRight,
  TrendingUp,
  User,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  X,
  Check,
  CheckSquare,
  Square,
  Phone,
  Printer,
  MessageSquareQuote,
  FileText,
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  Calendar,
  ShieldCheck,
  Copy,
  Clock,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type MethodFilter = 'ALL' | 'BANK_TRANSFER' | 'POS' | 'CASH' | 'MOBILE_MONEY' | 'CARD';
type DateFilter = 'ALL_TIME' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';
type SortOption = 'DATE_DESC' | 'AMOUNT_DESC' | 'NAME_ASC';

interface NewPaymentModalData {
  isOpen: boolean;
  customerId: string;
  receivableId: string;
  amount: number;
  currency: string;
  method: string;
  paidAt: string;
  reference: string;
  notes: string;
  isSaving: boolean;
}

export default function PaymentsPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL_TIME');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Selection
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());

  // In-line Record Payment Modal
  const [newPaymentModal, setNewPaymentModal] = useState<NewPaymentModalData>({
    isOpen: false,
    customerId: '',
    receivableId: '',
    amount: 50000,
    currency: 'NGN',
    method: 'BANK_TRANSFER',
    paidAt: new Date().toISOString().split('T')[0],
    reference: '',
    notes: 'Direct trade credit settlement',
    isSaving: false,
  });

  // Printable Receipt Voucher Modal
  const [printReceiptPayment, setPrintReceiptPayment] = useState<PaymentItem | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [paysRes, custsRes, recsRes] = await Promise.allSettled([
        paymentsApi.list({ pageSize: 300 }),
        customersApi.list({ pageSize: 200 }),
        receivablesApi.list({ pageSize: 200 }),
      ]);

      if (paysRes.status === 'fulfilled') setPayments(paysRes.value);
      if (custsRes.status === 'fulfilled') setCustomers(custsRes.value);
      if (recsRes.status === 'fulfilled') setReceivables(recsRes.value);
    } catch (err: any) {
      console.warn('Failed to load payments data:', err);
      setError(err?.message || 'Failed to load payments from live API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Today Date String
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter and Sort
  const filteredPayments = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return payments
      .filter((p) => {
        // Method Filter
        if (methodFilter !== 'ALL' && p.method !== methodFilter) return false;

        // Date Range Filter
        const pDate = new Date(p.paidAt || p.createdAt);
        if (dateFilter === 'TODAY' && (p.paidAt || p.createdAt).slice(0, 10) !== todayStr) return false;
        if (dateFilter === 'THIS_WEEK' && pDate < oneWeekAgo) return false;
        if (dateFilter === 'THIS_MONTH' && pDate < startOfMonth) return false;

        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const custNameMatch = p.customer?.name ? p.customer.name.toLowerCase().includes(q) : false;
          const refMatch = p.reference ? p.reference.toLowerCase().includes(q) : false;
          const notesMatch = p.notes ? p.notes.toLowerCase().includes(q) : false;
          const invMatch = p.receivable?.reference ? p.receivable.reference.toLowerCase().includes(q) : false;
          if (!custNameMatch && !refMatch && !notesMatch && !invMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const amtA = parseFloat(String(a.amount)) || 0;
        const amtB = parseFloat(String(b.amount)) || 0;

        if (sortOption === 'DATE_DESC') return new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime();
        if (sortOption === 'AMOUNT_DESC') return amtB - amtA;
        if (sortOption === 'NAME_ASC') return (a.customer?.name || '').localeCompare(b.customer?.name || '');
        return 0;
      });
  }, [payments, methodFilter, dateFilter, search, sortOption, todayStr]);

  // Customer Open Receivables for Invoice Linking
  const availableCustomerReceivables = useMemo(() => {
    if (!newPaymentModal.customerId) return [];
    return receivables.filter(
      (r) => r.customerId === newPaymentModal.customerId && r.status !== 'PAID' && r.status !== 'CANCELLED'
    );
  }, [receivables, newPaymentModal.customerId]);

  // Metrics
  const totalRecoveredSum = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
  }, [payments]);

  const todayRecoveredSum = useMemo(() => {
    return payments
      .filter((p) => (p.paidAt || p.createdAt).startsWith(todayStr))
      .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
  }, [payments, todayStr]);

  const bankTransferCount = useMemo(() => payments.filter((p) => p.method === 'BANK_TRANSFER').length, [payments]);
  const posCount = useMemo(() => payments.filter((p) => p.method === 'POS').length, [payments]);
  const cashCount = useMemo(() => payments.filter((p) => p.method === 'CASH').length, [payments]);
  const mobileCount = useMemo(() => payments.filter((p) => p.method === 'MOBILE_MONEY' || p.method === 'CARD').length, [payments]);

  const avgPaymentSize = payments.length > 0 ? Math.round(totalRecoveredSum / payments.length) : 0;

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedPaymentIds.size === filteredPayments.length) {
      setSelectedPaymentIds(new Set());
    } else {
      setSelectedPaymentIds(new Set(filteredPayments.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Record Payment Modal
  const handleOpenRecordPayment = () => {
    const firstCust = customers.length > 0 ? customers[0].id : '';
    setNewPaymentModal({
      isOpen: true,
      customerId: firstCust,
      receivableId: '',
      amount: 50000,
      currency,
      method: 'BANK_TRANSFER',
      paidAt: new Date().toISOString().split('T')[0],
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      notes: 'Direct trade credit settlement',
      isSaving: false,
    });
  };

  // Save Payment
  const handleSavePayment = async () => {
    if (!newPaymentModal.customerId || newPaymentModal.amount <= 0) {
      alert('Please select a customer and enter a valid settlement amount.');
      return;
    }

    setNewPaymentModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await paymentsApi.record({
        customerId: newPaymentModal.customerId,
        receivableId: newPaymentModal.receivableId || undefined,
        amount: Number(newPaymentModal.amount),
        currency: newPaymentModal.currency,
        method: newPaymentModal.method,
        paidAt: new Date(newPaymentModal.paidAt).toISOString(),
        reference: newPaymentModal.reference.trim() || undefined,
        notes: newPaymentModal.notes.trim() || undefined,
      });

      setToastMessage('Payment settlement recorded and verified!');
      setTimeout(() => setToastMessage(null), 3500);
      setNewPaymentModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadData();
    } catch (err: any) {
      alert(`Could not record payment: ${err?.message || 'Server error'}`);
      setNewPaymentModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Confirm / Verify Pending Payment
  const handleConfirmPayment = async (p: PaymentItem) => {
    try {
      await paymentsApi.confirm(p.id);
      setToastMessage(`Payment ${p.reference || p.id.slice(0, 8)} verified and credited!`);
      setTimeout(() => setToastMessage(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Could not verify payment: ${err?.message || 'Server error'}`);
    }
  };

  // Copy Receipt Text to Clipboard
  const handleCopyReceiptText = (p: PaymentItem) => {
    const orgName = organization?.name || 'Netify Merchant';
    const text = `*OFFICIAL PAYMENT RECEIPT*\n` +
      `Receipt No: ${p.reference || `PAY-${p.id.slice(0, 8)}`}\n` +
      `Customer: ${p.customer?.name || 'Customer'}\n` +
      `Amount Paid: ${formatCurrency(Number(p.amount), p.currency || currency)}\n` +
      `Date: ${formatDate(p.paidAt || p.createdAt)}\n` +
      `Method: ${p.method}\n` +
      `Status: CONFIRMED & VERIFIED\n` +
      `Issued by: ${orgName}\n` +
      `Thank you for your prompt settlement!`;

    navigator.clipboard.writeText(text);
    setToastMessage('Payment receipt text copied to clipboard!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedPaymentIds.size > 0
      ? filteredPayments.filter((p) => selectedPaymentIds.has(p.id))
      : filteredPayments;

    if (listToExport.length === 0) {
      alert('No payment settlement records to export.');
      return;
    }

    const headers = [
      'Payment Reference',
      'Customer Name',
      'Amount Paid',
      'Currency',
      'Method',
      'Payment Date',
      'Status',
      'Invoice Reference',
      'Notes',
    ];

    const rows = listToExport.map((p) => [
      `"${p.reference || `PAY-${p.id.slice(0, 8)}`}"`,
      `"${(p.customer?.name || '').replace(/"/g, '""')}"`,
      p.amount,
      p.currency || currency,
      p.method,
      `"${formatDate(p.paidAt || p.createdAt)}"`,
      p.status,
      `"${p.receivable?.reference || ''}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Netify_Payments_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
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
              Payments & Cash Settlements
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
              {payments.length} Settlements
            </span>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            Verified bank transfer receipts, POS settlements, cash collections, and official customer vouchers.
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
            <span>{selectedPaymentIds.size > 0 ? `Export (${selectedPaymentIds.size})` : 'Export CSV'}</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadData()}
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

          {/* Record Settlement */}
          <button
            type="button"
            onClick={handleOpenRecordPayment}
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
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
            }}
          >
            <Plus size={15} />
            <span>Record Settlement</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Cash Inflow Bento Summary */}
      <div className="responsive-grid-4">
        {/* Total Verified Recovered */}
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
            Total Cash Recovered
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: '#00A581', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(totalRecoveredSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Across {payments.length} verified transactions
          </span>
        </div>

        {/* Today's Cash Inflow */}
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
            Today&apos;s Recoveries
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(todayRecoveredSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Same-day settled bank alerts
          </span>
        </div>

        {/* Channel Distribution */}
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
            Settlement Channels
          </span>
          <div style={{ fontSize: '13px', fontWeight: '800', color: tokens.textPrimary, marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span>🏦 {bankTransferCount} Transfer</span>
            <span>💳 {posCount} POS</span>
            <span>💵 {cashCount} Cash</span>
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Verified multi-channel settlements
          </span>
        </div>

        {/* Average Settlement Size */}
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
            Avg Ticket Size
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(avgPaymentSize, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Average settlement per debtor
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

      {/* 3. Search, Filter Tabs, Date Range & Sort */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 260px)' }}>
          <Search size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, teller number, debtor, or invoice..."
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

        {/* Date Range Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { key: 'ALL_TIME', label: 'All Time' },
            { key: 'TODAY', label: 'Today' },
            { key: 'THIS_WEEK', label: 'This Week' },
            { key: 'THIS_MONTH', label: 'This Month' },
          ].map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDateFilter(d.key as DateFilter)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: dateFilter === d.key ? '700' : '500',
                backgroundColor: dateFilter === d.key ? (isLight ? '#00A581' : '#00A581') : (isLight ? '#F1F5F9' : '#001424'),
                color: dateFilter === d.key ? '#FFFFFF' : tokens.textSecondary,
                border: dateFilter === d.key ? '1px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Channel Filter Tabs */}
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
            { key: 'ALL', label: `All (${payments.length})` },
            { key: 'BANK_TRANSFER', label: `Transfer (${bankTransferCount})` },
            { key: 'POS', label: `POS (${posCount})` },
            { key: 'CASH', label: `Cash (${cashCount})` },
            { key: 'MOBILE_MONEY', label: `Mobile/Card (${mobileCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMethodFilter(tab.key as MethodFilter)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: methodFilter === tab.key ? '700' : '500',
                color: methodFilter === tab.key ? '#FFFFFF' : tokens.textSecondary,
                backgroundColor: methodFilter === tab.key ? '#00A581' : 'transparent',
                border: methodFilter === tab.key ? '1px solid #00A581' : '1px solid transparent',
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
            <option value="DATE_DESC">Sort: Date (Newest First)</option>
            <option value="AMOUNT_DESC">Sort: Amount (Highest First)</option>
            <option value="NAME_ASC">Sort: Customer Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Select All Toggle */}
      {filteredPayments.length > 0 && (
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
            {selectedPaymentIds.size === filteredPayments.length ? (
              <CheckSquare size={14} color="#00A581" />
            ) : (
              <Square size={14} color={tokens.textMuted} />
            )}
            <span>Select All ({filteredPayments.length} Settlements)</span>
          </button>

          {selectedPaymentIds.size > 0 && (
            <span style={{ fontWeight: '700', color: '#00A581' }}>
              {selectedPaymentIds.size} payments selected
            </span>
          )}
        </div>
      )}

      {/* 4. Payments List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 8vw, 80px)', gap: '10px', color: tokens.textMuted }}>
          <Loader2 size={36} className="animate-spin text-teal-500" />
          <span style={{ fontSize: '13px' }}>Loading payment settlements & reconciliation records...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '60px 20px',
          textAlign: 'center',
          color: tokens.textSecondary,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <DollarSign size={36} color={tokens.textMuted} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>No Payments Recorded</h3>
          <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
            {search ? 'No payments match your search filter.' : 'Record verified bank transfers and cash settlements from debtors.'}
          </p>
          <button
            type="button"
            onClick={handleOpenRecordPayment}
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
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Record First Settlement</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredPayments.map((p) => {
            const isSelected = selectedPaymentIds.has(p.id);
            const amt = parseFloat(String(p.amount)) || 0;
            const isPending = p.status === 'PENDING';

            return (
              <div
                key={p.id}
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
                    onClick={() => toggleSelectOne(p.id)}
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
                      <span style={{ fontSize: '15.5px', fontWeight: '800', color: tokens.textPrimary }}>
                        {p.reference || `PAY-${p.id.slice(0, 8)}`}
                      </span>

                      {/* Method Badge */}
                      <span style={{
                        backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.15)',
                        color: '#00A581',
                        border: `1px solid ${tokens.accentBorder}`,
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '800',
                      }}>
                        {p.method}
                      </span>

                      {/* Status Badge */}
                      <span style={{
                        backgroundColor: p.status === 'CONFIRMED' ? '#DCFCE7' : '#FEF3C7',
                        color: p.status === 'CONFIRMED' ? '#16A34A' : '#D97706',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '800',
                      }}>
                        {p.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '12.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      {p.customer && (
                        <Link
                          href={`/customers/${p.customerId}`}
                          style={{ color: '#00A581', textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <User size={12} />
                          <span>{p.customer.name}</span>
                        </Link>
                      )}
                      {p.receivable && (
                        <Link href={`/receivables/${p.receivableId}`} style={{ color: tokens.textSecondary, textDecoration: 'none' }}>
                          • Invoice: {p.receivable.reference || `REC-${p.receivableId?.slice(0, 8)}`}
                        </Link>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      <span>Settled: <strong>{formatDate(p.paidAt || p.createdAt)}</strong></span>
                      {p.notes && (
                        <>
                          <span>•</span>
                          <span style={{ fontStyle: 'italic' }}>&quot;{p.notes}&quot;</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions Hub */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '19px', fontWeight: '900', color: '#00A581', letterSpacing: '-0.5px' }}>
                      + {formatCurrency(amt, p.currency || currency)}
                    </div>
                    <p style={{ fontSize: '11px', color: '#16A34A', margin: '2px 0 0', textTransform: 'uppercase', fontWeight: '800' }}>
                      Verified Inflow
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Confirm / Verify Button (if Pending) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment(p)}
                        title="Confirm and verify incoming transfer alert"
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
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>Verify</span>
                      </button>
                    )}

                    {/* Print Receipt Slip */}
                    <button
                      type="button"
                      onClick={() => setPrintReceiptPayment(p)}
                      title="Print official payment receipt voucher"
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
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
                      <Printer size={13} color="#00A581" />
                      <span>Receipt</span>
                    </button>

                    {/* Copy Receipt Text */}
                    <button
                      type="button"
                      onClick={() => handleCopyReceiptText(p)}
                      title="Copy receipt text to clipboard"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.8)',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} />
                    </button>

                    {/* WhatsApp Receipt Notice */}
                    {p.customerId && (
                      <Link
                        href={`/messages/draft?customerId=${p.customerId}`}
                        title="Send WhatsApp payment receipt confirmation"
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

                    {/* Debtor Ledger */}
                    {p.customerId && (
                      <Link
                        href={`/customers/${p.customerId}`}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          backgroundColor: isLight ? '#F1F5F9' : '#001424',
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record New Payment Modal */}
      {newPaymentModal.isOpen && (
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
          onClick={() => setNewPaymentModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
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
                <DollarSign size={18} color="#00A581" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Record Payment Settlement
                </h3>
              </div>
              <button
                onClick={() => setNewPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Recording settlement generates a verified payment receipt and automatically updates the debtor&apos;s ledger balance.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Customer / Debtor *
                </label>
                <select
                  value={newPaymentModal.customerId}
                  onChange={(e) => setNewPaymentModal((prev) => ({ ...prev, customerId: e.target.value, receivableId: '' }))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                  }}
                >
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {cust.phone ? `(${cust.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Invoice Linker */}
              {availableCustomerReceivables.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                    Settle Specific Invoice (Optional)
                  </label>
                  <select
                    value={newPaymentModal.receivableId}
                    onChange={(e) => {
                      const recId = e.target.value;
                      const selRec = availableCustomerReceivables.find((r) => r.id === recId);
                      setNewPaymentModal((prev) => ({
                        ...prev,
                        receivableId: recId,
                        amount: selRec ? parseFloat(String(selRec.balance)) : prev.amount,
                      }));
                    }}
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
                    <option value="">-- General Account Settlement --</option>
                    {availableCustomerReceivables.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.reference || `REC-${rec.id.slice(0, 8)}`} - Balance Due: {formatCurrency(Number(rec.balance), rec.currency || currency)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary }}>
                    Settlement Amount ({newPaymentModal.currency}) *
                  </label>
                  {/* Quick Preset Amount Chips */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setNewPaymentModal((prev) => ({ ...prev, amount: 50000 }))}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: tokens.accentSoft, color: '#00A581', border: `1px solid ${tokens.accentBorder}`, cursor: 'pointer' }}
                    >
                      50k
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPaymentModal((prev) => ({ ...prev, amount: 100000 }))}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: tokens.accentSoft, color: '#00A581', border: `1px solid ${tokens.accentBorder}`, cursor: 'pointer' }}
                    >
                      100k
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPaymentModal((prev) => ({ ...prev, amount: 250000 }))}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: tokens.accentSoft, color: '#00A581', border: `1px solid ${tokens.accentBorder}`, cursor: 'pointer' }}
                    >
                      250k
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  value={newPaymentModal.amount}
                  onChange={(e) => setNewPaymentModal((prev) => ({ ...prev, amount: Number(e.target.value) }))}
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
                    Payment Channel
                  </label>
                  <select
                    value={newPaymentModal.method}
                    onChange={(e) => setNewPaymentModal((prev) => ({ ...prev, method: e.target.value }))}
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
                    <option value="POS">POS Terminal</option>
                    <option value="CASH">Cash</option>
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
                    value={newPaymentModal.paidAt}
                    onChange={(e) => setNewPaymentModal((prev) => ({ ...prev, paidAt: e.target.value }))}
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
                  value={newPaymentModal.reference}
                  onChange={(e) => setNewPaymentModal((prev) => ({ ...prev, reference: e.target.value }))}
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

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Notes & Details
                </label>
                <textarea
                  value={newPaymentModal.notes}
                  onChange={(e) => setNewPaymentModal((prev) => ({ ...prev, notes: e.target.value }))}
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
                onClick={() => setNewPaymentModal((prev) => ({ ...prev, isOpen: false }))}
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
                disabled={newPaymentModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: newPaymentModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {newPaymentModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Settlement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Payment Receipt Slip Modal */}
      {printReceiptPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 14, 26, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPrintReceiptPayment(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              color: '#0F172A',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#00A581' }}>
                  {organization?.name || 'Commercial Receipt'}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Official Payment Voucher</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Receipt No</span>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>
                  {printReceiptPayment.reference || `PAY-${printReceiptPayment.id.slice(0, 8)}`}
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Received From</span>
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>{printReceiptPayment.customer?.name || 'Customer'}</strong>
                {printReceiptPayment.customer?.phone && <div style={{ color: '#64748B' }}>{printReceiptPayment.customer.phone}</div>}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div><span style={{ color: '#64748B' }}>Payment Date:</span> <strong>{formatDate(printReceiptPayment.paidAt || printReceiptPayment.createdAt)}</strong></div>
                <div><span style={{ color: '#64748B' }}>Method:</span> <strong>{printReceiptPayment.method}</strong></div>
                <div><span style={{ color: '#64748B' }}>Status:</span> <strong>{printReceiptPayment.status}</strong></div>
              </div>
            </div>

            {/* Paid Item Breakdown */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '12px', color: '#475569' }}>
                <span>Description / Reference</span>
                <span>Amount Paid</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>{printReceiptPayment.notes || (printReceiptPayment.receivable?.reference ? `Settlement for invoice ${printReceiptPayment.receivable.reference}` : 'Trade credit payment settlement')}</span>
                <strong style={{ color: '#00A581', fontSize: '15px' }}>
                  {formatCurrency(Number(printReceiptPayment.amount), printReceiptPayment.currency || currency)}
                </strong>
              </div>
            </div>

            {/* Total Paid Highlight */}
            <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', color: '#166534', fontSize: '14px' }}>Total Amount Paid:</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#15803D' }}>
                {formatCurrency(Number(printReceiptPayment.amount), printReceiptPayment.currency || currency)}
              </span>
            </div>

            {/* Netify Verification Stamp */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#16A34A', fontWeight: '700', padding: '6px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
              <ShieldCheck size={14} color="#16A34A" />
              <span>VERIFIED TRANSACTION • NETIFY RECOVERY LEDGER</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setPrintReceiptPayment(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={14} />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
