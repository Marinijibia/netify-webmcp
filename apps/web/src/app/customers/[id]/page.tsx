'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  customersApi, 
  receivablesApi, 
  paymentsApi, 
  commitmentsApi, 
  collectionActivitiesApi, 
  businessMemoryApi,
  aiApi,
  CustomerItem,
  ReceivableItem,
  PaymentItem,
  PaymentCommitmentItem,
  CollectionActivityItem,
  BusinessMemoryItem,
  CustomerExplanationData,
  ActivityOutcome,
  CollectionChannel
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  Users, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquareQuote, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw,
  TrendingUp,
  CalendarCheck,
  PhoneCall,
  Bot,
  Receipt,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  CreditCard,
  Download,
  Edit3,
  DollarSign
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

interface PromiseModalData {
  isOpen: boolean;
  amount: number;
  currency: string;
  promisedFor: string;
  notes: string;
  isSaving: boolean;
}

interface CallModalData {
  isOpen: boolean;
  channel: CollectionChannel;
  outcome: ActivityOutcome;
  notes: string;
  isSaving: boolean;
}

interface PaymentModalData {
  isOpen: boolean;
  receivableId: string;
  amount: number;
  method: string;
  paidAt: string;
  reference: string;
  notes: string;
  isSaving: boolean;
}

interface EditCustomerModalData {
  isOpen: boolean;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isSaving: boolean;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [activities, setActivities] = useState<CollectionActivityItem[]>([]);
  const [memories, setMemories] = useState<BusinessMemoryItem[]>([]);
  const [aiExplanation, setAiExplanation] = useState<CustomerExplanationData | null>(null);

  const [activeTab, setActiveTab] = useState<'RECEIVABLES' | 'PAYMENTS' | 'COMMITMENTS' | 'TIMELINE'>('RECEIVABLES');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-line Modals
  const [promiseModal, setPromiseModal] = useState<PromiseModalData>({
    isOpen: false,
    amount: 0,
    currency: 'NGN',
    promisedFor: '',
    notes: '',
    isSaving: false,
  });

  const [callModal, setCallModal] = useState<CallModalData>({
    isOpen: false,
    channel: 'PHONE',
    outcome: 'CONTACTED',
    notes: '',
    isSaving: false,
  });

  const [paymentModal, setPaymentModal] = useState<PaymentModalData>({
    isOpen: false,
    receivableId: '',
    amount: 0,
    method: 'BANK_TRANSFER',
    paidAt: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    isSaving: false,
  });

  const [editModal, setEditModal] = useState<EditCustomerModalData>({
    isOpen: false,
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    isSaving: false,
  });

  const currency = customer?.currency || organization?.currency || 'NGN';

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch customer profile
      const cust = await customersApi.getById(customerId);
      setCustomer(cust);

      // 2. Fetch associated sub-resources in parallel
      const [recsRes, paysRes, commsRes, actsRes, memsRes] = await Promise.allSettled([
        receivablesApi.list({ customerId }),
        paymentsApi.list({ customerId }),
        commitmentsApi.getCommitments({ customerId }),
        collectionActivitiesApi.getActivities({ customerId }),
        businessMemoryApi.getCustomerMemories(customerId),
      ]);

      if (recsRes.status === 'fulfilled') setReceivables(Array.isArray(recsRes.value) ? recsRes.value : []);
      if (paysRes.status === 'fulfilled') setPayments(Array.isArray(paysRes.value) ? paysRes.value : []);
      if (commsRes.status === 'fulfilled') setCommitments(Array.isArray(commsRes.value) ? commsRes.value : []);
      if (actsRes.status === 'fulfilled') setActivities(Array.isArray(actsRes.value) ? actsRes.value : []);
      if (memsRes.status === 'fulfilled') setMemories(Array.isArray(memsRes.value) ? memsRes.value : []);

