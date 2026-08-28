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
  HelpCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { organization, isAuthenticated } = useAuth();
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
      setError(err?.message || 'Unable to connect to live API server. Please check your backend connection or sign in.');
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const facts = attention?.facts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Marketing Product Overview Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 48, 81, 0.9) 0%, rgba(0, 29, 49, 1) 100%)',
        border: '1px solid #00A581',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 10px 30px rgba(0, 165, 129, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              backgroundColor: 'rgba(0, 165, 129, 0.2)',
              color: '#3AD0A9',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '2px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(0, 165, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Sparkles size={12} />
              <span>WebMCP Challenge Official Submission • 8 Live Tools Active</span>
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.5px', margin: '0 0 6px' }}>
            The Agent-Ready Collections Workspace for African SMEs
          </h1>
          <p style={{ color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.5', margin: 0 }}>
            Netify gives African business owners and autonomous AI agents a unified business memory to track trade receivables, remember WhatsApp promises, and collect payments respectfully.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/landing"
            style={{
              padding: '10px 16px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Marketing Tour</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/webmcp"
            style={{
              padding: '10px 16px',
              backgroundColor: '#003051',
              border: '1px solid #0F5470',
              color: '#3AD0A9',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            WebMCP Specs
          </Link>
          <Link
            href="/pricing"
            style={{
              padding: '10px 16px',
              backgroundColor: '#003051',
              border: '1px solid #0F5470',
              color: '#DCEAF0',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Pricing (₦, KSh, GH₵, $)
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>
            Live Command Center
          </h2>
          <p style={{ color: '#8FB7C7', fontSize: '13.5px', marginTop: '4px' }}>
            Real-time financial exposure, overdue risks, and collections priorities for <strong style={{ color: '#DCEAF0' }}>{organization?.name || 'Workspace'}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => loadData()}
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
            href="/chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#003051',
              border: '1px solid #0F5470',
              color: '#00A581',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            <Sparkles size={16} />
            <span>Ask Copilot</span>
          </Link>
          <Link
            href="/collections"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            <span>Collections Queue</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* Error state if API fails */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#EF4444" />
            <div>
              <p style={{ color: '#FCA5A5', fontWeight: '600', fontSize: '14px' }}>Live API Notice</p>
              <p style={{ color: '#F87171', fontSize: '13px' }}>{error}</p>
            </div>
          </div>
          {!isAuthenticated && (
            <Link
              href="/login"
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Total Outstanding */}
        <div style={{
          backgroundColor: '#003051',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid #0F5470',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#8FB7C7', textTransform: 'uppercase' }}>
              Total Outstanding
            </span>
            <TrendingUp size={18} color="#00A581" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '12px' }}>
            {isLoading ? <Loader2 size={24} className="animate-spin text-teal-400" /> : formatCurrency(facts?.totalOutstanding ?? 0, currency)}
          </div>
          <p style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '6px' }}>
            {facts?.activeCustomersCount ?? 0} active customer accounts
          </p>
        </div>

        {/* Total Overdue / Needs Attention */}
        <div style={{
          backgroundColor: '#003051',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(0, 48, 81, 1) 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#FCA5A5', textTransform: 'uppercase' }}>
              Needs Attention
            </span>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#EF4444', marginTop: '12px' }}>
            {isLoading ? <Loader2 size={24} className="animate-spin text-red-400" /> : formatCurrency(facts?.totalOverdue ?? 0, currency)}
          </div>
          <p style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '6px' }}>
            {facts?.overdueCustomersCount ?? 0} delinquent accounts overdue
          </p>
        </div>

        {/* Missed Promises */}
        <div style={{
          backgroundColor: '#003051',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(0, 48, 81, 1) 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#FCD34D', textTransform: 'uppercase' }}>
              Broken Promises
            </span>
            <Clock size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B', marginTop: '12px' }}>
            {isLoading ? <Loader2 size={24} className="animate-spin text-amber-400" /> : (facts?.missedPromisesCount ?? 0)}
          </div>
          <p style={{ fontSize: '12px', color: '#FCD34D', marginTop: '6px' }}>
            Missed payment commitment deadlines
          </p>
        </div>

        {/* Promises Due Today */}
        <div style={{
          backgroundColor: '#003051',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid #0F5470',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#8FB7C7', textTransform: 'uppercase' }}>
              Promises Due Today
            </span>
            <CalendarCheck size={18} color="#00A581" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '12px' }}>
            {isLoading ? <Loader2 size={24} className="animate-spin text-teal-400" /> : formatCurrency(facts?.promisesDueTodayAmount ?? 0, currency)}
          </div>
          <p style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '6px' }}>
            {facts?.promisesDueTodayCount ?? 0} commitments scheduled for today
          </p>
        </div>
      </div>

      {/* Executive Briefing Banner */}
      {attention?.executiveBriefing && (
        <div style={{
          backgroundColor: '#003051',
          border: '1px solid #0F5470',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 165, 129, 0.15)',
            border: '1px solid rgba(0, 165, 129, 0.3)',
            padding: '10px',
            borderRadius: '10px',
            color: '#00A581',
            flexShrink: 0,
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>
              Daily Executive AI Briefing
            </h4>
            <p style={{ color: '#DCEAF0', fontSize: '13.5px', lineHeight: '1.6' }}>
              {attention.executiveBriefing}
            </p>
          </div>
        </div>
      )}

      {/* Priority Customer Queue */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#FFFFFF' }}>
              Priority Collections Queue
            </h3>
            <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '2px' }}>
              Live customer accounts requiring immediate collection attention
            </p>
          </div>
          <Link
            href="/collections"
            style={{
              fontSize: '13px',
              color: '#00A581',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View all in priority queue</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Priority Table / List */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={32} className="animate-spin text-teal-400" />
          </div>
        ) : priorities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#8FB7C7',
            border: '1px dashed #0F5470',
            borderRadius: '8px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>No overdue collections priority records found.</p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: '#5F94A9' }}>
              Create customer receivables or sign in with your active organization account to see live data.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {priorities.map((item) => (
              <div
                key={item.customerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '10px',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: item.urgency === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    border: `1px solid ${item.urgency === 'HIGH' ? '#EF4444' : '#F59E0B'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.urgency === 'HIGH' ? '#EF4444' : '#F59E0B',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}>
                    {item.priorityScore}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        href={`/customers/${item.customerId}`}
                        style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF' }}
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
                    <p style={{ color: '#8FB7C7', fontSize: '12px', marginTop: '3px' }}>
                      {item.reasons && item.reasons.length > 0 ? item.reasons.join(' • ') : `${item.oldestOverdueDays} days overdue`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>
                      {formatCurrency(item.totalOutstanding, item.currency || currency)}
                    </div>
                    <p style={{ fontSize: '11px', color: '#EF4444' }}>
                      {formatCurrency(item.totalOverdue, item.currency || currency)} overdue
                    </p>
                  </div>

                  <Link
                    href={`/messages/draft?customerId=${item.customerId}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#00A581',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <MessageSquareQuote size={14} />
                    <span>Draft Action</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
