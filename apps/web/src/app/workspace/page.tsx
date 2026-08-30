'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  commandCenterApi, 
  CommandCenterAttentionData, 
  PriorityCustomerSummary 
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { 
  TrendingUp, 
  AlertTriangle, 
  CalendarCheck, 
  ArrowUpRight, 
  Clock, 
  MessageSquareQuote, 
  Sparkles, 
  ShieldAlert, 
  Loader2, 
  RefreshCw, 
  CheckCircle2,
  Users,
  FileText,
  Building,
  Plus,
  ArrowRight,
  Send,
  Zap,
  Activity
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

export default function WorkspacePage() {
  const { user, organization, isAuthenticated } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();
  const [attention, setAttention] = useState<CommandCenterAttentionData | null>(null);
  const [priorities, setPriorities] = useState<PriorityCustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [attRes, priRes] = await Promise.all([
        commandCenterApi.getAttention({ currency }),
        commandCenterApi.getPriorities({ limit: 5, currency }),
      ]);
      setAttention(attRes);
      setPriorities(priRes);
    } catch (err: any) {
      console.warn('Failed to load command center data from API:', err);
      setError(err?.message || 'Unable to connect to live API server. Please verify backend connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const facts = attention?.facts;

  // Calculate overdue percentage for exposure gauge
  const totalOut = facts?.totalOutstanding || 0;
  const totalOver = facts?.totalOverdue || 0;
  const overduePercent = totalOut > 0 ? Math.min(100, Math.round((totalOver / totalOut) * 100)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Executive Status Bar & Live Control Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '26px',
              fontWeight: '900',
              color: tokens.textPrimary,
              letterSpacing: '-0.6px',
              margin: 0,
            }}>
              Command Center
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
              Live Ledger Synced
            </span>
          </div>

          <p style={{ color: tokens.textMuted, fontSize: '13.5px', margin: '4px 0 0' }}>
            Welcome back, <strong style={{ color: tokens.textPrimary }}>{user?.firstName || 'Business Leader'}</strong>. Real-time receivables exposure, overdue risks, and collections intelligence for <strong style={{ color: '#00A581' }}>{organization?.name || 'Netify'}</strong>.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{t('common.refresh')}</span>
          </button>

          <Link
            href="/receivables/create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              color: '#00A581',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <Plus size={14} />
            <span>{t('commandCenter.addInvoice')}</span>
          </Link>

          <Link
            href="/commitments"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#FFFBEB' : 'rgba(0, 32, 53, 0.8)',
              border: `1px solid ${isLight ? '#FDE68A' : 'rgba(15, 84, 112, 0.6)'}`,
              color: isLight ? '#D97706' : '#DCEAF0',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <Clock size={14} color="#D97706" />
            <span>{t('commandCenter.promisesAction')}</span>
          </Link>

          <Link
            href="/chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
            }}
          >
            <Sparkles size={14} />
            <span>{t('common.askCopilot')}</span>
          </Link>
        </div>
      </div>

      {/* Error Alert if backend offline */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '10px',
          padding: '14px 18px',
          color: '#FCA5A5',
          fontSize: '13.5px',
        }}>
          <ShieldAlert size={20} color="#EF4444" />
          <div style={{ flex: 1 }}>{error}</div>
          <button
            type="button"
            onClick={() => loadData()}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2. Financial Exposure Bento Grid (4 Core Executive KPIs) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
      }}>
        {/* Card 1: Total Outstanding Exposure */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '22px',
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '148px',
          transition: 'all 0.2s ease',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #00A581 0%, rgba(0, 165, 129, 0.2) 100%)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {t('commandCenter.totalOutstanding')}
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00A581',
            }}>
              <TrendingUp size={18} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.6px' }}>
              {isLoading ? '...' : formatCurrency(facts?.totalOutstanding || 0, currency)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: tokens.textMuted, marginTop: '4px' }}>
              <Users size={13} color="#00A581" />
              <span>Across <strong style={{ color: tokens.textPrimary }}>{facts?.activeCustomersCount || 0}</strong> active debtor accounts</span>
            </div>
          </div>
        </div>

        {/* Card 2: Overdue Receivables */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '22px',
          borderRadius: '14px',
          border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)'}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '148px',
          transition: 'all 0.2s ease',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #EF4444 0%, rgba(239, 68, 68, 0.2) 100%)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: isLight ? '#DC2626' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {t('commandCenter.overdueExposure')}
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}>
              <AlertTriangle size={18} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#DC2626', letterSpacing: '-0.6px' }}>
              {isLoading ? '...' : formatCurrency(facts?.totalOverdue || 0, currency)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isLight ? '#B91C1C' : '#FCA5A5', marginTop: '4px' }}>
              <span><strong>{facts?.overdueCustomersCount || 0}</strong> accounts past terms ({overduePercent}% of exposure)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Defaulted Commitments */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '22px',
          borderRadius: '14px',
          border: `1px solid ${isLight ? '#FCD34D' : 'rgba(245, 158, 11, 0.35)'}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '148px',
          transition: 'all 0.2s ease',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #F59E0B 0%, rgba(245, 158, 11, 0.2) 100%)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: isLight ? '#D97706' : '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {t('commandCenter.broken')}
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
            }}>
              <Clock size={18} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: isLight ? '#D97706' : '#F59E0B', letterSpacing: '-0.6px' }}>
              {isLoading ? '...' : facts?.missedPromisesCount || 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isLight ? '#B45309' : '#FCD34D', marginTop: '4px' }}>
              <span>Broken commitments in WhatsApp/call ledger</span>
            </div>
          </div>
        </div>

        {/* Card 4: Scheduled Due Today */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '22px',
          borderRadius: '14px',
          border: `1px solid ${isLight ? '#A7F3D0' : 'rgba(0, 165, 129, 0.4)'}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '148px',
          transition: 'all 0.2s ease',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #00A581 0%, rgba(0, 165, 129, 0.2) 100%)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: isLight ? '#059669' : '#3AD0A9', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {t('commandCenter.dueToday')}
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00A581',
            }}>
              <CalendarCheck size={18} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: isLight ? '#059669' : '#3AD0A9', letterSpacing: '-0.6px' }}>
              {isLoading ? '...' : facts?.promisesDueTodayCount || 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isLight ? '#047857' : '#A8F0DB', marginTop: '4px' }}>
              <span>Expected Cash Inflow: <strong style={{ color: isLight ? '#059669' : '#FFFFFF' }}>{formatCurrency(facts?.promisesDueTodayAmount || 0, currency)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Executive AI Daily Briefing & Decision Focus */}
      {attention?.executiveBriefing && (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '16px',
          border: `1px solid ${isLight ? '#A7F3D0' : 'rgba(0, 165, 129, 0.45)'}`,
          padding: '26px 28px',
          boxShadow: isLight ? tokens.shadowCard : '0 8px 30px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}>
          {/* Subtle top ambient glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00A581, transparent)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: tokens.accentSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00A581',
              }}>
                <Sparkles size={18} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                Executive AI Briefing
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#00A581',
                backgroundColor: tokens.accentSoft,
                border: `1px solid ${tokens.accentBorder}`,
                padding: '3px 10px',
                borderRadius: '20px',
              }}>
                Grounded in Live Ledger
              </span>

              <Link
                href="/chat"
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isLight ? '#00A581' : '#A2C4D3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  padding: '3px 8px',
                }}
              >
                <span>Investigate in Copilot</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <p style={{
            color: tokens.textSecondary,
            fontSize: '14.5px',
            lineHeight: '1.65',
            margin: '0 0 18px',
          }}>
            {attention.executiveBriefing}
          </p>

          {/* Action Focus Chips */}
          {attention.inferences && attention.inferences.length > 0 && (
            <div style={{
              paddingTop: '16px',
              borderTop: `1px solid ${tokens.surfaceBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Recommended Action Focus Today:
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                {attention.inferences.map((inf, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px 14px',
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.7)',
                      borderRadius: '10px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                    }}
                  >
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: inf.urgency === 'HIGH' ? '#EF4444' : '#00A581',
                      marginTop: '6px',
                      flexShrink: 0,
                    }} />
                    <div style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                      <strong style={{ color: tokens.textPrimary }}>{inf.title}: </strong>
                      <span style={{ color: tokens.textSecondary }}>{inf.recommendedAction || inf.insight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Primary Split Section: Priority Queue & Operations Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Highest Priority Debtor Accounts */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '16px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                Collections Priority Queue
              </h3>
              <p style={{ fontSize: '12px', color: tokens.textMuted, margin: '3px 0 0' }}>
                Debtors ranked deterministically by live risk score, aging days, and missed commitments.
              </p>
            </div>

            <Link
              href="/collections"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#00A581',
                textDecoration: 'none',
              }}
            >
              <span>View Full Queue</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '10px', color: tokens.textMuted }}>
              <Loader2 size={26} className="animate-spin text-teal-500" />
              <span style={{ fontSize: '13px' }}>Evaluating ledger risk & priorities...</span>
            </div>
          ) : priorities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: tokens.textMuted, fontSize: '13.5px' }}>
              <CheckCircle2 size={36} color="#00A581" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>Zero High-Risk Debtors</p>
              <p style={{ margin: '4px 0 0' }}>All customer receivables are currently within agreed payment terms.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {priorities.map((item) => {
                const isHighRisk = item.urgency === 'HIGH' || item.priorityScore >= 70;
                const isMediumRisk = item.urgency === 'MEDIUM' || item.priorityScore >= 40;
                const badgeColor = isHighRisk ? '#DC2626' : isMediumRisk ? '#D97706' : '#16A34A';
                const badgeBg = isHighRisk 
                  ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)') 
                  : isMediumRisk 
                  ? (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)') 
                  : (isLight ? '#DCFCE7' : 'rgba(0, 165, 129, 0.15)');

                const initials = item.customerName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={item.customerId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 18px',
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.75)',
                      borderRadius: '12px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Customer Initials Avatar */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: isLight ? '#ECFDF8' : '#00253E',
                        border: `1px solid ${tokens.accentBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00A581',
                        fontWeight: '800',
                        fontSize: '13px',
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link
                            href={`/customers/${item.customerId}`}
                            style={{
                              fontWeight: '700',
                              fontSize: '14.5px',
                              color: tokens.textPrimary,
                              textDecoration: 'none',
                            }}
                          >
                            {item.customerName}
                          </Link>
                          <span style={{
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            fontSize: '10.5px',
                            fontWeight: '800',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            border: `1px solid ${badgeColor}40`,
                          }}>
                            Risk: {item.priorityScore}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: tokens.textMuted, marginTop: '3px' }}>
                          <span>Overdue: <strong style={{ color: item.oldestOverdueDays > 30 ? '#DC2626' : tokens.textPrimary }}>{item.oldestOverdueDays} days</strong></span>
                          <span>•</span>
                          {item.missedCommitmentsCount > 0 ? (
                            <span style={{ color: isLight ? '#D97706' : '#FCD34D', fontWeight: '600' }}>
                              {item.missedCommitmentsCount} broken promise{item.missedCommitmentsCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span>{item.openReceivablesCount} open invoice{item.openReceivablesCount > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', fontSize: '15.5px', color: tokens.textPrimary }}>
                          {formatCurrency(item.totalOutstanding, currency)}
                        </div>
                        <div style={{ fontSize: '11px', color: tokens.textMuted }}>
                          Total Balance
                        </div>
                      </div>

                      <Link
                        href={`/messages/draft?customerId=${item.customerId}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: tokens.accentSoft,
                          border: `1px solid ${tokens.accentBorder}`,
                          color: '#00A581',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <MessageSquareQuote size={14} />
                        <span>Draft Follow-up</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Fast Inquiries & Ledger Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* AI Copilot Card */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '16px',
            border: `1px solid ${isLight ? '#A7F3D0' : 'rgba(0, 165, 129, 0.4)'}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: tokens.accentSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00A581',
              }}>
                <Sparkles size={16} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                Ask AI Copilot
              </h4>
            </div>

            <p style={{ color: tokens.textMuted, fontSize: '12.5px', lineHeight: '1.5', margin: 0 }}>
              Query customer promises, get overdue citations, or formulate payment follow-up strategies directly from live records.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                'Who owes the most past 30 days?',
                'Who has broken a payment promise recently?',
                'Give me today’s collection priority summary',
              ].map((query, i) => (
                <Link
                  key={i}
                  href={`/chat`}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.7)',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textSecondary,
                    fontSize: '12px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{query}"
                  </span>
                  <ArrowRight size={12} color="#00A581" style={{ flexShrink: 0, marginLeft: '8px' }} />
                </Link>
              ))}
            </div>

            <Link
              href="/chat"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                color: '#FFFFFF',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                marginTop: '4px',
                boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
              }}
            >
              <Send size={13} />
              <span>Launch Conversational Chat</span>
            </Link>
          </div>

          {/* Quick Operations Card */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '16px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            transition: 'all 0.2s ease',
          }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: tokens.textPrimary, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Quick Ledger Actions
            </h4>

            <Link
              href="/receivables/create"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.7)',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                fontSize: '12.5px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={14} color="#00A581" />
                <span>Issue Credit Invoice</span>
              </div>
              <ArrowUpRight size={13} color={tokens.textMuted} />
            </Link>

            <Link
              href="/commitments"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.7)',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                fontSize: '12.5px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} color="#D97706" />
                <span>Log WhatsApp / Call Promise</span>
              </div>
              <ArrowUpRight size={13} color={tokens.textMuted} />
            </Link>

            <Link
              href="/customers/create"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.7)',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                fontSize: '12.5px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={14} color="#00A581" />
                <span>Register Customer Account</span>
              </div>
              <ArrowUpRight size={13} color={tokens.textMuted} />
            </Link>

            <Link
              href="/webmcp"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.7)',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: '#00A581',
                fontSize: '12.5px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} color="#00A581" />
                <span>WebMCP Agent Tools (8 Active)</span>
              </div>
              <ArrowUpRight size={13} color="#00A581" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
