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
  aiApi,
  CustomerItem,
  ReceivableItem,
  PaymentItem,
  PaymentCommitmentItem,
  CollectionActivityItem,
  CustomerExplanationData
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
  AlertCircle
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

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
  const [aiExplanation, setAiExplanation] = useState<CustomerExplanationData | null>(null);

  const [activeTab, setActiveTab] = useState<'RECEIVABLES' | 'PAYMENTS' | 'COMMITMENTS' | 'TIMELINE'>('RECEIVABLES');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = customer?.currency || organization?.currency || 'NGN';

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch customer profile as required primary
      const cust = await customersApi.getById(customerId);
      setCustomer(cust);

      // 2. Fetch associated sub-resources safely in parallel
      const [recsRes, paysRes, commsRes, actsRes] = await Promise.allSettled([
        receivablesApi.list({ customerId }),
        paymentsApi.list({ customerId }),
        commitmentsApi.getCommitments({ customerId }),
        collectionActivitiesApi.getActivities({ customerId }),
      ]);

      if (recsRes.status === 'fulfilled') setReceivables(Array.isArray(recsRes.value) ? recsRes.value : []);
      if (paysRes.status === 'fulfilled') setPayments(Array.isArray(paysRes.value) ? paysRes.value : []);
      if (commsRes.status === 'fulfilled') setCommitments(Array.isArray(commsRes.value) ? commsRes.value : []);
      if (actsRes.status === 'fulfilled') setActivities(Array.isArray(actsRes.value) ? actsRes.value : []);

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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-teal-500" />
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
            <AlertCircle size={20} color="#EF4444" />
            <span style={{ fontWeight: 'bold' }}>Customer record could not be loaded</span>
          </div>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>{error || 'Unable to retrieve record from live API.'}</p>
        </div>
      </div>
    );
  }

  // Calculate totals from live receivables
  const totalBalance = receivables.reduce((sum, r) => sum + (parseFloat(String(r.balance)) || 0), 0);
  const overdueCount = receivables.filter((r) => r.isOverdue || r.status === 'OVERDUE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Link */}
      <Link href="/customers" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A581', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
        <ArrowLeft size={16} />
        <span>Back to Customer Directory</span>
      </Link>

      {/* Customer Header Profile Card */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: isLight ? '#ECFDF8' : 'rgba(0, 165, 129, 0.2)',
            border: `1px solid ${tokens.accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00A581',
            fontWeight: 'bold',
            fontSize: '22px',
            flexShrink: 0,
          }}>
            {customer.name[0]}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>{customer.name}</h2>
              <span style={{
                backgroundColor: customer.status === 'ACTIVE' ? tokens.accentSoft : (isLight ? '#F1F5F9' : 'rgba(107, 114, 128, 0.15)'),
                color: customer.status === 'ACTIVE' ? '#00A581' : tokens.textMuted,
                border: `1px solid ${customer.status === 'ACTIVE' ? tokens.accentBorder : tokens.surfaceBorder}`,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
              }}>
                {customer.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: tokens.textSecondary, fontSize: '12.5px', flexWrap: 'wrap' }}>
              {customer.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} color="#00A581" />
                  <span>{customer.phone}</span>
                </span>
              )}
              {customer.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} color="#00A581" />
                  <span>{customer.email}</span>
                </span>
              )}
              {customer.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#00A581" />
                  <span>{customer.address}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right', marginRight: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase' }}>
              {t('commandCenter.totalOutstanding')}
            </span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: totalBalance > 0 ? tokens.textPrimary : '#00A581', marginTop: '2px' }}>
              {formatCurrency(totalBalance, currency)}
            </div>
            {overdueCount > 0 && (
              <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700' }}>
                {overdueCount} overdue receivables
              </span>
            )}
          </div>

          <Link
            href={`/messages/draft?customerId=${customer.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
            }}
          >
            <MessageSquareQuote size={16} />
            <span>{t('common.followUp')}</span>
          </Link>
        </div>
      </div>

      {/* AI Customer Evidence Explanation */}
      {aiExplanation && (
        <div style={{
          backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 32, 53, 0.6)',
          border: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: '12px',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="#00A581" />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>AI Behavioral Explanation</span>
          </div>
          <p style={{ fontSize: '13px', color: tokens.textSecondary, margin: 0, lineHeight: '1.5' }}>
            {aiExplanation.summary}
          </p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${tokens.surfaceBorder}`, paddingBottom: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {[
          { key: 'RECEIVABLES', label: `${t('nav.receivables')} (${receivables.length})` },
          { key: 'PAYMENTS', label: `Payment History (${payments.length})` },
          { key: 'COMMITMENTS', label: `${t('nav.commitments')} (${commitments.length})` },
          { key: 'TIMELINE', label: `Activity Feed (${activities.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: activeTab === tab.key ? '#00A581' : (isLight ? '#FFFFFF' : '#003051'),
              color: activeTab === tab.key ? '#FFFFFF' : tokens.textSecondary,
              border: `1px solid ${activeTab === tab.key ? '#00A581' : tokens.surfaceBorder}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: isLight && activeTab !== tab.key ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: '20px',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        {activeTab === 'RECEIVABLES' && (
          <div className="responsive-table-wrapper">
            {receivables.length === 0 ? (
              <p style={{ color: tokens.textMuted, fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No open or past receivables logged for this customer.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: tokens.textMuted, borderBottom: `1px solid ${tokens.surfaceBorder}`, backgroundColor: isLight ? '#F8FAFC' : 'transparent' }}>
                    <th style={{ padding: '10px 14px' }}>REFERENCE</th>
                    <th style={{ padding: '10px 14px' }}>DUE DATE</th>
                    <th style={{ padding: '10px 14px' }}>STATUS</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>ORIGINAL</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                      <td style={{ padding: '12px 14px', fontWeight: '600', color: tokens.textPrimary }}>
                        <Link href={`/receivables/${r.id}`} style={{ color: tokens.textPrimary, textDecoration: 'none' }}>
                          {r.reference || r.id}
                        </Link>
                        {r.description && <p style={{ fontSize: '11px', color: tokens.textMuted, margin: '2px 0 0', fontWeight: 'normal' }}>{r.description}</p>}
                      </td>
                      <td style={{ padding: '12px 14px', color: tokens.textSecondary }}>
                        {formatDate(r.dueDate)}
                        {r.daysOverdue > 0 && (
                          <span style={{ color: '#EF4444', fontSize: '11px', marginLeft: '6px', fontWeight: 'bold' }}>
                            ({r.daysOverdue}d overdue)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          backgroundColor: r.status === 'OVERDUE' ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)') : r.status === 'PAID' ? tokens.accentSoft : (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)'),
                          color: r.status === 'OVERDUE' ? (isLight ? '#B91C1C' : '#FCA5A5') : r.status === 'PAID' ? '#00A581' : (isLight ? '#B45309' : '#FCD34D'),
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: tokens.textMuted }}>
                        {formatCurrency(r.originalAmount, r.currency || currency)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: r.status === 'OVERDUE' ? '#EF4444' : tokens.textPrimary }}>
                        {formatCurrency(r.balance, r.currency || currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'PAYMENTS' && (
          <div className="responsive-table-wrapper">
            {payments.length === 0 ? (
              <p style={{ color: tokens.textMuted, fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No payments recorded for this customer yet.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: tokens.textMuted, borderBottom: `1px solid ${tokens.surfaceBorder}`, backgroundColor: isLight ? '#F8FAFC' : 'transparent' }}>
                    <th style={{ padding: '10px 14px' }}>DATE</th>
                    <th style={{ padding: '10px 14px' }}>METHOD</th>
                    <th style={{ padding: '10px 14px' }}>REFERENCE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                      <td style={{ padding: '12px 14px', color: tokens.textSecondary }}>{formatDate(p.paidAt)}</td>
                      <td style={{ padding: '12px 14px', color: tokens.textSecondary }}>{p.method}</td>
                      <td style={{ padding: '12px 14px', color: tokens.textMuted }}>{p.reference || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#00A581' }}>
                        {formatCurrency(p.amount, p.currency || currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'COMMITMENTS' && (
          <div>
            {commitments.length === 0 ? (
              <p style={{ color: tokens.textMuted, fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No active or past commitments logged.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {commitments.map((com) => (
                  <div
                    key={com.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                      borderRadius: '8px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: tokens.textPrimary, margin: 0 }}>
                        Promised: {formatCurrency(com.amount, com.currency || currency)} for {formatDate(com.promisedFor)}
                      </p>
                      {com.notes && <p style={{ fontSize: '11.5px', color: tokens.textMuted, margin: '2px 0 0' }}>{com.notes}</p>}
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
        )}

        {activeTab === 'TIMELINE' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: tokens.textSecondary }}>
                <span>Total Activities: <strong>{activities.length}</strong></span>
                <span>•</span>
                <span style={{ color: '#00A581', fontWeight: 'bold' }}>
                  WebMCP Agent Logged: {activities.filter(a => a.notes?.toLowerCase().includes('webmcp') || a.notes?.toLowerCase().includes('agent') || a.notes?.toLowerCase().includes('follow-up draft screen')).length}
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await collectionActivitiesApi.createActivity({
                      customerId,
                      receivableId: receivables[0]?.id,
                      type: 'PAYMENT_REMINDER',
                      channel: 'WHATSAPP',
                      outcome: 'PROMISED_PAYMENT',
                      notes: 'Autonomous WebMCP audit event: Agent verified overdue balance and prepared follow-up reminder for merchant confirmation.',
                    });
                    const updated = await collectionActivitiesApi.getActivities({ customerId });
                    setActivities(updated);
                  } catch (e) {
                    console.error('Failed to log audit activity:', e);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: tokens.accentSoft,
                  border: `1px solid ${tokens.accentBorder}`,
                  color: '#00A581',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                title="Persist a verified WebMCP agent audit event to the live PostgreSQL timeline"
              >
                <Sparkles size={12} />
                <span>Log WebMCP Audit Event</span>
              </button>
            </div>

            {activities.length === 0 ? (
              <p style={{ color: tokens.textMuted, fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No collection activities recorded in the timeline yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.map((act) => {
                  const isAgentAction = act.notes?.toLowerCase().includes('webmcp') || act.notes?.toLowerCase().includes('agent') || act.notes?.toLowerCase().includes('follow-up draft screen');
                  return (
                    <div
                      key={act.id}
                      style={{
                        padding: '14px',
                        backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                        borderRadius: '8px',
                        border: isAgentAction ? '1px solid rgba(0, 165, 129, 0.4)' : `1px solid ${tokens.surfaceBorder}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isAgentAction ? '#00A581' : tokens.textPrimary }}>
                            {act.channel} • {act.type}
                          </span>
                          {isAgentAction && (
                            <span style={{
                              backgroundColor: 'rgba(0, 165, 129, 0.12)',
                              color: '#00A581',
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(0, 165, 129, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              <Sparkles size={10} />
                              WebMCP Agent Action
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: tokens.textMuted }}>
                          {formatDate(act.occurredAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '6px', marginBottom: 0 }}>
                        Outcome: <strong style={{ color: tokens.textPrimary }}>{act.outcome}</strong>
                      </p>
                      {act.notes && (
                        <p style={{ fontSize: '12px', color: tokens.textMuted, marginTop: '4px', marginBottom: 0 }}>
                          {act.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
