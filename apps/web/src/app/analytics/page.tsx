'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  receivablesApi, 
  paymentsApi, 
  commitmentsApi, 
  customersApi,
  commandCenterApi,
  ReceivableItem, 
  PaymentItem, 
  PaymentCommitmentItem, 
  CustomerItem,
  PriorityCustomerSummary
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  Download, 
  RefreshCw, 
  Loader2, 
  ShieldAlert, 
  ChevronRight, 
  Sparkles, 
  PieChart, 
  BarChart3, 
  Activity, 
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  Phone,
  MessageSquareQuote,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type TimeRangeFilter = 'ALL_TIME' | '30D' | '90D' | 'YTD';
type SelectedAgingBucket = 'ALL' | '0_30' | '31_60' | '61_90' | '90_PLUS';

export default function AnalyticsPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityCustomerSummary[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL_TIME');
  const [selectedBucket, setSelectedBucket] = useState<SelectedAgingBucket>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recsRes, paysRes, commsRes, custsRes, prioRes] = await Promise.allSettled([
        receivablesApi.list({ pageSize: 300 }),
        paymentsApi.list({ pageSize: 300 }),
        commitmentsApi.getCommitments(),
        customersApi.list({ pageSize: 300 }),
        commandCenterApi.getPriorities({ limit: 10, currency }),
      ]);

      if (recsRes.status === 'fulfilled') setReceivables(recsRes.value);
      if (paysRes.status === 'fulfilled') setPayments(paysRes.value);
      if (commsRes.status === 'fulfilled') setCommitments(commsRes.value);
      if (custsRes.status === 'fulfilled') setCustomers(custsRes.value);
      if (prioRes.status === 'fulfilled') setPriorities(prioRes.value);
    } catch (err: any) {
      console.warn('Failed to load analytics data:', err);
      setError(err?.message || 'Failed to load analytics data from API.');
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const now = useMemo(() => new Date(), []);

  // Time-filtered payments
  const filteredPayments = useMemo(() => {
    if (timeRange === 'ALL_TIME') return payments;
    const days = timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 3600 * 1000);
    return payments.filter((p) => new Date(p.paidAt || p.createdAt) >= cutoff);
  }, [payments, timeRange, now]);

  // 1. Core Financial Aggregates
  const totalInvoiced = useMemo(() => {
    return receivables.reduce((sum, r) => sum + (parseFloat(String(r.originalAmount)) || 0), 0);
  }, [receivables]);

  const totalOutstanding = useMemo(() => {
    return receivables.reduce((sum, r) => {
      if (r.status === 'PAID' || r.status === 'CANCELLED') return sum;
      return sum + (parseFloat(String(r.balance)) || 0);
    }, 0);
  }, [receivables]);

  const totalRecovered = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
  }, [filteredPayments]);

  const totalOverdue = useMemo(() => {
    return receivables.reduce((sum, r) => {
      if (r.status === 'PAID' || r.status === 'CANCELLED') return sum;
      const isOverdue = r.dueDate && new Date(r.dueDate) < now;
      return isOverdue ? sum + (parseFloat(String(r.balance)) || 0) : sum;
    }, 0);
  }, [receivables, now]);

  // 2. Collection Efficiency Index (CEI) & DSO
  const cei = useMemo(() => {
    const denom = totalRecovered + totalOutstanding;
    if (denom <= 0) return 100;
    return Math.min(100, Math.round((totalRecovered / denom) * 100));
  }, [totalRecovered, totalOutstanding]);

  // Overdue Exposure Ratio
  const overdueRatio = useMemo(() => {
    if (totalOutstanding <= 0) return 0;
    return Math.min(100, Math.round((totalOverdue / totalOutstanding) * 100));
  }, [totalOverdue, totalOutstanding]);

  // Average DSO (Days Sales Outstanding) Estimate: (Total Outstanding / Total Invoiced) * 30 days
  const dsoDays = useMemo(() => {
    if (totalInvoiced <= 0) return 0;
    return Math.round((totalOutstanding / totalInvoiced) * 30);
  }, [totalOutstanding, totalInvoiced]);

  // 3. Commitment Fulfillment Metrics
  const fulfilledCount = useMemo(() => commitments.filter((c) => c.status === 'FULFILLED').length, [commitments]);
  const missedCount = useMemo(() => commitments.filter((c) => c.status === 'MISSED').length, [commitments]);
  const resolvedCommitmentsCount = fulfilledCount + missedCount;
  const promiseFulfillmentRate = resolvedCommitmentsCount > 0 ? Math.round((fulfilledCount / resolvedCommitmentsCount) * 100) : 100;

  // 4. Aging Buckets Analysis (0-30, 31-60, 61-90, 90+ Days)
  const agingBuckets = useMemo(() => {
    let current0_30 = { key: '0_30' as SelectedAgingBucket, label: '0 - 30 Days (Current / Fresh)', amount: 0, count: 0, color: '#00A581', items: [] as ReceivableItem[] };
    let mod31_60 = { key: '31_60' as SelectedAgingBucket, label: '31 - 60 Days (Moderate Risk)', amount: 0, count: 0, color: '#F59E0B', items: [] as ReceivableItem[] };
    let sev61_90 = { key: '61_90' as SelectedAgingBucket, label: '61 - 90 Days (Severe Delinquency)', amount: 0, count: 0, color: '#EA580C', items: [] as ReceivableItem[] };
    let chronic90Plus = { key: '90_PLUS' as SelectedAgingBucket, label: '90+ Days (Chronic Default / Critical)', amount: 0, count: 0, color: '#DC2626', items: [] as ReceivableItem[] };

    for (const r of receivables) {
      if (r.status === 'PAID' || r.status === 'CANCELLED') continue;
      const bal = parseFloat(String(r.balance)) || 0;
      if (bal <= 0) continue;

      const due = new Date(r.dueDate);
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        current0_30.amount += bal;
        current0_30.count += 1;
        current0_30.items.push(r);
      } else if (diffDays <= 60) {
        mod31_60.amount += bal;
        mod31_60.count += 1;
        mod31_60.items.push(r);
      } else if (diffDays <= 90) {
        sev61_90.amount += bal;
        sev61_90.count += 1;
        sev61_90.items.push(r);
      } else {
        chronic90Plus.amount += bal;
        chronic90Plus.count += 1;
        chronic90Plus.items.push(r);
      }
    }

    const totalActiveBal = totalOutstanding || 1;

    return [
      { ...current0_30, percent: Math.round((current0_30.amount / totalActiveBal) * 100) },
      { ...mod31_60, percent: Math.round((mod31_60.amount / totalActiveBal) * 100) },
      { ...sev61_90, percent: Math.round((sev61_90.amount / totalActiveBal) * 100) },
      { ...chronic90Plus, percent: Math.round((chronic90Plus.amount / totalActiveBal) * 100) },
    ];
  }, [receivables, totalOutstanding, now]);

  // Drilldown items for selected aging bucket
  const drilldownReceivables = useMemo(() => {
    if (selectedBucket === 'ALL') return [];
    const found = agingBuckets.find((b) => b.key === selectedBucket);
    return found ? found.items : [];
  }, [agingBuckets, selectedBucket]);

  // 5. Payment Channel Breakdown
  const channelBreakdown = useMemo(() => {
    const channels: Record<string, { total: number; count: number }> = {
      BANK_TRANSFER: { total: 0, count: 0 },
      POS: { total: 0, count: 0 },
      CASH: { total: 0, count: 0 },
      MOBILE_MONEY: { total: 0, count: 0 },
      CARD: { total: 0, count: 0 },
    };

    for (const p of filteredPayments) {
      const amt = parseFloat(String(p.amount)) || 0;
      const m = p.method || 'BANK_TRANSFER';
      if (!channels[m]) channels[m] = { total: 0, count: 0 };
      channels[m].total += amt;
      channels[m].count += 1;
    }

    return Object.entries(channels).map(([key, data]) => ({
      channel: key.replace(/_/g, ' '),
      total: data.total,
      count: data.count,
      percent: totalRecovered > 0 ? Math.round((data.total / totalRecovered) * 100) : 0,
    }));
  }, [filteredPayments, totalRecovered]);

  // 6. Top Delinquent Debtors Leaderboard
  const topRiskDebtors = useMemo(() => {
    return priorities.slice(0, 5);
  }, [priorities]);

  const topDebtorsExposureSum = useMemo(() => {
    return topRiskDebtors.reduce((sum, d) => sum + (d.totalOverdue || 0), 0);
  }, [topRiskDebtors]);

  const topDebtorsExposurePercent = useMemo(() => {
    if (totalOverdue <= 0) return 0;
    return Math.min(100, Math.round((topDebtorsExposureSum / totalOverdue) * 100));
  }, [topDebtorsExposureSum, totalOverdue]);

  // Export Executive Aging Schedule CSV
  const handleExportAgingCSV = () => {
    if (receivables.length === 0) {
      alert('No receivables data available to export.');
      return;
    }

    const headers = [
      'Invoice Reference',
      'Customer Name',
      'Original Amount',
      'Outstanding Balance',
      'Currency',
      'Due Date',
      'Days Overdue',
      'Aging Bracket',
      'Status',
    ];

    const rows = receivables.map((r) => {
      const bal = parseFloat(String(r.balance)) || 0;
      const due = new Date(r.dueDate);
      const diffDays = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      let bracket = '0 - 30 Days';
      if (diffDays > 90) bracket = '90+ Days';
      else if (diffDays > 60) bracket = '61 - 90 Days';
      else if (diffDays > 30) bracket = '31 - 60 Days';

      return [
        `"${r.reference || `REC-${r.id.slice(0, 8)}`}"`,
        `"${(r.customer?.name || '').replace(/"/g, '""')}"`,
        r.originalAmount,
        bal,
        r.currency || currency,
        `"${formatDate(r.dueDate)}"`,
        diffDays,
        `"${bracket}"`,
        r.status,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Netify_Executive_Aging_Schedule_${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Header & Executive Controls */}
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
              Recovery Analytics & Intelligence
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: cei >= 75 ? tokens.accentSoft : '#FEF3C7',
              border: `1px solid ${cei >= 75 ? tokens.accentBorder : '#FDE68A'}`,
              color: cei >= 75 ? '#00A581' : '#D97706',
              fontSize: '12px',
              fontWeight: '700',
            }}>
              <Activity size={12} />
              {cei >= 75 ? 'Healthy Liquidity' : 'Active Optimization'}
            </span>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            Portfolio aging schedules, collection velocity metrics (CEI &amp; DSO), and debtor risk concentration.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Time Range Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.7)', padding: '3px', borderRadius: '8px', border: `1px solid ${tokens.surfaceBorder}` }}>
            {[
              { key: 'ALL_TIME', label: 'All Time' },
              { key: '30D', label: '30D' },
              { key: '90D', label: '90D' },
              { key: 'YTD', label: 'YTD' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTimeRange(t.key as TimeRangeFilter)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: timeRange === t.key ? '700' : '500',
                  backgroundColor: timeRange === t.key ? '#00A581' : 'transparent',
                  color: timeRange === t.key ? '#FFFFFF' : tokens.textSecondary,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Aging CSV */}
          <button
            type="button"
            onClick={handleExportAgingCSV}
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
            <span>Export Aging Matrix</span>
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

          {/* Workspace Command Center Bridge */}
          <Link
            href="/workspace"
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
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
            }}
          >
            <span>Command Center</span>
            <ChevronRight size={14} />
          </Link>
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

      {/* 2. Executive Liquidity Bento KPIs */}
      <div className="responsive-grid-4">
        {/* Collection Efficiency Index (CEI) */}
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
            Collection Efficiency (CEI)
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: '#00A581', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : `${cei}%`}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Recovered {formatCurrency(totalRecovered, currency)} / {formatCurrency(totalInvoiced, currency)}
          </span>
        </div>

        {/* Days Sales Outstanding (DSO) */}
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
            Days Sales Out (DSO)
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : `${dsoDays} Days`}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Weighted trade credit turnaround
          </span>
        </div>

        {/* Overdue Exposure Ratio */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.3)'}`,
          background: isLight ? '#FFF5F5' : 'rgba(40, 10, 15, 0.6)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Overdue Exposure Ratio
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : `${overdueRatio}%`}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#991B1B' : '#FCA5A5' }}>
            {formatCurrency(totalOverdue, currency)} overdue debt
          </span>
        </div>

        {/* Promise Recovery Rate */}
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
            Promise Honoring Rate
          </span>
          <div style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: '#00A581', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : `${promiseFulfillmentRate}%`}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            {fulfilledCount} fulfilled vs {missedCount} broken
          </span>
        </div>
      </div>

      {/* 3. Visual Aging Schedule & Channel Velocity (Two-Column Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Visual Debt Aging Buckets */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '24px',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#00A581" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                Portfolio Aging Matrix
              </h3>
            </div>
            {selectedBucket !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedBucket('ALL')}
                style={{ fontSize: '11px', color: '#00A581', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
              >
                Clear Filter (Show All)
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {agingBuckets.map((bucket) => {
              const isSelected = selectedBucket === bucket.key;
              return (
                <div
                  key={bucket.key}
                  onClick={() => setSelectedBucket(isSelected ? 'ALL' : bucket.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.1)') : 'transparent',
                    border: isSelected ? '1px solid #00A581' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ fontWeight: '700', color: isSelected ? '#00A581' : tokens.textPrimary }}>{bucket.label}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: tokens.textSecondary }}>({bucket.count} invoices)</span>
                      <strong style={{ color: bucket.color }}>{formatCurrency(bucket.amount, currency)}</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: isLight ? '#E2E8F0' : '#001424', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(2, bucket.percent)}%`,
                        height: '100%',
                        backgroundColor: bucket.color,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drilldown List for Selected Bucket */}
          {selectedBucket !== 'ALL' && (
            <div style={{ borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '14px', marginTop: '4px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: tokens.textSecondary, textTransform: 'uppercase' }}>
                Invoices in Selected Bracket ({drilldownReceivables.length}):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {drilldownReceivables.map((rec) => (
                  <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 8px', borderRadius: '6px', backgroundColor: isLight ? '#F8FAFC' : '#001424' }}>
                    <Link href={`/receivables/${rec.id}`} style={{ color: tokens.textPrimary, textDecoration: 'none', fontWeight: '700' }}>
                      {rec.reference || `REC-${rec.id.slice(0, 8)}`} • {rec.customer?.name || 'Debtor'}
                    </Link>
                    <strong style={{ color: '#EF4444' }}>{formatCurrency(Number(rec.balance), rec.currency || currency)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cash Settlement Velocity by Channel */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '24px',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#00A581" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                Settlement Channel Breakdown
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: tokens.textSecondary }}>
              {filteredPayments.length} Settlements ({timeRange})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {channelBreakdown.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 32, 53, 0.6)',
                  border: `1px solid ${tokens.surfaceBorder}`,
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: tokens.textPrimary }}>
                    {ch.channel}
                  </div>
                  <div style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
                    {ch.count} transactions settled
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#00A581' }}>
                    {formatCurrency(ch.total, currency)}
                  </div>
                  <div style={{ fontSize: '11px', color: tokens.textSecondary }}>
                    {ch.percent}% of total recovered
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Top Delinquent Debtors Risk Concentration Leaderboard */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: '24px',
        boxShadow: isLight ? tokens.shadowCard : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#EF4444" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                High-Risk Debtor Concentration Leaderboard
              </h3>
            </div>
            {topRiskDebtors.length > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: isLight ? '#991B1B' : '#FCA5A5' }}>
                ⚠️ Top {topRiskDebtors.length} debtors account for <strong>{topDebtorsExposurePercent}%</strong> of total overdue debt ({formatCurrency(topDebtorsExposureSum, currency)}).
              </p>
            )}
          </div>

          <Link
            href="/collections"
            style={{
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#00A581',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Open Collections Cockpit</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {topRiskDebtors.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: tokens.textSecondary, fontSize: '13px' }}>
            No high-risk delinquent debtor concentrations detected.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topRiskDebtors.map((debtor) => (
              <div
                key={debtor.customerId}
                className="hover-lift"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.7)',
                  border: `1px solid ${tokens.surfaceBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'min(100%, 300px)' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EF4444',
                    fontWeight: '900',
                    fontSize: '14px',
                  }}>
                    !
                  </div>

                  <div>
                    <Link
                      href={`/customers/${debtor.customerId}`}
                      style={{ fontSize: '14px', fontWeight: '800', color: tokens.textPrimary, textDecoration: 'none' }}
                    >
                      {debtor.customerName}
                    </Link>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: tokens.textSecondary, marginTop: '2px' }}>
                      <span>Oldest Default: <strong>{debtor.oldestOverdueDays} days</strong></span>
                      {debtor.missedCommitmentsCount > 0 && (
                        <span style={{ color: '#EF4444', fontWeight: '700' }}>
                          • {debtor.missedCommitmentsCount} Missed Promises
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#EF4444' }}>
                      {formatCurrency(debtor.totalOverdue, debtor.currency || currency)}
                    </div>
                    <span style={{ fontSize: '11px', color: tokens.textMuted }}>
                      Overdue Balance
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link
                      href={`/messages/draft?customerId=${debtor.customerId}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: isLight ? '#F1F5F9' : '#001424',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        fontSize: '11.5px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <MessageSquareQuote size={12} color="#00A581" />
                      <span>Contact</span>
                    </Link>

                    <Link
                      href={`/customers/${debtor.customerId}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#00A581',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Ledger</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
