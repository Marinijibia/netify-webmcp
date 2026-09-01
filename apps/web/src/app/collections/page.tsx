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
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Phone
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type FilterType = 'ALL' | 'OVERDUE' | 'HIGH_URGENCY' | 'BROKEN_PROMISES';

export default function CollectionsPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();
  const [queue, setQueue] = useState<PriorityCustomerSummary[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
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
    if (filter === 'OVERDUE') return item.totalOverdue > 0;
    if (filter === 'HIGH_URGENCY') return item.urgency === 'HIGH' || item.priorityScore >= 70;
    if (filter === 'BROKEN_PROMISES') return item.missedCommitmentsCount > 0;
    return true;
  });

  const totalOverdueSum = queue.reduce((sum, q) => sum + (q.totalOverdue || 0), 0);
  const highUrgencyCount = queue.filter((q) => q.urgency === 'HIGH' || q.priorityScore >= 70).length;
  const missedCommitmentsCount = queue.reduce((sum, q) => sum + (q.missedCommitmentsCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Executive Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.6px', margin: 0 }}>
              {t('commandCenter.todaysQueue')}
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              color: '#00A581',
              fontSize: '11.5px',
              fontWeight: '700',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00A581', boxShadow: '0 0 8px #00A581' }}></span>
              Deterministic AI Ranking
            </span>
          </div>

          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            {t('commandCenter.queueSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadQueue()}
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
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* WebMCP Tool Integration Notice */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 20px',
        borderRadius: '12px',
        backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.8)',
        border: '1px solid rgba(0, 165, 129, 0.4)',
        fontSize: '12.5px',
        color: tokens.textSecondary,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={16} color="#00A581" />
          <span>
            This priority queue is exposed directly to autonomous browser agents via the <strong style={{ color: '#00A581' }}>get_collection_priority</strong> WebMCP tool. Rankings and broken commitments update in real time.
          </span>
        </div>
        <Link
          href="/webmcp"
          style={{
            color: '#00A581',
            fontWeight: '700',
            fontSize: '12px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>Test in WebMCP Sandbox</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* 2. Executive KPI Bento Summary Cards */}
      <div className="responsive-grid-3">
        {/* Total Overdue in Queue */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)'}`,
          background: isLight ? '#FEF2F2' : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: 0,
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: isLight ? '#DC2626' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Delinquent Overdue
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(totalOverdueSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
            Across {queue.length} priority debtor accounts
          </span>
        </div>

        {/* High Urgency Cases */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: 0,
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            High Urgency Debtors
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : highUrgencyCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#00A581', fontWeight: '600' }}>
            Immediate outreach recommended
          </span>
        </div>

        {/* Broken Promises */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.35)'}`,
          background: isLight ? '#FFFBEB' : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: 0,
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: isLight ? '#D97706' : '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Defaulted Promises
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: isLight ? '#D97706' : '#F59E0B', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : missedCommitmentsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#92400E' : '#FCD34D' }}>
            Broken WhatsApp / phone promises
          </span>
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
          <AlertCircle size={16} color="#EF4444" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Filter Tabs */}
      <div className="no-scrollbar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.7)',
        padding: '4px',
        borderRadius: '10px',
        border: `1px solid ${tokens.surfaceBorder}`,
        overflowX: 'auto',
        maxWidth: '100%',
        WebkitOverflowScrolling: 'touch' as any,
      }}>
        {[
          { key: 'ALL', label: `${t('common.all')} (${queue.length})` },
          { key: 'OVERDUE', label: `${t('common.overdue')} (${queue.filter((q) => q.totalOverdue > 0).length})` },
          { key: 'HIGH_URGENCY', label: `${t('commandCenter.tabHighUrgency')} (${highUrgencyCount})` },
          { key: 'BROKEN_PROMISES', label: `${t('commandCenter.tabBrokenPromises')} (${queue.filter((q) => q.missedCommitmentsCount > 0).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: filter === tab.key ? '700' : '500',
              color: filter === tab.key ? '#FFFFFF' : tokens.textSecondary,
              backgroundColor: filter === tab.key ? '#00A581' : 'transparent',
              border: filter === tab.key ? '1px solid #00A581' : '1px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Priority Queue Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 8vw, 80px)', gap: '10px', color: tokens.textMuted }}>
          <Loader2 size={36} className="animate-spin text-teal-500" />
          <span style={{ fontSize: '13px' }}>Evaluating collection priorities & ledger exposures...</span>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '60px 20px',
          textAlign: 'center',
          color: tokens.textSecondary,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <CheckCircle2 size={36} color="#00A581" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>Zero Collections Priorities</h3>
          <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
            All accounts are current or no delinquent receivables match the active filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredQueue.map((item, index) => {
            const isHighRisk = item.urgency === 'HIGH' || item.priorityScore >= 70;
            const isMediumRisk = item.urgency === 'MEDIUM' || item.priorityScore >= 40;
            const badgeColor = isHighRisk ? (isLight ? '#DC2626' : '#EF4444') : isMediumRisk ? (isLight ? '#D97706' : '#F59E0B') : '#00A581';
            const badgeBg = isHighRisk ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)') : isMediumRisk ? (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)') : tokens.accentSoft;

            return (
              <div
                key={item.customerId}
                className="hover-lift"
                style={{
                  backgroundColor: tokens.surface,
                  borderRadius: '14px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: isLight ? tokens.shadowCard : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Queue Rank Badge */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 20, 36, 0.8)',
                    border: `1px solid ${tokens.accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
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
                        style={{ fontSize: '16.5px', fontWeight: '800', color: tokens.textPrimary, textDecoration: 'none' }}
                      >
                        {item.customerName}
                      </Link>
                      <span style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}40`,
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '800',
                      }}>
                        {item.urgency} RISK • SCORE {item.priorityScore}
                      </span>
                    </div>

                    <p style={{ color: tokens.textSecondary, fontSize: '12.5px', marginTop: '4px' }}>
                      {item.phone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: tokens.textPrimary, marginRight: '8px' }}>
                          <Phone size={12} color="#00A581" />
                          <span>{item.phone}</span>
                          <span>•</span>
                        </span>
                      ) : null}
                      {item.reasons && item.reasons.length > 0 ? item.reasons.join(' • ') : `${item.oldestOverdueDays} days overdue`}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11.5px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      <span>Overdue: <strong style={{ color: item.oldestOverdueDays > 30 ? '#DC2626' : tokens.textPrimary }}>{item.oldestOverdueDays} days</strong></span>
                      <span>•</span>
                      <span>{item.openReceivablesCount} open invoice{item.openReceivablesCount > 1 ? 's' : ''}</span>
                      {item.missedCommitmentsCount > 0 ? (
                        <>
                          <span>•</span>
                          <span style={{ color: isLight ? '#D97706' : '#FCD34D', fontWeight: 'bold' }}>
                            {item.missedCommitmentsCount} missed promise{item.missedCommitmentsCount > 1 ? 's' : ''}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.4px' }}>
                      {formatCurrency(item.totalOutstanding, item.currency || currency)}
                    </div>
                    <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700', marginTop: '2px' }}>
                      {formatCurrency(item.totalOverdue, item.currency || currency)} overdue
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/customers/${item.customerId}`}
                      className="hover-lift tap-press"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '7px',
                        backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 20, 36, 0.7)',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <span>Ledger</span>
                      <ChevronRight size={13} color={tokens.textMuted} />
                    </Link>

                    <Link
                      href={`/messages/draft?customerId=${item.customerId}`}
                      className="hover-lift tap-press"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '7px',
                        background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
                      }}
                    >
                      <MessageSquareQuote size={13} />
                      <span>Draft AI Follow-Up</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
