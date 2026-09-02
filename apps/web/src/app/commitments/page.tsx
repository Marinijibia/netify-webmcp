'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  commitmentsApi, 
  customersApi, 
  receivablesApi,
  paymentsApi, 
  collectionActivitiesApi, 
  PaymentCommitmentItem, 
  CustomerItem,
  ReceivableItem,
  ActivityOutcome,
  CollectionChannel
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  Clock, 
  AlertCircle, 
  CalendarCheck, 
  Calendar, 
  MessageSquareQuote, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Loader2,
  ChevronRight,
  TrendingUp,
  User,
  Sparkles,
  DollarSign,
  PhoneCall,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  X,
  Check,
  CheckSquare,
  Square,
  Phone,
  Ban,
  CalendarClock,
  ShieldCheck,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type CommitmentTab = 'ALL' | 'TODAY' | 'MISSED' | 'PENDING' | 'FULFILLED';
type SortOption = 'PROMISED_DATE_ASC' | 'AMOUNT_DESC' | 'NAME_ASC';

interface RecordPaymentModalData {
  isOpen: boolean;
  commitmentId: string;
  customerId: string;
  receivableId?: string;
  customerName: string;
  amount: number;
  currency: string;
  method: string;
  paidAt: string;
  reference: string;
  notes: string;
  isSaving: boolean;
}

interface NewPromiseModalData {
  isOpen: boolean;
  customerId: string;
  receivableId: string;
  amount: number;
  currency: string;
  promisedFor: string;
  notes: string;
  isSaving: boolean;
}

interface RescheduleModalData {
  isOpen: boolean;
  commitment: PaymentCommitmentItem | null;
  newDate: string;
  newAmount: number;
  reason: string;
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

export default function CommitmentsPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [activeTab, setActiveTab] = useState<CommitmentTab>('ALL');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('PROMISED_DATE_ASC');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Selection
  const [selectedCommitmentIds, setSelectedCommitmentIds] = useState<Set<string>>(new Set());

  // In-line Modals
  const [paymentModal, setPaymentModal] = useState<RecordPaymentModalData>({
    isOpen: false,
    commitmentId: '',
    customerId: '',
    customerName: '',
    amount: 0,
    currency: 'NGN',
    method: 'BANK_TRANSFER',
    paidAt: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    isSaving: false,
  });

  const [newPromiseModal, setNewPromiseModal] = useState<NewPromiseModalData>({
    isOpen: false,
    customerId: '',
    receivableId: '',
    amount: 0,
    currency: 'NGN',
    promisedFor: '',
    notes: '',
    isSaving: false,
  });

  const [rescheduleModal, setRescheduleModal] = useState<RescheduleModalData>({
    isOpen: false,
    commitment: null,
    newDate: '',
    newAmount: 0,
    reason: '',
    isSaving: false,
  });

  const [callModal, setCallModal] = useState<CallModalData>({
    isOpen: false,
    customerId: '',
    customerName: '',
    phone: '',
    channel: 'PHONE',
    outcome: 'PROMISED_PAYMENT',
    notes: '',
    isSaving: false,
  });

  const currency = organization?.currency || 'NGN';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [commsRes, custsRes, recsRes] = await Promise.allSettled([
        commitmentsApi.getCommitments(),
        customersApi.list({ pageSize: 200 }),
        receivablesApi.list({ pageSize: 200 }),
      ]);

