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

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const { organization } = useAuth();

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
      const [cust, recs, pays, comms, acts] = await Promise.all([
        customersApi.getById(customerId),
        receivablesApi.list({ customerId }),
        paymentsApi.list({ customerId }),
        commitmentsApi.getCommitments({ customerId }),
        collectionActivitiesApi.getActivities({ customerId }),
      ]);

      setCustomer(cust);
      setReceivables(recs);
      setPayments(pays);
      setCommitments(comms);
      setActivities(acts);

      // Attempt AI explanation in background
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
        <Loader2 size={36} className="animate-spin text-teal-400" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Link href="/customers" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A581', fontSize: '13px', fontWeight: '600' }}>
          <ArrowLeft size={16} />
          <span>Back to Customers</span>
        </Link>
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '10px',
          padding: '24px',
          color: '#FCA5A5',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Customer Not Found</h3>
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
      <Link href="/customers" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A581', fontSize: '13px', fontWeight: '600' }}>
        <ArrowLeft size={16} />
        <span>Back to Customer Directory</span>
      </Link>

      {/* Customer Header Profile Card */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: '#00A581',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '22px',
          }}>
            {customer.name[0]}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>{customer.name}</h2>
              <span style={{
                backgroundColor: customer.status === 'ACTIVE' ? 'rgba(0, 165, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                color: customer.status === 'ACTIVE' ? '#3AD0A9' : '#9CA3AF',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                {customer.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#8FB7C7', fontSize: '12.5px' }}>
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

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#8FB7C7', textTransform: 'uppercase' }}>
              Total Outstanding
            </span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px' }}>
              {formatCurrency(totalBalance, currency)}
            </div>
            {overdueCount > 0 && (
              <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600' }}>
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
            }}
          >
            <MessageSquareQuote size={16} />
            <span>Draft Action</span>
          </Link>
        </div>
      </div>

      {/* AI Customer Evidence Explanation */}
      {aiExplanation && (
        <div style={{
          backgroundColor: '#003051',
          borderRadius: '12px',
          border: '1px solid #0F5470',
          padding: '20px 24px',
          display: 'flex',
          gap: '16px',
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 165, 129, 0.15)',
            border: '1px solid rgba(0, 165, 129, 0.3)',
            padding: '10px',
            borderRadius: '10px',
            color: '#00A581',
            alignSelf: 'flex-start',
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '4px' }}>
              AI Evidence Breakdown & Recommended Strategy
            </h4>
            <p style={{ color: '#DCEAF0', fontSize: '13px', lineHeight: '1.5' }}>
              {aiExplanation.summary}
            </p>
            {aiExplanation.recommendation && (
              <p style={{ color: '#3AD0A9', fontSize: '12.5px', marginTop: '6px', fontWeight: '500' }}>
                Recommendation: {aiExplanation.recommendation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #0F5470', paddingBottom: '8px' }}>
        {[
          { key: 'RECEIVABLES', label: `Receivables (${receivables.length})` },
          { key: 'PAYMENTS', label: `Payment History (${payments.length})` },
          { key: 'COMMITMENTS', label: `Commitments (${commitments.length})` },
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
              backgroundColor: activeTab === tab.key ? '#00A581' : '#003051',
              color: activeTab === tab.key ? '#FFFFFF' : '#8FB7C7',
              border: '1px solid #0F5470',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '20px',
      }}>
        {activeTab === 'RECEIVABLES' && (
          <div>
            {receivables.length === 0 ? (
              <p style={{ color: '#8FB7C7', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No open or past receivables logged for this customer.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#8FB7C7', borderBottom: '1px solid #0F5470' }}>
                    <th style={{ padding: '10px 14px' }}>REFERENCE</th>
                    <th style={{ padding: '10px 14px' }}>DUE DATE</th>
                    <th style={{ padding: '10px 14px' }}>STATUS</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>ORIGINAL</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #0F5470' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '600', color: '#FFFFFF' }}>
                        {r.reference || r.id}
                        {r.description && <p style={{ fontSize: '11px', color: '#8FB7C7', fontWeight: 'normal' }}>{r.description}</p>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#DCEAF0' }}>
                        {formatDate(r.dueDate)}
                        {r.daysOverdue > 0 && (
                          <span style={{ color: '#EF4444', fontSize: '11px', marginLeft: '6px', fontWeight: 'bold' }}>
                            ({r.daysOverdue}d overdue)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          backgroundColor: r.status === 'OVERDUE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 165, 129, 0.15)',
                          color: r.status === 'OVERDUE' ? '#FCA5A5' : '#3AD0A9',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#8FB7C7' }}>
                        {formatCurrency(r.originalAmount, r.currency || currency)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#FFFFFF' }}>
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
          <div>
            {payments.length === 0 ? (
              <p style={{ color: '#8FB7C7', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No payments recorded for this customer yet.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#8FB7C7', borderBottom: '1px solid #0F5470' }}>
                    <th style={{ padding: '10px 14px' }}>DATE</th>
                    <th style={{ padding: '10px 14px' }}>METHOD</th>
                    <th style={{ padding: '10px 14px' }}>REFERENCE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #0F5470' }}>
                      <td style={{ padding: '12px 14px', color: '#DCEAF0' }}>{formatDate(p.paidAt)}</td>
                      <td style={{ padding: '12px 14px', color: '#8FB7C7' }}>{p.method}</td>
                      <td style={{ padding: '12px 14px', color: '#8FB7C7' }}>{p.reference || '—'}</td>
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
              <p style={{ color: '#8FB7C7', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
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
                      backgroundColor: '#001D31',
                      borderRadius: '8px',
                      border: '1px solid #0F5470',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                        Promised: {formatCurrency(com.amount, com.currency || currency)} for {formatDate(com.promisedFor)}
                      </p>
                      {com.notes && <p style={{ fontSize: '11.5px', color: '#8FB7C7', marginTop: '2px' }}>{com.notes}</p>}
                    </div>
                    <span style={{
                      backgroundColor: com.status === 'MISSED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 165, 129, 0.15)',
                      color: com.status === 'MISSED' ? '#FCA5A5' : '#3AD0A9',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '600',
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
            {activities.length === 0 ? (
              <p style={{ color: '#8FB7C7', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No collection activities recorded in the timeline yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '14px',
                      backgroundColor: '#001D31',
                      borderRadius: '8px',
                      border: '1px solid #0F5470',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581' }}>
                        {act.channel} • {act.type}
                      </span>
                      <span style={{ fontSize: '11px', color: '#8FB7C7' }}>
                        {formatDate(act.occurredAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#DCEAF0', marginTop: '6px' }}>
                      Outcome: <strong style={{ color: '#FFFFFF' }}>{act.outcome}</strong>
                    </p>
                    {act.notes && (
                      <p style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '4px' }}>
                        {act.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