      // 3. Attempt AI explanation in background
      try {
        const exp = await aiApi.explainCustomer(customerId);
        setAiExplanation(exp);
      } catch (aiErr) {
        console.warn('AI explanation not available for this customer:', aiErr);
      }
    } catch (err: any) {
      console.warn('Failed to load customer details from API:', err);
      setError(err?.message || 'Failed to load customer details from live API.');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  // Handle Log Promise
  const handleOpenPromiseModal = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateStr = nextDate.toISOString().split('T')[0];

    const outstanding = customer?.totalOverdue && customer.totalOverdue > 0 
      ? customer.totalOverdue 
      : (customer?.totalOutstanding || 0);

    setPromiseModal({
      isOpen: true,
      amount: outstanding,
      currency: customer?.currency || currency,
      promisedFor: dateStr,
      notes: 'Customer agreed to settle balance via WhatsApp/Phone',
      isSaving: false,
    });
  };

  const handleSavePromise = async () => {
    if (!promiseModal.amount || promiseModal.amount <= 0 || !promiseModal.promisedFor) {
      alert('Please enter a valid amount and promised payment date.');
      return;
    }

    setPromiseModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await commitmentsApi.createCommitment({
        customerId,
        amount: Number(promiseModal.amount),
        currency: promiseModal.currency,
        promisedFor: new Date(promiseModal.promisedFor).toISOString(),
        notes: promiseModal.notes,
      });

      try {
        await collectionActivitiesApi.createActivity({
          customerId,
          type: 'PAYMENT_REMINDER',
          channel: 'PHONE',
          outcome: 'PROMISED_PAYMENT',
          notes: `Promise recorded for ${formatCurrency(promiseModal.amount, promiseModal.currency)} on ${promiseModal.promisedFor}`,
        });
      } catch {}

      setToastMessage('Payment promise recorded!');
      setTimeout(() => setToastMessage(null), 3000);
      setPromiseModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadCustomerData();
    } catch (err: any) {
      alert(`Could not log promise: ${err?.message || 'Server error'}`);
      setPromiseModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Handle Log Call
  const handleSaveCall = async () => {
    setCallModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await collectionActivitiesApi.createActivity({
        customerId,
        type: 'CALL',
        channel: callModal.channel,
        outcome: callModal.outcome,
        notes: callModal.notes,
      });

      setToastMessage('Call activity logged!');
      setTimeout(() => setToastMessage(null), 3000);
      setCallModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadCustomerData();
    } catch (err: any) {
      alert(`Could not log call: ${err?.message || 'Server error'}`);
      setCallModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Handle Open Payment Modal
  const handleOpenPaymentModal = (recId?: string, defaultAmt?: number) => {
    const outstanding = defaultAmt || (customer?.totalOutstanding || 0);
    setPaymentModal({
      isOpen: true,
      receivableId: recId || '',
      amount: outstanding,
      method: 'BANK_TRANSFER',
      paidAt: new Date().toISOString().split('T')[0],
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      notes: 'Customer direct settlement',
      isSaving: false,
    });
  };

  // Handle Save Payment
  const handleSavePayment = async () => {
    if (!paymentModal.amount || paymentModal.amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setPaymentModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await paymentsApi.record({
        customerId,
        receivableId: paymentModal.receivableId || undefined,
        amount: Number(paymentModal.amount),
        method: paymentModal.method,
        paidAt: new Date(paymentModal.paidAt).toISOString(),
        reference: paymentModal.reference || undefined,
        notes: paymentModal.notes || undefined,
      });

      setToastMessage(`Payment of ${formatCurrency(paymentModal.amount, currency)} recorded!`);
      setTimeout(() => setToastMessage(null), 3500);
      setPaymentModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadCustomerData();
    } catch (err: any) {
      alert(`Could not record payment: ${err?.message || 'Server error'}`);
      setPaymentModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = () => {
    if (!customer) return;
    setEditModal({
      isOpen: true,
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
      isSaving: false,
    });
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!editModal.name.trim()) {
      alert('Customer name is required.');
      return;
    }

    setEditModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await customersApi.update(customerId, {
        name: editModal.name.trim(),
        phone: editModal.phone.trim() || undefined,
        email: editModal.email.trim() || undefined,
        address: editModal.address.trim() || undefined,
        notes: editModal.notes.trim() || undefined,
      });

      setToastMessage('Customer profile updated!');
      setTimeout(() => setToastMessage(null), 3000);
      setEditModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadCustomerData();
    } catch (err: any) {
      alert(`Could not update customer: ${err?.message || 'Server error'}`);
      setEditModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Export Customer Statement CSV
  const handleExportStatement = () => {
    if (!customer) return;

    const headers = ['Date', 'Type', 'Reference / Description', 'Debit (Invoice)', 'Credit (Payment)', 'Status'];
    const entries: any[] = [];

    receivables.forEach((r) => {
      entries.push({
        date: r.dueDate || r.createdAt,
        type: 'INVOICE',
        ref: r.reference || `REC-${r.id.slice(0, 8)}`,
        debit: Number(r.originalAmount),
        credit: 0,
        status: r.status,
      });
    });

    payments.forEach((p) => {
      entries.push({
        date: p.paidAt || p.createdAt,
        type: 'PAYMENT',
        ref: p.reference || `PAY-${p.id.slice(0, 8)}`,
        debit: 0,
        credit: Number(p.amount),
        status: p.status,
      });
    });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rows = entries.map((e) => [
      `"${formatDate(e.date)}"`,
      e.type,
      `"${e.ref.replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.status,
    ]);

    const csvContent = [
      `"Customer Statement: ${customer.name.replace(/"/g, '""')}"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      `"Total Outstanding: ${formatCurrency(customer.totalOutstanding || 0, currency)}"`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
        <Loader2 size={36} className="animate-spin text-teal-500" />
        <span style={{ fontSize: '13px', color: tokens.textSecondary }}>Loading 360° debtor ledger & memory...</span>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link href="/customers" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A581', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span>Back to Customer Directory</span>
        </Link>
        <div style={{ backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '20px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: '700' }}>Error Loading Customer</span>
          </div>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>{error || 'Customer profile not found.'}</p>
        </div>
      </div>
    );
  }

  const outstanding = customer.totalOutstanding || 0;
  const overdue = customer.totalOverdue || 0;
  const isHighRisk = (customer.riskScore ?? 0) >= 60 || customer.riskLevel === 'HIGH' || customer.riskLevel === 'CRITICAL';
  const isMediumRisk = (customer.riskScore ?? 0) >= 35 || customer.riskLevel === 'MEDIUM';

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

      {/* Back Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Link
          href="/customers"
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
          <span>Customer Directory</span>
        </Link>

        {/* Action Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Download Statement */}
          <button
            type="button"
            onClick={handleExportStatement}
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
            <Download size={14} color="#00A581" />
            <span>Statement CSV</span>
          </button>

          {/* Edit Profile */}
          <button
            type="button"
            onClick={handleOpenEditModal}
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
            <Edit3 size={14} color={tokens.textMuted} />
            <span>Edit Profile</span>
          </button>

          {/* Record Payment */}
          <button
            type="button"
            onClick={() => handleOpenPaymentModal()}
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

          {/* Log Promise */}
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

          {/* Log Call */}
          <button
            type="button"
            onClick={() => setCallModal({ isOpen: true, channel: 'PHONE', outcome: 'CONTACTED', notes: '', isSaving: false })}
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
            <PhoneCall size={14} color="#00A581" />
            <span>Log Call</span>
          </button>

          {/* Draft Follow-up Bridge */}
          <Link
            href={`/messages/draft?customerId=${customerId}`}
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
            <span>Draft Follow-Up</span>
          </Link>
        </div>
      </div>

      {/* 1. Debtor Header & Financial Summary Card */}
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
                {customer.name}
              </h1>
              <span style={{
                backgroundColor: isHighRisk ? '#FEE2E2' : isMediumRisk ? '#FFFBEB' : tokens.accentSoft,
                color: isHighRisk ? '#DC2626' : isMediumRisk ? '#D97706' : '#00A581',
                border: `1px solid ${isHighRisk ? '#FCA5A5' : isMediumRisk ? '#FDE68A' : tokens.accentBorder}`,
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: '800',
              }}>
                {isHighRisk ? 'HIGH RISK' : isMediumRisk ? 'MEDIUM RISK' : 'LOW RISK'} • {customer.riskScore || 0}%
              </span>
            </div>

            {/* Omnichannel Contact Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '13px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#00A581', textDecoration: 'none', fontWeight: '600' }}
                >
                  <Phone size={13} />
                  <span>{customer.phone}</span>
                </a>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: tokens.textPrimary, textDecoration: 'none' }}
                >
                  <Mail size={13} color={tokens.textMuted} />
                  <span>{customer.email}</span>
                </a>
              )}
              {customer.address && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={13} color={tokens.textMuted} />
                  <span>{customer.address}</span>
                </span>
              )}
            </div>
          </div>

          {/* Balance KPIs */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11.5px', color: tokens.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>
                Total Outstanding
              </span>
              <div style={{ fontSize: '24px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
                {formatCurrency(outstanding, currency)}
              </div>
            </div>

            <div style={{ textAlign: 'right', borderLeft: `1px solid ${tokens.surfaceBorder}`, paddingLeft: '20px' }}>
              <span style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: '700', textTransform: 'uppercase' }}>
                Past Due Overdue
              </span>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px' }}>
                {formatCurrency(overdue, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Behavioral Business Memory Intelligence Card */}
      {memories.length > 0 && (
        <div style={{
          backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.7)',
          border: '1px solid rgba(0, 165, 129, 0.4)',
          borderRadius: '14px',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="#00A581" />
            <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: tokens.textPrimary }}>
              Behavioral Business Memory Intelligence
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {memories.map((m) => (
              <div key={m.id} style={{ fontSize: '12.5px', color: tokens.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#00A581' }}>•</span>
                <span>{m.statement}</span>
                <span style={{ fontSize: '10.5px', color: tokens.textMuted }}>({Math.round(m.confidence * 100)}% confidence)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sub-Ledger Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
        paddingBottom: '4px',
        overflowX: 'auto',
      }}>
        {[
          { key: 'RECEIVABLES', label: `Invoices & Receivables (${receivables.length})` },
          { key: 'PAYMENTS', label: `Payments & Receipts (${payments.length})` },
          { key: 'COMMITMENTS', label: `Payment Promises (${commitments.length})` },
          { key: 'TIMELINE', label: `Outreach Timeline (${activities.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? '700' : '500',
              color: activeTab === tab.key ? '#00A581' : tokens.textSecondary,
              backgroundColor: activeTab === tab.key ? tokens.accentSoft : 'transparent',
              border: activeTab === tab.key ? `1px solid ${tokens.accentBorder}` : '1px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Content */}

      {/* TAB 1: RECEIVABLES */}
      {activeTab === 'RECEIVABLES' && (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          overflow: 'hidden',
        }}>
          {receivables.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: tokens.textSecondary }}>
              <FileText size={32} color={tokens.textMuted} style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '13.5px' }}>No invoices logged for this customer yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', borderBottom: `1px solid ${tokens.surfaceBorder}`, textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Reference</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Original Amount</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Paid Amount</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Due Date</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Status</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((rec) => {
                    const paid = (rec.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
                    const isOverdue = rec.dueDate && new Date(rec.dueDate) < new Date() && rec.status !== 'PAID';
                    const remaining = Math.max(0, Number(rec.originalAmount) - paid);

                    return (
                      <tr key={rec.id} style={{ borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: tokens.textPrimary }}>
                          <Link href={`/receivables/${rec.id}`} style={{ color: '#00A581', textDecoration: 'none' }}>
                            {rec.reference || `REC-${rec.id.slice(0, 8)}`}
                          </Link>
                        </td>
                        <td style={{ padding: '12px 16px', color: tokens.textPrimary, fontWeight: '600' }}>
                          {formatCurrency(Number(rec.originalAmount), rec.currency || currency)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#00A581', fontWeight: '600' }}>
                          {formatCurrency(paid, rec.currency || currency)}
                        </td>
                        <td style={{ padding: '12px 16px', color: isOverdue ? '#DC2626' : tokens.textSecondary }}>
                          {rec.dueDate ? formatDate(rec.dueDate) : 'No Due Date'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: rec.status === 'PAID' ? '#DCFCE7' : isOverdue ? '#FEE2E2' : '#FEF3C7',
                            color: rec.status === 'PAID' ? '#16A34A' : isOverdue ? '#DC2626' : '#D97706',
                          }}>
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {remaining > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(rec.id, remaining)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#16A34A',
                                color: '#FFFFFF',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              Pay
                            </button>
                          )}
                          <Link href={`/receivables/${rec.id}`} style={{ color: tokens.textSecondary, textDecoration: 'none', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <span>Inspect</span>
                            <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          overflow: 'hidden',
        }}>
          {payments.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: tokens.textSecondary }}>
              <Receipt size={32} color={tokens.textMuted} style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '13.5px' }}>No payments recorded for this customer yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', borderBottom: `1px solid ${tokens.surfaceBorder}`, textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Date</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Amount</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Method</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Reference</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                      <td style={{ padding: '12px 16px', color: tokens.textPrimary }}>{formatDate(p.paidAt || p.createdAt)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '800', color: '#00A581' }}>{formatCurrency(Number(p.amount), p.currency || currency)}</td>
                      <td style={{ padding: '12px 16px', color: tokens.textSecondary }}>{p.method || 'BANK_TRANSFER'}</td>
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
      )}

      {/* TAB 3: COMMITMENTS */}
      {activeTab === 'COMMITMENTS' && (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          overflow: 'hidden',
        }}>
          {commitments.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: tokens.textSecondary }}>
              <CalendarCheck size={32} color={tokens.textMuted} style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '13.5px' }}>No verbal payment commitments recorded yet.</p>
              <button
                type="button"
                onClick={handleOpenPromiseModal}
                style={{
                  marginTop: '12px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Log First Promise
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#001D31', borderBottom: `1px solid ${tokens.surfaceBorder}`, textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Promised Date</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Amount</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Notes</th>
                    <th style={{ padding: '12px 16px', color: tokens.textMuted, fontWeight: '700' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commitments.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: tokens.textPrimary }}>{formatDate(c.promisedFor)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '800', color: tokens.textPrimary }}>{formatCurrency(Number(c.amount), c.currency || currency)}</td>
                      <td style={{ padding: '12px 16px', color: tokens.textSecondary }}>{c.notes || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: c.status === 'FULFILLED' ? '#DCFCE7' : c.status === 'MISSED' ? '#FEE2E2' : '#FEF3C7',
                          color: c.status === 'FULFILLED' ? '#16A34A' : c.status === 'MISSED' ? '#DC2626' : '#D97706',
                        }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '24px',
        }}>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: tokens.textSecondary, padding: '30px 0' }}>
              <Clock size={32} color={tokens.textMuted} style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '13.5px' }}>No collection activities logged for this customer yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: tokens.accentSoft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00A581',
                    flexShrink: 0,
                  }}>
                    {act.channel === 'PHONE' ? <Phone size={15} /> : <MessageSquareQuote size={15} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: tokens.textPrimary }}>
                        {act.type} via {act.channel}
                      </span>
                      <span style={{ fontSize: '11.5px', color: tokens.textMuted }}>
                        {formatDate(act.occurredAt || act.createdAt)}
                      </span>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '2px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: act.outcome === 'PROMISED_PAYMENT' ? '#16A34A' : '#D97706',
                    }}>
                      Outcome: {act.outcome}
                    </span>
                    {act.notes && (
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: tokens.textSecondary }}>
                        {act.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
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

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Log a payment from <strong>{customer.name}</strong> to reduce outstanding exposure and update debtor ledgers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Payment Amount ({currency}) *
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

      {/* Edit Profile Modal */}
      {editModal.isOpen && (
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
          onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
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
                <Edit3 size={18} color="#00A581" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Edit Customer Profile
                </h3>
              </div>
              <button
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editModal.phone}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, phone: e.target.value }))}
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

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editModal.email}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, email: e.target.value }))}
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
                  Address
                </label>
                <input
                  type="text"
                  value={editModal.address}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, address: e.target.value }))}
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
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
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
                onClick={handleSaveEdit}
                disabled={editModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: editModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {editModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Changes</span>
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

      {/* In-Line Call Modal */}
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
                  Log Phone Call Outcome
                </h3>
              </div>
              <button
                onClick={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

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
                onClick={handleSaveCall}
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
                <span>Log Call</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
