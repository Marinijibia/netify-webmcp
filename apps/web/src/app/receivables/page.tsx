'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { receivablesApi, ReceivableItem } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  FileText, 
  Search, 
  Plus, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

type StatusFilter = 'ALL' | 'OPEN' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID';

export default function ReceivablesPage() {
  const { organization } = useAuth();
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadReceivables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter === 'OVERDUE') {
        params.isOverdue = true;
      } else if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const list = await receivablesApi.list(params);
      setReceivables(list);
    } catch (err: any) {
      console.warn('Failed to load receivables from live API:', err);
      setError(err?.message || 'Failed to load receivables.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadReceivables();
  }, [loadReceivables]);

  // Aggregate stats
  const totalOpen = receivables
    .filter((r) => r.status === 'OPEN' || r.status === 'OVERDUE' || r.status === 'PARTIALLY_PAID')
    .reduce((sum, r) => sum + (parseFloat(String(r.balance)) || 0), 0);

  const totalOverdue = receivables
    .filter((r) => r.isOverdue || r.status === 'OVERDUE')
    .reduce((sum, r) => sum + (parseFloat(String(r.balance)) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#00A581" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Receivables Ledger</h2>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
            Track credit sales, open invoices, overdue debtor aging, and recorded payments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => loadReceivables()}
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

          <Link
            href="/receivables/create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            <Plus size={16} />
            <span>New Receivable / Invoice</span>
          </Link>
        </div>
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
            Total Open Balance
          </span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '6px' }}>
            {formatCurrency(totalOpen, currency)}
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
            Overdue Exposure
          </span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444', marginTop: '6px' }}>
            {formatCurrency(totalOverdue, currency)}
          </div>
        </div>

        <div style={{
          backgroundColor: '#003051',
          padding: '18px 20px',
          borderRadius: '10px',
          border: '1px solid #0F5470',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase' }}>
            Total Invoices / Records
          </span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '6px' }}>
            {receivables.length}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'OPEN', 'OVERDUE', 'PARTIALLY_PAID', 'PAID'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '600',
                backgroundColor: statusFilter === tab ? '#00A581' : '#003051',
                color: statusFilter === tab ? '#FFFFFF' : '#8FB7C7',
                border: '1px solid #0F5470',
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#8FB7C7" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or reference..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: '#003051',
              border: '1px solid #0F5470',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
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

      {/* Receivables Table */}
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
        ) : receivables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8FB7C7' }}>
            <FileText size={36} color="#5F94A9" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>No receivables found</p>
            <p style={{ fontSize: '13px', color: '#8FB7C7', marginTop: '4px' }}>
              Create an invoice or receivable to start tracking customer payments.
            </p>
            <Link
              href="/receivables/create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '600',
                marginTop: '16px',
              }}
            >
              <Plus size={14} />
              <span>Issue Receivable</span>
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#001D31', borderBottom: '1px solid #0F5470', color: '#8FB7C7', fontSize: '12px' }}>
                <th style={{ padding: '14px 20px' }}>REFERENCE / DESCRIPTION</th>
                <th style={{ padding: '14px 20px' }}>CUSTOMER</th>
                <th style={{ padding: '14px 20px' }}>DUE DATE</th>
                <th style={{ padding: '14px 20px' }}>STATUS</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ORIGINAL</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>BALANCE</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((r) => {
                const isOverdue = r.isOverdue || r.status === 'OVERDUE';

                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #0F5470' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <Link href={`/receivables/${r.id}`} style={{ fontWeight: '600', color: '#FFFFFF' }}>
                        {r.reference || `REC-${r.id.slice(0, 8)}`}
                      </Link>
                      {r.description && (
                        <p style={{ color: '#8FB7C7', fontSize: '12px', marginTop: '2px' }}>
                          {r.description}
                        </p>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {r.customer ? (
                        <Link href={`/customers/${r.customer.id}`} style={{ color: '#3AD0A9', fontWeight: '500' }}>
                          {r.customer.name}
                        </Link>
                      ) : (
                        <span style={{ color: '#DCEAF0' }}>Customer #{r.customerId.slice(0, 8)}</span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', color: '#DCEAF0' }}>
                      <div>{formatDate(r.dueDate)}</div>
                      {isOverdue && (
                        <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 'bold' }}>
                          {r.daysOverdue > 0 ? `${r.daysOverdue}d overdue` : 'Overdue'}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.15)' : r.status === 'PAID' ? 'rgba(0, 165, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isOverdue ? '#FCA5A5' : r.status === 'PAID' ? '#3AD0A9' : '#FCD34D',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        {r.status}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#8FB7C7' }}>
                      {formatCurrency(r.originalAmount, r.currency || currency)}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 'bold', color: isOverdue ? '#EF4444' : '#FFFFFF' }}>
                      {formatCurrency(r.balance, r.currency || currency)}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <Link
                        href={`/receivables/${r.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#00A581',
                          fontWeight: '600',
                          fontSize: '12.5px',
                        }}
                      >
                        <span>Details</span>
                        <ChevronRight size={14} />
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
