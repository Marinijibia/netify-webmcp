'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  receivablesApi, 
  customersApi, 
  CustomerItem 
} from '@/lib/api';
import { 
  FileText, 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Plus,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

const TERM_OPTIONS = [
  { days: 7, label: 'Net 7 (1 Week)' },
  { days: 14, label: 'Net 14 (2 Weeks)' },
  { days: 30, label: 'Net 30 (1 Month)' },
  { days: 60, label: 'Net 60 (2 Months)' },
];

function CreateReceivableForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [termDays, setTermDays] = useState(14);
  const [source, setSource] = useState<'MANUAL' | 'INVOICE' | 'CREDIT_SALE' | 'OTHER'>('INVOICE');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  // Generate Reference
  const generateReference = () => {
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setReference(`INV-${dateStr}-${rand}`);
  };

  useEffect(() => {
    generateReference();
    async function loadCustomers() {
      try {
        const list = await customersApi.list({ pageSize: 200 });
        setCustomers(list);
        if (!selectedCustomerId && list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      } catch (err: any) {
        console.warn('Failed to load customers for invoice creation:', err);
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, [selectedCustomerId]);

  const calculateDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + termDays);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + termDays);

      const created = await receivablesApi.create({
        customerId: selectedCustomerId,
        amount: num,
        currency,
        dueDate: dueDate.toISOString(),
        description: description.trim() || undefined,
        reference: reference.trim() || undefined,
        source,
        notes: notes.trim() || undefined,
      });

      router.push(`/receivables/${created.id}`);
    } catch (err: any) {
      console.warn('Failed to create receivable:', err);
      setError(err?.message || 'Failed to create receivable invoice in live API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Back Link */}
      <Link
        href="/receivables"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#00A581',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Invoices & Receivables</span>
      </Link>

      {/* Main Card */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '16px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(20px, 4vw, 32px)',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} color="#00A581" />
            <h2 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: '900', color: tokens.textPrimary, margin: 0 }}>
              {t('receivables.addReceivableModalTitle')}
            </h2>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13px', marginTop: '4px' }}>
            Create an official commercial invoice or record credit sales to start recovery workflows.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Customer Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Customer / Debtor *
              </label>
              <Link href="/customers/create" style={{ fontSize: '11.5px', color: '#00A581', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Plus size={12} />
                <span>Add New Customer</span>
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <User size={14} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                disabled={loadingCustomers}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '8px',
                  color: tokens.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {loadingCustomers ? (
                  <option value="">Loading customer directory...</option>
                ) : customers.length === 0 ? (
                  <option value="">No customers found. Please add one first.</option>
                ) : (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Amount & Reference */}
          <div className="responsive-split-2">
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Invoice Amount ({currency}) *
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={14} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '14px',
                    fontWeight: '700',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Invoice Reference
                </label>
                <button
                  type="button"
                  onClick={generateReference}
                  style={{ background: 'none', border: 'none', color: '#00A581', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: 0 }}
                >
                  <RefreshCw size={10} />
                  <span>Regenerate</span>
                </button>
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. INV-2026-001"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '8px',
                  color: tokens.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Payment Terms & Due Date */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Payment Terms & Due Date
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {TERM_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setTermDays(opt.days)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: termDays === opt.days ? '#00A581' : (isLight ? '#F1F5F9' : '#001424'),
                    color: termDays === opt.days ? '#FFFFFF' : tokens.textPrimary,
                    border: termDays === opt.days ? '1px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.08)',
              border: `1px solid ${tokens.accentBorder}`,
              fontSize: '12.5px',
            }}>
              <Clock size={14} color="#00A581" />
              <span style={{ color: tokens.textPrimary }}>
                Calculated Due Date: <strong style={{ color: '#00A581' }}>{calculateDueDate()}</strong> ({termDays} days credit period)
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Itemized Description / Goods Supplied
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 50 Cartons of Cooking Oil & 20 Bags of Sugar"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                color: tokens.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Commercial Terms & Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 5% penalty applies after due date. Bank details included."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                color: tokens.textPrimary,
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link
              href="/receivables"
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: 'transparent',
                color: tokens.textSecondary,
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #00A581 0%, #007D62 100%)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0, 165, 129, 0.3)',
              }}
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>Create Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateReceivablePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    }>
      <CreateReceivableForm />
    </Suspense>
  );
}