      if (commsRes.status === 'fulfilled') setCommitments(commsRes.value);
      if (custsRes.status === 'fulfilled') setCustomers(custsRes.value);
      if (recsRes.status === 'fulfilled') setReceivables(recsRes.value);
    } catch (err: any) {
      console.warn('Failed to load commitments data:', err);
      setError(err?.message || 'Failed to load commitments from live API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Today Date String (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter and Sort
  const filteredCommitments = useMemo(() => {
    return commitments
      .filter((c) => {
        const promiseDateStr = c.promisedFor ? new Date(c.promisedFor).toISOString().split('T')[0] : '';
        const isMissed = c.status === 'MISSED' || (c.promisedFor && new Date(c.promisedFor) < new Date() && c.status === 'PENDING');
        const isToday = promiseDateStr === todayStr && c.status === 'PENDING';

        // Tab Filter
        if (activeTab === 'TODAY' && !isToday) return false;
        if (activeTab === 'MISSED' && !isMissed) return false;
        if (activeTab === 'PENDING' && (c.status !== 'PENDING' || isMissed)) return false;
        if (activeTab === 'FULFILLED' && c.status !== 'FULFILLED') return false;

        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const custNameMatch = c.customer?.name ? c.customer.name.toLowerCase().includes(q) : false;
          const phoneMatch = c.customer?.phone ? c.customer.phone.toLowerCase().includes(q) : false;
          const notesMatch = c.notes ? c.notes.toLowerCase().includes(q) : false;
          if (!custNameMatch && !phoneMatch && !notesMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const amtA = parseFloat(String(a.amount)) || 0;
        const amtB = parseFloat(String(b.amount)) || 0;

        if (sortOption === 'PROMISED_DATE_ASC') return new Date(a.promisedFor).getTime() - new Date(b.promisedFor).getTime();
        if (sortOption === 'AMOUNT_DESC') return amtB - amtA;
        if (sortOption === 'NAME_ASC') return (a.customer?.name || '').localeCompare(b.customer?.name || '');
        return 0;
      });
  }, [commitments, activeTab, search, sortOption, todayStr]);

  // Customer Open Receivables for Promise Linking
  const availableCustomerReceivables = useMemo(() => {
    if (!newPromiseModal.customerId) return [];
    return receivables.filter(
      (r) => r.customerId === newPromiseModal.customerId && r.status !== 'PAID' && r.status !== 'CANCELLED'
    );
  }, [receivables, newPromiseModal.customerId]);

  // Debtor Reliability Map
  const debtorReliability = useMemo(() => {
    const map: Record<string, { total: number; fulfilled: number; missed: number }> = {};
    for (const c of commitments) {
      if (!c.customerId) continue;
      if (!map[c.customerId]) map[c.customerId] = { total: 0, fulfilled: 0, missed: 0 };
      map[c.customerId].total += 1;
      if (c.status === 'FULFILLED') map[c.customerId].fulfilled += 1;
      else if (c.status === 'MISSED' || (new Date(c.promisedFor) < new Date() && c.status === 'PENDING')) {
        map[c.customerId].missed += 1;
      }
    }
    return map;
  }, [commitments]);

  // Metrics
  const missedCommitments = useMemo(() => {
    return commitments.filter((c) => c.status === 'MISSED' || (c.promisedFor && new Date(c.promisedFor) < new Date() && c.status === 'PENDING'));
  }, [commitments]);

  const pendingCommitments = useMemo(() => {
    return commitments.filter((c) => c.status === 'PENDING' && new Date(c.promisedFor) >= new Date());
  }, [commitments]);

  const todayCommitments = useMemo(() => {
    return commitments.filter((c) => c.promisedFor && new Date(c.promisedFor).toISOString().split('T')[0] === todayStr && c.status === 'PENDING');
  }, [commitments, todayStr]);

  const fulfilledCommitments = useMemo(() => {
    return commitments.filter((c) => c.status === 'FULFILLED');
  }, [commitments]);

  const missedSum = missedCommitments.reduce((sum, c) => sum + (parseFloat(String(c.amount)) || 0), 0);
  const pendingSum = pendingCommitments.reduce((sum, c) => sum + (parseFloat(String(c.amount)) || 0), 0);
  const todaySum = todayCommitments.reduce((sum, c) => sum + (parseFloat(String(c.amount)) || 0), 0);
  const fulfilledSum = fulfilledCommitments.reduce((sum, c) => sum + (parseFloat(String(c.amount)) || 0), 0);
  const fulfillmentRate = commitments.length > 0 ? Math.round((fulfilledCommitments.length / commitments.length) * 100) : 0;

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedCommitmentIds.size === filteredCommitments.length) {
      setSelectedCommitmentIds(new Set());
    } else {
      setSelectedCommitmentIds(new Set(filteredCommitments.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedCommitmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Payment Modal (Fulfill Promise)
  const handleOpenPaymentModal = (c: PaymentCommitmentItem) => {
    setPaymentModal({
      isOpen: true,
      commitmentId: c.id,
      customerId: c.customerId,
      receivableId: c.receivableId || undefined,
      customerName: c.customer?.name || 'Customer',
      amount: parseFloat(String(c.amount)) || 0,
      currency: c.currency || currency,
      method: 'BANK_TRANSFER',
      paidAt: new Date().toISOString().split('T')[0],
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      notes: `Fulfillment of payment promise made for ${formatDate(c.promisedFor)}`,
      isSaving: false,
    });
  };

  // Save Settlement Payment
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
        reference: paymentModal.reference.trim() || undefined,
        notes: paymentModal.notes.trim() || undefined,
      });

      setToastMessage(`Payment recorded! Commitment for ${paymentModal.customerName} fulfilled.`);
      setTimeout(() => setToastMessage(null), 3500);
      setPaymentModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadData();
    } catch (err: any) {
      alert(`Could not record payment: ${err?.message || 'Server error'}`);
      setPaymentModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Open Reschedule Modal
  const handleOpenRescheduleModal = (c: PaymentCommitmentItem) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    setRescheduleModal({
      isOpen: true,
      commitment: c,
      newDate: nextDate.toISOString().split('T')[0],
      newAmount: parseFloat(String(c.amount)) || 0,
      reason: 'Customer requested brief payment extension',
      isSaving: false,
    });
  };

  // Quick Preset Helper for Dates
  const setQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().split('T')[0];
    setNewPromiseModal((prev) => ({ ...prev, promisedFor: dateStr }));
  };

  // Save Rescheduled Promise
  const handleSaveReschedule = async () => {
    if (!rescheduleModal.commitment || !rescheduleModal.newDate || rescheduleModal.newAmount <= 0) {
      alert('Please specify an agreed date and amount.');
      return;
    }

    setRescheduleModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await commitmentsApi.createCommitment({
        customerId: rescheduleModal.commitment.customerId,
        receivableId: rescheduleModal.commitment.receivableId || undefined,
        amount: Number(rescheduleModal.newAmount),
        currency: rescheduleModal.commitment.currency || currency,
        promisedFor: new Date(rescheduleModal.newDate).toISOString(),
        notes: `Rescheduled extension: ${rescheduleModal.reason}`,
      });

      try {
        await collectionActivitiesApi.createActivity({
          customerId: rescheduleModal.commitment.customerId,
          type: 'PAYMENT_REMINDER',
          channel: 'PHONE',
          outcome: 'REQUESTED_EXTENSION',
          notes: `Promise rescheduled to ${rescheduleModal.newDate}: ${rescheduleModal.reason}`,
        });
      } catch {}

      setToastMessage('Payment commitment rescheduled!');
      setTimeout(() => setToastMessage(null), 3000);
      setRescheduleModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadData();
    } catch (err: any) {
      alert(`Could not reschedule promise: ${err?.message || 'Server error'}`);
      setRescheduleModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Open New Promise Modal
  const handleOpenNewPromise = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const firstCust = customers.length > 0 ? customers[0].id : '';
    setNewPromiseModal({
      isOpen: true,
      customerId: firstCust,
      receivableId: '',
      amount: 50000,
      currency,
      promisedFor: nextDate.toISOString().split('T')[0],
      notes: 'Customer agreed to settle balance via bank transfer',
      isSaving: false,
    });
  };

  // Save New Promise
  const handleSaveNewPromise = async () => {
    if (!newPromiseModal.customerId || newPromiseModal.amount <= 0 || !newPromiseModal.promisedFor) {
      alert('Please select a customer and specify an amount and promised date.');
      return;
    }

    setNewPromiseModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await commitmentsApi.createCommitment({
        customerId: newPromiseModal.customerId,
        receivableId: newPromiseModal.receivableId || undefined,
        amount: Number(newPromiseModal.amount),
        currency: newPromiseModal.currency,
        promisedFor: new Date(newPromiseModal.promisedFor).toISOString(),
        notes: newPromiseModal.notes,
      });

      try {
        await collectionActivitiesApi.createActivity({
          customerId: newPromiseModal.customerId,
          type: 'PAYMENT_REMINDER',
          channel: 'PHONE',
          outcome: 'PROMISED_PAYMENT',
          notes: `Promise recorded for ${formatCurrency(newPromiseModal.amount, newPromiseModal.currency)} on ${newPromiseModal.promisedFor}`,
        });
      } catch {}

      setToastMessage('New payment promise recorded!');
      setTimeout(() => setToastMessage(null), 3000);
      setNewPromiseModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadData();
    } catch (err: any) {
      alert(`Could not record promise: ${err?.message || 'Server error'}`);
      setNewPromiseModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Cancel Promise
  const handleCancelPromise = async (c: PaymentCommitmentItem) => {
    if (!window.confirm(`Cancel payment commitment for ${c.customer?.name || 'this debtor'}?`)) {
      return;
    }

    try {
      await commitmentsApi.cancelCommitment(c.id, 'Cancelled by merchant');
      setToastMessage('Commitment cancelled.');
      setTimeout(() => setToastMessage(null), 2500);
      loadData();
    } catch (err: any) {
      alert(`Could not cancel commitment: ${err?.message || 'Server error'}`);
    }
  };

  // Open Call Modal
  const handleOpenCallModal = (c: PaymentCommitmentItem) => {
    setCallModal({
      isOpen: true,
      customerId: c.customerId,
      customerName: c.customer?.name || 'Customer',
      phone: c.customer?.phone || '',
      channel: 'PHONE',
      outcome: 'CONTACTED',
      notes: `Called debtor regarding ${formatCurrency(Number(c.amount), c.currency || currency)} promise due on ${formatDate(c.promisedFor)}.`,
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

      setToastMessage('Call activity logged!');
      setTimeout(() => setToastMessage(null), 3000);
      setCallModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
    } catch (err: any) {
      alert(`Could not log activity: ${err?.message || 'Server error'}`);
      setCallModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedCommitmentIds.size > 0
      ? filteredCommitments.filter((c) => selectedCommitmentIds.has(c.id))
      : filteredCommitments;

    if (listToExport.length === 0) {
      alert('No commitment records to export.');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone',
      'Promised Date',
      'Promised Amount',
      'Status',
      'Notes',
      'Invoice Reference',
      'Logged Date',
    ];

    const rows = listToExport.map((c) => [
      `"${(c.customer?.name || '').replace(/"/g, '""')}"`,
      `"${c.customer?.phone || ''}"`,
      `"${formatDate(c.promisedFor)}"`,
      c.amount,
      c.status,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      `"${c.receivable?.reference || ''}"`,
      `"${formatDate(c.createdAt)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Netify_Commitments_Audit_${new Date().toISOString().split('T')[0]}.csv`);
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
              {t('commitments.title')}
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
              {commitments.length} Commitments
            </span>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            Track promised cashflow dates, detect broken promises, and verify bank transfer receipts.
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
            <span>{selectedCommitmentIds.size > 0 ? `Export (${selectedCommitmentIds.size})` : 'Export CSV'}</span>
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

          {/* Log New Promise */}
          <button
            type="button"
            onClick={handleOpenNewPromise}
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
            <span>Log Promise</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Cashflow Bento Summary */}
      <div className="responsive-grid-4">
        {/* Broken Promises / Missed */}
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
            Broken Promises ({missedCommitments.length})
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(missedSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
            Defaulted promises requiring escalation
          </span>
        </div>

        {/* Due Today */}
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
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isLight ? '#D97706' : '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Due Today ({todayCommitments.length})
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: isLight ? '#D97706' : '#F59E0B', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(todaySum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#92400E' : '#FCD34D' }}>
            Verify incoming bank transfer alerts
          </span>
        </div>

        {/* Pending Active Pipeline */}
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
            Pending Pipeline ({pendingCommitments.length})
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(pendingSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Expected incoming debt settlements
          </span>
        </div>

        {/* Fulfilled / Honored */}
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
            Honored Revenue ({fulfillmentRate}%)
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: '#00A581', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(fulfilledSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            {fulfilledCommitments.length} promises successfully collected
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
            placeholder="Search by customer name, phone, or commitment notes..."
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
            { key: 'ALL', label: `All (${commitments.length})` },
            { key: 'TODAY', label: `Due Today (${todayCommitments.length})` },
            { key: 'MISSED', label: `Broken Promises (${missedCommitments.length})` },
            { key: 'PENDING', label: `Pending (${pendingCommitments.length})` },
            { key: 'FULFILLED', label: `Honored (${fulfilledCommitments.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as CommitmentTab)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: activeTab === tab.key ? '700' : '500',
                color: activeTab === tab.key ? '#FFFFFF' : tokens.textSecondary,
                backgroundColor: activeTab === tab.key ? '#00A581' : 'transparent',
                border: activeTab === tab.key ? '1px solid #00A581' : '1px solid transparent',
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
            <option value="PROMISED_DATE_ASC">Sort: Promise Date (Urgent First)</option>
            <option value="AMOUNT_DESC">Sort: Promised Amount (Highest)</option>
            <option value="NAME_ASC">Sort: Customer Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Select All Toggle */}
      {filteredCommitments.length > 0 && (
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
            {selectedCommitmentIds.size === filteredCommitments.length ? (
              <CheckSquare size={14} color="#00A581" />
            ) : (
              <Square size={14} color={tokens.textMuted} />
            )}
            <span>Select All ({filteredCommitments.length} Commitments)</span>
          </button>

          {selectedCommitmentIds.size > 0 && (
            <span style={{ fontWeight: '700', color: '#00A581' }}>
              {selectedCommitmentIds.size} commitments selected
            </span>
          )}
        </div>
      )}

      {/* 4. Commitments List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 8vw, 80px)', gap: '10px', color: tokens.textMuted }}>
          <Loader2 size={36} className="animate-spin text-teal-500" />
          <span style={{ fontSize: '13px' }}>Loading payment commitments & broken promises...</span>
        </div>
      ) : filteredCommitments.length === 0 ? (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '60px 20px',
          textAlign: 'center',
          color: tokens.textSecondary,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <CalendarCheck size={36} color={tokens.textMuted} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>No Commitments Found</h3>
          <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
            {search ? 'No commitments match your search filter.' : 'Log verbal payment promises from phone calls or WhatsApp chats.'}
          </p>
          <button
            type="button"
            onClick={handleOpenNewPromise}
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
            <span>Log First Promise</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredCommitments.map((c) => {
            const isSelected = selectedCommitmentIds.has(c.id);
            const isMissed = c.status === 'MISSED' || (c.promisedFor && new Date(c.promisedFor) < new Date() && c.status === 'PENDING');
            const isToday = c.promisedFor && new Date(c.promisedFor).toISOString().split('T')[0] === todayStr && c.status === 'PENDING';
            const isFulfilled = c.status === 'FULFILLED';

            // Calculate days diff for countdown meter
            const pDate = new Date(c.promisedFor);
            const now = new Date();
            const diffDays = Math.round((pDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

            const badgeBg = isFulfilled ? '#DCFCE7' : isMissed ? '#FEE2E2' : isToday ? '#FEF3C7' : tokens.accentSoft;
            const badgeColor = isFulfilled ? '#16A34A' : isMissed ? '#DC2626' : isToday ? '#D97706' : '#00A581';
            const statusLabel = isFulfilled ? 'HONORED / PAID' : isMissed ? 'BROKEN PROMISE' : isToday ? 'DUE TODAY' : 'PENDING';

            // Customer reliability
            const rel = c.customerId ? debtorReliability[c.customerId] : null;

            return (
              <div
                key={c.id}
                className="hover-lift"
                style={{
                  backgroundColor: isSelected ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.08)') : tokens.surface,
                  borderRadius: '14px',
                  border: isSelected ? '1.5px solid #00A581' : isMissed ? `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.4)'}` : `1px solid ${tokens.surfaceBorder}`,
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
                    onClick={() => toggleSelectOne(c.id)}
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
                      {c.customer ? (
                        <Link
                          href={`/customers/${c.customerId}`}
                          style={{ fontSize: '15.5px', fontWeight: '800', color: tokens.textPrimary, textDecoration: 'none' }}
                        >
                          {c.customer.name}
                        </Link>
                      ) : (
                        <span style={{ fontSize: '15.5px', fontWeight: '800', color: tokens.textPrimary }}>Debtor Agreement</span>
                      )}

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
                        {statusLabel}
                      </span>

                      {/* Debtor Reliability Indicator */}
                      {rel && rel.total > 1 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: rel.missed > 0 ? (isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.2)') : (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.2)'),
                          color: rel.missed > 0 ? '#DC2626' : '#16A34A',
                          border: `1px solid ${rel.missed > 0 ? '#FCA5A5' : '#86EFAC'}`,
                        }}>
                          {rel.missed > 0 ? `⚠️ ${rel.missed} Missed Promises` : `⭐ ${rel.fulfilled}/${rel.total} Honored`}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '12.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      {c.customer?.phone && (
                        <a href={`tel:${c.customer.phone}`} style={{ color: '#00A581', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} />
                          <span>{c.customer.phone}</span>
                        </a>
                      )}
                      {c.receivable && (
                        <Link href={`/receivables/${c.receivableId}`} style={{ color: tokens.textSecondary, textDecoration: 'none' }}>
                          • Ref: {c.receivable.reference || `REC-${c.receivableId.slice(0, 8)}`}
                        </Link>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      <span>Promised For: <strong style={{ color: isMissed ? '#DC2626' : isToday ? '#D97706' : tokens.textPrimary }}>{formatDate(c.promisedFor)}</strong></span>
                      
                      {/* Urgency Meter */}
                      {!isFulfilled && (
                        <span>
                          {isMissed ? (
                            <strong style={{ color: '#DC2626' }}>({Math.abs(diffDays)} days defaulted)</strong>
                          ) : isToday ? (
                            <strong style={{ color: '#D97706' }}>(Settlement Expected Today)</strong>
                          ) : (
                            <span style={{ color: '#00A581' }}>(In {diffDays} days)</span>
                          )}
                        </span>
                      )}

                      {c.notes && (
                        <>
                          <span>•</span>
                          <span style={{ fontStyle: 'italic' }}>&quot;{c.notes}&quot;</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions Hub */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: isFulfilled ? '#16A34A' : isMissed ? '#EF4444' : tokens.textPrimary, letterSpacing: '-0.4px' }}>
                      {formatCurrency(Number(c.amount), c.currency || currency)}
                    </div>
                    <p style={{ fontSize: '11px', color: tokens.textMuted, margin: '2px 0 0', textTransform: 'uppercase', fontWeight: '700' }}>
                      {isFulfilled ? 'Settled' : 'Promised Amount'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Fulfill / Record Settlement */}
                    {!isFulfilled && (
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(c)}
                        title="Record payment settlement and fulfill promise"
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
                        <span>Fulfill</span>
                      </button>
                    )}

                    {/* Reschedule / Extend */}
                    {!isFulfilled && (
                      <button
                        type="button"
                        onClick={() => handleOpenRescheduleModal(c)}
                        title="Reschedule agreed payment date"
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
                        <CalendarClock size={13} />
                        <span>Extend</span>
                      </button>
                    )}

                    {/* Log Call */}
                    <button
                      type="button"
                      onClick={() => handleOpenCallModal(c)}
                      title="Log phone call with debtor"
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
                      <span>Call</span>
                    </button>

                    {/* WhatsApp Reminder Bridge */}
                    {c.customerId && !isFulfilled && (
                      <Link
                        href={`/messages/draft?customerId=${c.customerId}`}
                        title="Draft WhatsApp promise reminder"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: isMissed ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '700',
                          textDecoration: 'none',
                          boxShadow: isMissed ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(0, 165, 129, 0.25)',
                        }}
                      >
                        <MessageSquareQuote size={13} />
                        <span>{isMissed ? 'Escalate' : 'WhatsApp'}</span>
                      </Link>
                    )}

                    {/* Ledger Link */}
                    {c.customerId && (
                      <Link
                        href={`/customers/${c.customerId}`}
                        style={{
                          padding: '7px 10px',
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
                    )}

                    {/* Cancel Promise */}
                    {!isFulfilled && (
                      <button
                        type="button"
                        onClick={() => handleCancelPromise(c)}
                        title="Cancel this commitment"
                        style={{
                          padding: '7px 8px',
                          borderRadius: '8px',
                          backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.4)'}`,
                          color: '#EF4444',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <Ban size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment / Fulfill Modal */}
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
                  Fulfill Payment Commitment
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
              Recording settlement for <strong>{paymentModal.customerName}</strong> marks this promise as honored and updates the ledger balance.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Settlement Amount ({paymentModal.currency}) *
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
                  value={paymentModal.reference}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, reference: e.target.value }))}
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
                <span>Record & Fulfill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule / Extend Modal */}
      {rescheduleModal.isOpen && rescheduleModal.commitment && (
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
          onClick={() => setRescheduleModal((prev) => ({ ...prev, isOpen: false }))}
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
                <CalendarClock size={18} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Reschedule / Grant Extension
                </h3>
              </div>
              <button
                onClick={() => setRescheduleModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Extend payment deadline for <strong>{rescheduleModal.commitment.customer?.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  New Agreed Date *
                </label>
                <input
                  type="date"
                  value={rescheduleModal.newDate}
                  onChange={(e) => setRescheduleModal((prev) => ({ ...prev, newDate: e.target.value }))}
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
                  Promised Amount ({rescheduleModal.commitment.currency || currency}) *
                </label>
                <input
                  type="number"
                  value={rescheduleModal.newAmount}
                  onChange={(e) => setRescheduleModal((prev) => ({ ...prev, newAmount: Number(e.target.value) }))}
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
                  Reason for Extension
                </label>
                <textarea
                  value={rescheduleModal.reason}
                  onChange={(e) => setRescheduleModal((prev) => ({ ...prev, reason: e.target.value }))}
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
                onClick={() => setRescheduleModal((prev) => ({ ...prev, isOpen: false }))}
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
                onClick={handleSaveReschedule}
                disabled={rescheduleModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: rescheduleModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {rescheduleModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Confirm Extension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log New Promise Modal with Quick Chips & Invoice Picker */}
      {newPromiseModal.isOpen && (
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
          onClick={() => setNewPromiseModal((prev) => ({ ...prev, isOpen: false }))}
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
                <CalendarCheck size={18} color="#00A581" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Log Verbal Payment Promise
                </h3>
              </div>
              <button
                onClick={() => setNewPromiseModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Customer / Debtor *
                </label>
                <select
                  value={newPromiseModal.customerId}
                  onChange={(e) => setNewPromiseModal((prev) => ({ ...prev, customerId: e.target.value, receivableId: '' }))}
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
                    Link Specific Invoice (Optional)
                  </label>
                  <select
                    value={newPromiseModal.receivableId}
                    onChange={(e) => {
                      const recId = e.target.value;
                      const selRec = availableCustomerReceivables.find((r) => r.id === recId);
                      setNewPromiseModal((prev) => ({
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
                    <option value="">-- General Account Promise --</option>
                    {availableCustomerReceivables.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.reference || `REC-${rec.id.slice(0, 8)}`} - Balance: {formatCurrency(Number(rec.balance), rec.currency || currency)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Promised Amount ({newPromiseModal.currency}) *
                </label>
                <input
                  type="number"
                  value={newPromiseModal.amount}
                  onChange={(e) => setNewPromiseModal((prev) => ({ ...prev, amount: Number(e.target.value) }))}
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

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary }}>
                    Promised Payment Date *
                  </label>
                  {/* Quick Preset Chips */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: tokens.accentSoft, color: '#00A581', border: `1px solid ${tokens.accentBorder}`, cursor: 'pointer' }}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(3)}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: tokens.accentSoft, color: '#00A581', border: `1px solid ${tokens.accentBorder}`, cursor: 'pointer' }}
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(7)}
                      style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: tokens.accentSoft, color: '#00A581', border: `1px solid ${tokens.accentBorder}`, cursor: 'pointer' }}
                    >
                      +1 Week
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={newPromiseModal.promisedFor}
                  onChange={(e) => setNewPromiseModal((prev) => ({ ...prev, promisedFor: e.target.value }))}
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
                  Notes & Agreed Channel
                </label>
                <textarea
                  value={newPromiseModal.notes}
                  onChange={(e) => setNewPromiseModal((prev) => ({ ...prev, notes: e.target.value }))}
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
                onClick={() => setNewPromiseModal((prev) => ({ ...prev, isOpen: false }))}
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
                onClick={handleSaveNewPromise}
                disabled={newPromiseModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: newPromiseModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {newPromiseModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Promise</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Logger Modal */}
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
              Recording call updates outreach timelines for <strong>{callModal.customerName}</strong> {callModal.phone ? `(${callModal.phone})` : ''}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
