'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  commitmentsApi, 
  PaymentCommitmentItem, 
  CommitmentStatus 
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
  User
} from 'lucide-react';

type CommitmentTab = 'ALL' | 'TODAY' | 'MISSED' | 'UPCOMING' | 'FULFILLED';

export default function CommitmentsPage() {
  const { organization } = useAuth();
  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<CommitmentTab>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadCommitments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let list: PaymentCommitmentItem[] = [];
      if (activeTab === 'TODAY') {
        list = await commitmentsApi.getTodayCommitments();
      } else if (activeTab === 'MISSED') {
        list = await commitmentsApi.getMissedCommitments();
      } else if (activeTab === 'FULFILLED') {
        list = await commitmentsApi.getCommitments({ status: 'FULFILLED' });
      } else if (activeTab === 'UPCOMING') {
        list = await commitmentsApi.getCommitments({ status: 'PENDING' });
      } else {
        list = await commitmentsApi.getCommitments();
      }
      setCommitments(list);
    } catch (err: any) {
      console.warn('Failed to load commitments:', err);
      setError(err?.message || 'Failed to load commitments from live API.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadCommitments();
  }, [loadCommitments]);

  // Aggregate metrics
  const totalAmount = commitments.reduce((sum, c) => sum + (parseFloat(String(c.amount)) || 0), 0);
  const missedCount = commitments.filter((c) => c.status === 'MISSED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={24} color="#00A581" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Payment Commitments</h2>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
            Track promised payment dates negotiated via WhatsApp, phone calls, and customer agreements.
          </p>
        </div>

        <button
          onClick={() => loadCommitments()}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#003051',
            border: '1px solid #0F5470',
            color: '#8FB7C7',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div style={{
          backgroundColor: '#003051',
          padding: '18px 20px',
          borderRadius: '10px',
          border: '1px solid #0F5470',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase' }}>
            Total Promised Amount
          </span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '6px' }}>
            {formatCurrency(totalAmount, currency)}
          </div>
        </div>

        <div style={{
          backgroundColor: '#003051',
          padding: '18px 20px',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(0, 48, 81, 1) 100%)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#FCA5A5', textTransform: 'uppercase' }}>
            Missed Deadlines
          </span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444', marginTop: '6px' }}>
            {missedCount} Broken Promises
          </div>
        </div>

        <div style={{
          backgroundColor: '#003051',
          padding: '18px 20px',
          borderRadius: '10px',
          border: '1px solid #0F5470',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase' }}>
            Active Commitments In View
          </span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '6px' }}>
            {commitments.length} Records
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['ALL', 'TODAY', 'MISSED', 'UPCOMING', 'FULFILLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '600',
              backgroundColor: activeTab === tab ? '#00A581' : '#003051',
              color: activeTab === tab ? '#FFFFFF' : '#8FB7C7',
              border: '1px solid #0F5470',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#FCA5A5',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Commitments List */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 size={32} className="animate-spin text-teal-400" />
          </div>
        ) : commitments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8FB7C7' }}>
            <Clock size={36} color="#5F94A9" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>No payment commitments found</p>
            <p style={{ fontSize: '13px', color: '#8FB7C7', marginTop: '4px' }}>
              When customers promise to pay by a specific date, commitments appear here.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#001D31', borderBottom: '1px solid #0F5470', color: '#8FB7C7', fontSize: '12px' }}>
                <th style={{ padding: '14px 20px' }}>CUSTOMER</th>
                <th style={{ padding: '14px 20px' }}>PROMISED DATE</th>
                <th style={{ padding: '14px 20px' }}>STATUS</th>
                <th style={{ padding: '14px 20px' }}>NOTES</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>PROMISED AMOUNT</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {commitments.map((com) => {
                const isMissed = com.status === 'MISSED';

                return (
                  <tr key={com.id} style={{ borderBottom: '1px solid #0F5470' }}>
                    <td style={{ padding: '16px 20px' }}>
                      {com.customer ? (
                        <Link href={`/customers/${com.customer.id}`} style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {com.customer.name}
                        </Link>
                      ) : (
                        <span style={{ color: '#FFFFFF', fontWeight: '600' }}>Customer #{com.customerId.slice(0, 8)}</span>
                      )}
                      {com.receivable?.reference && (
                        <p style={{ fontSize: '11px', color: '#8FB7C7', marginTop: '2px' }}>
                          Ref: {com.receivable.reference}
                        </p>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', color: '#DCEAF0' }}>
                      <div>{formatDate(com.promisedFor)}</div>
                      {isMissed && (
                        <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 'bold' }}>
                          Deadline elapsed
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        backgroundColor: isMissed ? 'rgba(239, 68, 68, 0.15)' : com.status === 'FULFILLED' ? 'rgba(0, 165, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isMissed ? '#FCA5A5' : com.status === 'FULFILLED' ? '#3AD0A9' : '#FCD34D',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        {com.status}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#8FB7C7', fontSize: '12px', maxWidth: '240px' }}>
                      {com.notes || '—'}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 'bold', color: isMissed ? '#EF4444' : '#00A581', fontSize: '14px' }}>
                      {formatCurrency(com.amount, com.currency || currency)}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <Link
                        href={`/messages/draft?customerId=${com.customerId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#001D31',
                          border: '1px solid #0F5470',
                          color: '#00A581',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <MessageSquareQuote size={13} />
                        <span>Follow Up</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
