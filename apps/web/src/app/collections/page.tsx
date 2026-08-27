'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { commandCenterApi, PriorityCustomerSummary } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { 
  Layers, 
  AlertCircle, 
  Clock, 
  MessageSquareQuote, 
  ShieldAlert, 
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function CollectionsPage() {
  const { organization } = useAuth();
  const [queue, setQueue] = useState<PriorityCustomerSummary[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'HIGH_URGENCY'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await commandCenterApi.getPriorities({ limit: 50, currency });
      setQueue(data);
    } catch (err: any) {
      console.warn('Failed to load collections priority queue:', err);
      setError(err?.message || 'Failed to load priority queue from live API.');
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const filteredQueue = queue.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'OVERDUE') return item.totalOverdue > 0;
    if (filter === 'HIGH_URGENCY') return item.urgency === 'HIGH';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={24} color="#00A581" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Collections Priority Queue</h2>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
            Deterministically ranked debtor accounts based on aging, broken commitments, and total financial exposure.
          </p>
        </div>

        <button
          onClick={() => loadQueue()}
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
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#FCA5A5',
          fontSize: '13px',
        }}>
          <AlertCircle size={16} color="#EF4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { key: 'ALL', label: `All In Queue (${queue.length})` },
          { key: 'OVERDUE', label: `Overdue Only (${queue.filter((q) => q.totalOverdue > 0).length})` },
          { key: 'HIGH_URGENCY', label: `High Urgency (${queue.filter((q) => q.urgency === 'HIGH').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: filter === tab.key ? '#00A581' : '#003051',
              color: filter === tab.key ? '#FFFFFF' : '#8FB7C7',
              border: '1px solid #0F5470',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Priority Queue Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={36} className="animate-spin text-teal-400" />
        </div>
      ) : filteredQueue.length === 0 ? (
        <div style={{
          backgroundColor: '#003051',
          borderRadius: '12px',
          border: '1px solid #0F5470',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#8FB7C7',
        }}>
          <Layers size={36} color="#5F94A9" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>No Collections Priorities</h3>
          <p style={{ fontSize: '13px', color: '#8FB7C7', marginTop: '4px' }}>
            All accounts are current or no delinquent receivables match the active filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredQueue.map((item, index) => (
            <div
              key={item.customerId}
              style={{
                backgroundColor: '#003051',
                borderRadius: '12px',
                border: '1px solid #0F5470',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: '#00A581',
                  fontSize: '14px',
                  flexShrink: 0,
                }}>
                  #{index + 1}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link
                      href={`/customers/${item.customerId}`}
                      style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}
                    >
                      {item.customerName}
                    </Link>
                    <span style={{
                      backgroundColor: item.urgency === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.urgency === 'HIGH' ? '#FCA5A5' : '#FCD34D',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '600',
                    }}>
                      {item.urgency} URGENCY
                    </span>
                  </div>

                  <p style={{ color: '#8FB7C7', fontSize: '12.5px', marginTop: '4px' }}>
                    {item.phone ? `Contact: ${item.phone} • ` : ''}
                    {item.reasons && item.reasons.length > 0 ? item.reasons.join(' • ') : `${item.oldestOverdueDays} days overdue`}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11.5px', color: '#DCEAF0' }}>
                    <span>Open Receivables: <strong>{item.openReceivablesCount}</strong></span>
                    <span>•</span>
                    <span>Missed Promises: <strong style={{ color: item.missedCommitmentsCount > 0 ? '#EF4444' : '#00A581' }}>{item.missedCommitmentsCount}</strong></span>
                    <span>•</span>
                    <span>Priority Score: <strong style={{ color: '#00A581' }}>{item.priorityScore}/100</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>
                    {formatCurrency(item.totalOutstanding, item.currency || currency)}
                  </div>
                  <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600', marginTop: '2px' }}>
                    {formatCurrency(item.totalOverdue, item.currency || currency)} overdue
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    href={`/customers/${item.customerId}`}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#001D31',
                      border: '1px solid #0F5470',
                      color: '#DCEAF0',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    View History
                  </Link>
                  <Link
                    href={`/messages/draft?customerId=${item.customerId}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 16px',
                      borderRadius: '6px',
                      backgroundColor: '#00A581',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <MessageSquareQuote size={14} />
                    <span>Draft Follow-Up</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
