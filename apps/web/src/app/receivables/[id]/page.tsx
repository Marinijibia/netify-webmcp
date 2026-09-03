'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  receivablesApi, 
  paymentsApi, 
  commitmentsApi, 
  collectionActivitiesApi, 
  ReceivableItem,
  PaymentItem,
  PaymentCommitmentItem,
  CollectionActivityItem
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  FileText, 
  ArrowLeft, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquareQuote, 
  Clock, 
  Plus, 
  Loader2, 
  X,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Printer,
  CalendarCheck,
  PhoneCall,
  Check,
  ChevronRight,
  Download,
  AlertCircle,
  Ban
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

interface PaymentModalData {
  isOpen: boolean;
  amount: number;
  currency: string;
  method: string;
  paidAt: string;
  reference: string;
  notes: string;
  isSaving: boolean;
}

interface PromiseModalData {
  isOpen: boolean;
  amount: number;
  currency: string;
  promisedFor: string;
  notes: string;
  isSaving: boolean;
}

export default function ReceivableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const receivableId = params?.id as string;
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [receivable, setReceivable] = useState<ReceivableItem | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [activities, setActivities] = useState<CollectionActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [paymentModal, setPaymentModal] = useState<PaymentModalData>({
    isOpen: false,
    amount: 0,
    currency: 'NGN',
    method: 'BANK_TRANSFER',
    paidAt: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    isSaving: false,
  });

  const [promiseModal, setPromiseModal] = useState<PromiseModalData>({
    isOpen: false,
    amount: 0,
    currency: 'NGN',
    promisedFor: '',
    notes: '',
    isSaving: false,
  });

  const [showPrintModal, setShowPrintModal] = useState(false);

  const currency = receivable?.currency || organization?.currency || 'NGN';

  const loadData = useCallback(async () => {
    if (!receivableId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [recRes, paysRes, commsRes, actsRes] = await Promise.allSettled([
        receivablesApi.getById(receivableId),
        paymentsApi.list({ receivableId }),
        commitmentsApi.getCommitments({ receivableId }),
        collectionActivitiesApi.getActivities({ receivableId }),
      ]);

      if (recRes.status === 'fulfilled') setReceivable(recRes.value);
      if (paysRes.status === 'fulfilled') setPayments(Array.isArray(paysRes.value) ? paysRes.value : []);
      if (commsRes.status === 'fulfilled') setCommitments(Array.isArray(commsRes.value) ? commsRes.value : []);
      if (actsRes.status === 'fulfilled') setActivities(Array.isArray(actsRes.value) ? actsRes.value : []);
    } catch (err: any) {
      console.warn('Failed to load receivable details:', err);
      setError(err?.message || 'Failed to load receivable from live API.');
    } finally {
      setIsLoading(false);
    }
  }, [receivableId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Cancel / Void Invoice
  const handleCancelInvoice = async () => {
    if (!window.confirm('Are you sure you want to cancel and void this receivable invoice?')) {
      return;
    }

    setIsCancelling(true);
    try {
      await receivablesApi.cancel(receivableId);
      setToastMessage('Invoice has been cancelled.');
      setTimeout(() => setToastMessage(null), 3500);
      loadData();
    } catch (err: any) {
      alert(`Could not cancel invoice: ${err?.message || 'Server error'}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = () => {
    const bal = receivable ? (parseFloat(String(receivable.balance)) || parseFloat(String(receivable.originalAmount))) : 0;
    setPaymentModal({
      isOpen: true,
      amount: bal,
      currency: receivable?.currency || currency,
      method: 'BANK_TRANSFER',
      paidAt: new Date().toISOString().split('T')[0],
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      notes: 'Direct settlement against invoice',
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
        receivableId,
        customerId: receivable?.customerId,
        amount: Number(paymentModal.amount),
        method: paymentModal.method,
        paidAt: new Date(paymentModal.paidAt).toISOString(),
        reference: paymentModal.reference.trim() || undefined,
        notes: paymentModal.notes.trim() || undefined,
      });

      setToastMessage(`Payment of ${formatCurrency(paymentModal.amount, currency)} recorded successfully!`);
      setTimeout(() => setToastMessage(null), 3500);
      setPaymentModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadData();
    } catch (err: any) {
      alert(`Could not record payment: ${err?.message || 'Server error'}`);
      setPaymentModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Open Promise Modal
  const handleOpenPromiseModal = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateStr = nextDate.toISOString().split('T')[0];
    const bal = receivable ? (parseFloat(String(receivable.balance)) || parseFloat(String(receivable.originalAmount))) : 0;

    setPromiseModal({
      isOpen: true,
      amount: bal,
      currency: receivable?.currency || currency,
      promisedFor: dateStr,
      notes: `Agreed promise date for invoice ${receivable?.reference || receivableId.slice(0, 8)}`,
      isSaving: false,
    });
  };

  // Save Promise
  const handleSavePromise = async () => {
    if (!promiseModal.amount || promiseModal.amount <= 0 || !promiseModal.promisedFor) {
      alert('Please specify an amount and agreed payment date.');
      return;
    }

    if (!receivable?.customerId) {
      alert('Missing customer profile for this invoice.');
      return;
    }

    setPromiseModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await commitmentsApi.createCommitment({
        customerId: receivable.customerId,
        receivableId,
        amount: Number(promiseModal.amount),
        currency: promiseModal.currency,
        promisedFor: new Date(promiseModal.promisedFor).toISOString(),
        notes: promiseModal.notes,
      });

      try {
        await collectionActivitiesApi.createActivity({
          customerId: receivable.customerId,
          type: 'PAYMENT_REMINDER',
          channel: 'PHONE',
          outcome: 'PROMISED_PAYMENT',
          notes: `Promise recorded for ${formatCurrency(promiseModal.amount, promiseModal.currency)} on ${promiseModal.promisedFor}`,
        });
      } catch {}

      setToastMessage('Payment promise recorded!');
      setTimeout(() => setToastMessage(null), 3000);
      setPromiseModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadData();
    } catch (err: any) {
      alert(`Could not log promise: ${err?.message || 'Server error'}`);
      setPromiseModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
        <Loader2 size={36} className="animate-spin text-teal-500" />
        <span style={{ fontSize: '13px', color: tokens.textSecondary }}>Loading invoice details & audit ledger...</span>
      </div>
    );
  }

  if (error || !receivable) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link href="/receivables" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A581', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span>Back to Invoices & Receivables</span>
        </Link>
        <div style={{ backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '20px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: '700' }}>Error Loading Invoice</span>
          </div>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>{error || 'Invoice not found.'}</p>
        </div>
      </div>
    );
  }

  const origAmount = parseFloat(String(receivable.originalAmount)) || 0;
  const paidAmount = parseFloat(String(receivable.amountPaid)) || 0;
  const balance = parseFloat(String(receivable.balance)) || 0;
  const isOverdue = receivable.isOverdue || (receivable.dueDate && new Date(receivable.dueDate) < new Date() && receivable.status !== 'PAID');
  const percentPaid = origAmount > 0 ? Math.min(100, Math.round((paidAmount / origAmount) * 100)) : 0;
  const isCancelled = receivable.status === 'CANCELLED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
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

      {/* Navigation & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Link
          href="/receivables"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: tokens.textSecondary,
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>Invoices & Receivables</span>
        </Link>

        {/* Action Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Print Slip */}
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Printer size={14} color="#00A581" />
            <span>Print Invoice Slip</span>
          </button>

          {/* Record Payment */}
          {balance > 0 && !isCancelled && (
            <button
              type="button"
              onClick={handleOpenPaymentModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#16A34A',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
              }}
            >
              <DollarSign size={14} />
              <span>Record Payment</span>
            </button>
          )}

          {/* Log Promise */}
          {balance > 0 && !isCancelled && (
            <button
              type="button"
              onClick={handleOpenPromiseModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.4)'}`,
                color: isLight ? '#D97706' : '#FCD34D',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <CalendarCheck size={14} />
              <span>Log Promise</span>
            </button>
          )}

          {/* Draft WhatsApp Reminder */}
          {receivable.customerId && balance > 0 && !isCancelled && (
            <Link
              href={`/messages/draft?customerId=${receivable.customerId}&receivableId=${receivable.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00A581 0%, #007D62 100%)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: '700',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0, 165, 129, 0.3)',
              }}
            >
              <MessageSquareQuote size={14} />
              <span>WhatsApp Reminder</span>
            </Link>
          )}

          {/* Cancel Invoice */}
          {receivable.status !== 'PAID' && !isCancelled && (
            <button
              type="button"
              onClick={handleCancelInvoice}
              disabled={isCancelling}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.4)'}`,
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: '700',
                cursor: isCancelling ? 'not-allowed' : 'pointer',
              }}
            >
              {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
              <span>Cancel Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Executive Invoice Summary & Financial Progress Meter */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '16px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: '24px 28px',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: '900', color: tokens.textPrimary, margin: 0 }}>
                {receivable.reference || `REC-${receivable.id.slice(0, 8)}`}
              </h1>
              <span style={{
                backgroundColor: receivable.status === 'PAID' ? '#DCFCE7' : isOverdue ? '#FEE2E2' : receivable.status === 'CANCELLED' ? '#F1F5F9' : '#FEF3C7',
                color: receivable.status === 'PAID' ? '#16A34A' : isOverdue ? '#DC2626' : receivable.status === 'CANCELLED' ? '#64748B' : '#D97706',
                border: `1px solid ${receivable.status === 'PAID' ? '#86EFAC' : isOverdue ? '#FCA5A5' : '#CBD5E1'}`,
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: '800',
              }}>
                {isCancelled ? 'CANCELLED / VOID' : isOverdue && receivable.status !== 'PAID' ? 'OVERDUE' : receivable.status}
              </span>
            </div>

            <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: tokens.textSecondary }}>
              {receivable.description || 'Trade credit commercial invoice'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '12.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
              <span>Issued: <strong>{formatDate(receivable.issuedAt || receivable.createdAt)}</strong></span>
              <span>•</span>
              <span>Due: <strong style={{ color: isOverdue ? '#DC2626' : tokens.textPrimary }}>{receivable.dueDate ? formatDate(receivable.dueDate) : 'No due date'}</strong></span>
              {isOverdue && !isCancelled && (
                <>
                  <span>•</span>
                  <span style={{ color: '#DC2626', fontWeight: '800' }}>
                    ⚠️ {receivable.daysOverdue || Math.round((new Date().getTime() - new Date(receivable.dueDate).getTime()) / (1000 * 3600 * 24))} days overdue
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Balance KPIs */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: tokens.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>
                Invoice Total
              </span>
              <div style={{ fontSize: '24px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(origAmount, currency)}
              </div>
            </div>

            <div style={{ textAlign: 'right', borderLeft: `1px solid ${tokens.surfaceBorder}`, paddingLeft: '20px' }}>
              <span style={{ fontSize: '11px', color: balance > 0 ? (isOverdue ? '#DC2626' : tokens.textSecondary) : '#16A34A', fontWeight: '700', textTransform: 'uppercase' }}>
                Remaining Balance Due
              </span>
              <div style={{ fontSize: '24px', fontWeight: '900', color: balance > 0 ? (isOverdue ? '#EF4444' : tokens.textPrimary) : '#16A34A', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(balance, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
            <span style={{ color: tokens.textSecondary }}>
              Settlement Progress: {percentPaid}% Recovered
            </span>
            <span style={{ color: '#00A581', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(paidAmount, currency)} paid of {formatCurrency(origAmount, currency)}
            </span>
          </div>
          <div style={{ height: '8px', backgroundColor: isLight ? '#E2E8F0' : '#001424', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${percentPaid}%`,
                background: percentPaid === 100 ? '#16A34A' : 'linear-gradient(90deg, #00A581 0%, #10B981 100%)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Customer Context Card */}
      {receivable.customer && (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Customer / Debtor Account
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <Link
                href={`/customers/${receivable.customerId}`}
                style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, textDecoration: 'none' }}
              >
                {receivable.customer.name}
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '12.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
              {receivable.customer.phone && (
                <>
                  <a href={`tel:${receivable.customer.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00A581', textDecoration: 'none', fontWeight: '600' }}>
                    <Phone size={12} />
                    <span>{receivable.customer.phone}</span>
                  </a>
                  <a
                    href={`https://wa.me/${receivable.customer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16A34A', textDecoration: 'none', fontWeight: '700' }}
                  >
                    <MessageSquareQuote size={12} />
                    <span>WhatsApp Chat</span>
                  </a>
                </>
              )}
              {receivable.customer.email && (
                <a href={`mailto:${receivable.customer.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: tokens.textPrimary, textDecoration: 'none' }}>
                  <Mail size={12} color={tokens.textMuted} />
                  <span>{receivable.customer.email}</span>
                </a>
              )}
            </div>
          </div>

          <Link
            href={`/customers/${receivable.customerId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#F1F5F9' : '#001424',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <span>Open Debtor 360° Ledger</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* 3. Verified Payments History */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${tokens.surfaceBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: tokens.textPrimary }}>
            Payment Receipts & Settlements ({payments.length})
          </h3>
          {balance > 0 && !isCancelled && (
            <button
              type="button"
              onClick={handleOpenPaymentModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#16A34A',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>Record Settlement</span>
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: tokens.textSecondary }}>
            <DollarSign size={28} color={tokens.textMuted} style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>No payments logged against this invoice yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', borderBottom: `1px solid ${tokens.surfaceBorder}`, textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px', color: tokens.textMuted, fontWeight: '700' }}>Date</th>
                  <th style={{ padding: '10px 16px', color: tokens.textMuted, fontWeight: '700' }}>Amount Paid</th>
                  <th style={{ padding: '10px 16px', color: tokens.textMuted, fontWeight: '700' }}>Method</th>
                  <th style={{ padding: '10px 16px', color: tokens.textMuted, fontWeight: '700' }}>Reference</th>
                  <th style={{ padding: '10px 16px', color: tokens.textMuted, fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                    <td style={{ padding: '12px 16px', color: tokens.textPrimary }}>{formatDate(p.paidAt || p.createdAt)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '800', color: '#00A581' }}>
                      {formatCurrency(Number(p.amount), p.currency || currency)}
                    </td>
                    <td style={{ padding: '12px 16px', color: tokens.textSecondary }}>{p.method}</td>
                    <td style={{ padding: '12px 16px', color: tokens.textSecondary }}>{p.reference || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Payment Commitments & Outreach History */}
      {commitments.length > 0 && (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800', color: tokens.textPrimary }}>
            Payment Commitments Logged ({commitments.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {commitments.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', backgroundColor: isLight ? '#F8FAFC' : '#001424' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '12.5px', color: tokens.textPrimary }}>
                    Promised Date: {formatDate(c.promisedFor)}
                  </span>
                  {c.notes && <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.textSecondary }}>{c.notes}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: tokens.textPrimary }}>
                    {formatCurrency(Number(c.amount), c.currency || currency)}
                  </div>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '700',
                    color: c.status === 'FULFILLED' ? '#16A34A' : c.status === 'MISSED' ? '#DC2626' : '#D97706',
                  }}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Invoice Slip Modal */}
      {showPrintModal && (
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
          onClick={() => setShowPrintModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
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
            {/* Slip Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#00A581' }}>
                  {organization?.name || 'Commercial Invoice'}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Trade Credit Voucher</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Invoice Ref</span>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>
                  {receivable.reference || `REC-${receivable.id.slice(0, 8)}`}
                </div>
              </div>
            </div>

            {/* Slip Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Billed To</span>
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>{receivable.customer?.name}</strong>
                {receivable.customer?.phone && <div style={{ color: '#64748B' }}>{receivable.customer.phone}</div>}
                {receivable.customer?.address && <div style={{ color: '#64748B' }}>{receivable.customer.address}</div>}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div><span style={{ color: '#64748B' }}>Issued:</span> <strong>{formatDate(receivable.issuedAt || receivable.createdAt)}</strong></div>
                <div><span style={{ color: '#64748B' }}>Due Date:</span> <strong>{receivable.dueDate ? formatDate(receivable.dueDate) : 'On Demand'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Status:</span> <strong>{receivable.status}</strong></div>
              </div>
            </div>

            {/* Slip Items */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '12px', color: '#475569' }}>
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>{receivable.description || 'Trade credit commercial items'}</span>
                <strong style={{ color: '#0F172A' }}>{formatCurrency(origAmount, currency)}</strong>
              </div>
            </div>

            {/* Summary Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Total Original Amount:</span>
                <strong>{formatCurrency(origAmount, currency)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                <span>Total Amount Paid:</span>
                <strong>- {formatCurrency(paidAmount, currency)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', borderTop: '2px solid #0F172A', paddingTop: '8px', color: '#0F172A' }}>
                <span>Balance Due:</span>
                <span>{formatCurrency(balance, currency)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
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
                <span>Print Document</span>
              </button>
            </div>
          </div>
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
                  Record Payment Received
                </h3>
              </div>
              <button
                onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Amount Paid ({paymentModal.currency}) *
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
