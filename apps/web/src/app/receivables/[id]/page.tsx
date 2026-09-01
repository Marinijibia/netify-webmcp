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
  Building
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

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
  const [error, setError] = useState<string | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'POS' | 'MOBILE_MONEY' | 'OTHER'>('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const currency = receivable?.currency || organization?.currency || 'NGN';

  const loadData = useCallback(async () => {
    if (!receivableId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [rec, pays, comms, acts] = await Promise.all([
        receivablesApi.getById(receivableId),
        paymentsApi.list({ receivableId }),
        commitmentsApi.getCommitments({ receivableId }),
        collectionActivitiesApi.getActivities({ receivableId }),
      ]);
      setReceivable(rec);
      setPayments(pays);
      setCommitments(comms);
      setActivities(acts);
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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) return;

    setIsSubmittingPayment(true);
    try {
      await paymentsApi.record({
        receivableId,
        customerId: receivable?.customerId,
        amount: num,
        method: paymentMethod,
        reference: paymentReference.trim() || undefined,
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReference('');
      await loadData();
    } catch (err: any) {
      console.warn('Failed to record payment:', err);
      alert(err?.message || 'Failed to record payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-teal-400" />
      </div>
    );
  }

  if (error || !receivable) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link href="/receivables" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A581', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span>Back to Receivables</span>
        </Link>
        <div style={{ backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', padding: '20px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
          {error || 'Receivable record not found.'}
        </div>
      </div>
    );
  }

  const isOverdue = receivable.isOverdue || receivable.status === 'OVERDUE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Link */}
      <Link href="/receivables" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A581', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
        <ArrowLeft size={16} />
        <span>Back to Receivables Ledger</span>
      </Link>

      {/* Main Receivable Card */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(18px, 3vw, 28px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
              {receivable.reference || `REC-${receivable.id.slice(0, 8)}`}
            </h2>
            <span style={{
              backgroundColor: isOverdue ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)') : receivable.status === 'PAID' ? tokens.accentSoft : (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)'),
              color: isOverdue ? (isLight ? '#B91C1C' : '#FCA5A5') : receivable.status === 'PAID' ? '#00A581' : (isLight ? '#B45309' : '#FCD34D'),
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              {receivable.status}
            </span>
          </div>

          <p style={{ color: tokens.textSecondary, fontSize: '13px', marginTop: '4px' }}>
            Source: <strong>{receivable.source}</strong> • Created: {formatDate(receivable.createdAt)}
          </p>

          {receivable.customer && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="#00A581" />
              <Link href={`/customers/${receivable.customer.id}`} style={{ color: '#00A581', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none' }}>
                {receivable.customer.name}
              </Link>
              {receivable.customer.phone && (
                <span style={{ color: tokens.textMuted, fontSize: '12px' }}>({receivable.customer.phone})</span>
              )}
            </div>
          )}

          {receivable.description && (
            <p style={{
              marginTop: '12px',
              color: tokens.textPrimary,
              fontSize: '13px',
              backgroundColor: isLight ? '#F8FAFC' : '#001D31',
              padding: '10px 14px',
              borderRadius: '6px',
              border: `1px solid ${tokens.surfaceBorder}`
            }}>
              {receivable.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase' }}>
              {t('commandCenter.totalOutstanding')}
            </span>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: isOverdue ? '#EF4444' : tokens.textPrimary, marginTop: '2px' }}>
              {formatCurrency(receivable.balance, currency)}
            </div>
            <p style={{ fontSize: '12px', color: tokens.textMuted, marginTop: '2px' }}>
              Original: {formatCurrency(receivable.originalAmount, currency)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {receivable.status !== 'PAID' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
                }}
              >
                <DollarSign size={15} />
                <span>Record Payment</span>
              </button>
            )}

            {receivable.customerId && (
              <Link
                href={`/messages/draft?customerId=${receivable.customerId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isLight ? '#FFFFFF' : '#003051',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textSecondary,
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: isLight ? tokens.shadowCard : 'none',
                }}
              >
                <MessageSquareQuote size={15} />
                <span>{t('common.followUp')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Payments & Commitments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {/* Payments History */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '20px',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          minWidth: 0,
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '14px' }}>
            Payment History ({payments.length})
          </h3>

          {payments.length === 0 ? (
            <p style={{ color: tokens.textMuted, fontSize: '13px', textAlign: 'center', padding: '24px' }}>
              No payments recorded against this invoice yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payments.map((p) => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                  borderRadius: '6px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  flexWrap: 'wrap',
                  gap: '6px',
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#00A581' }}>
                      {formatCurrency(p.amount, p.currency || currency)}
                    </span>
                    <p style={{ fontSize: '11px', color: tokens.textMuted, margin: '2px 0 0' }}>
                      {p.method} {p.reference ? `• Ref: ${p.reference}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
                    {formatDate(p.paidAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Commitments */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '20px',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          minWidth: 0,
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '14px' }}>
            Payment Commitments ({commitments.length})
          </h3>

          {commitments.length === 0 ? (
            <p style={{ color: tokens.textMuted, fontSize: '13px', textAlign: 'center', padding: '24px' }}>
              No promises or payment commitments scheduled for this invoice.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {commitments.map((com) => (
                <div key={com.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                  borderRadius: '6px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  flexWrap: 'wrap',
                  gap: '6px',
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>
                      Promised: {formatCurrency(com.amount, com.currency || currency)}
                    </span>
                    <p style={{ fontSize: '11px', color: tokens.textMuted, margin: '2px 0 0' }}>
                      Due: {formatDate(com.promisedFor)}
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: com.status === 'MISSED' ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)') : tokens.accentSoft,
                    color: com.status === 'MISSED' ? (isLight ? '#B91C1C' : '#FCA5A5') : '#00A581',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '700',
                  }}>
                    {com.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'clamp(12px, 3vw, 20px)',
        }}>
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: 'clamp(12px, 2vw, 16px)',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: 'clamp(20px, 4vw, 28px)',
            width: '100%',
            maxWidth: 'min(440px, calc(100vw - 24px))',
            maxHeight: '92svh',
            overflowY: 'auto',
            boxShadow: isLight ? '0 20px 40px rgba(0,0,0,0.15)' : '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>Record Customer Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: tokens.textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Amount Paid ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${receivable.balance}`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '15px',
                    fontWeight: 'bold',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                  }}
                >
                  <option value="BANK_TRANSFER">Bank Transfer (Direct / Wire)</option>
                  <option value="CASH">Cash Settlement</option>
                  <option value="POS">POS / Card Terminal</option>
                  <option value="MOBILE_MONEY">Mobile Money (M-Pesa, MoMo)</option>
                  <option value="OTHER">Other Settlement</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. GTB/TRF/981240"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    color: tokens.textSecondary,
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  style={{
                    flex: 2,
                    padding: '10px',
                    backgroundColor: '#00A581',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
                  }}
                >
                  {isSubmittingPayment ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
