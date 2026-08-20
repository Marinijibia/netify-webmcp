import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  AlertTriangle, 
  CalendarCheck, 
  ArrowUpRight, 
  Clock, 
  MessageSquareQuote, 
  Sparkles,
  ShieldAlert,
  Search
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#F9FAFB' }}>
            Good morning, Alhaji Tunde
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>
            Here is your collections priority and business memory overview for <strong style={{ color: '#F3F4F6' }}>Apex Trading Ltd</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid #374151',
              color: '#34D399',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <Sparkles size={16} />
            <span>Ask Business Memory</span>
          </Link>
          <Link
            href="/collections"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <span>Open Collections Queue</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Total Outstanding */}
        <div style={{
          backgroundColor: '#111827',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #1F2937'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>Total Outstanding</span>
            <TrendingUp size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '12px' }}>
            ₦4,700,000
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Across 5 active accounts</p>
        </div>

        {/* Needs Attention */}
        <div style={{
          backgroundColor: '#111827',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(17, 24, 39, 1) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#FCA5A5', textTransform: 'uppercase' }}>Needs Attention</span>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#EF4444', marginTop: '12px' }}>
            ₦1,200,000
          </div>
          <p style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '4px' }}>Overdue or broken promises</p>
        </div>

        {/* Promised This Week */}
        <div style={{
          backgroundColor: '#111827',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #1F2937'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>Promised This Week</span>
            <CalendarCheck size={18} color="#38BDF8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '12px' }}>
            ₦300,000
          </div>
          <p style={{ fontSize: '12px', color: '#38BDF8', marginTop: '4px' }}>1 commitment due Friday</p>
        </div>

        {/* High Risk Accounts */}
        <div style={{
          backgroundColor: '#111827',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #1F2937'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>Risk Watchlist</span>
            <ShieldAlert size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B', marginTop: '12px' }}>
            2 Accounts
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Weighted risk score &gt; 70</p>
        </div>
      </div>

      {/* Main Grid: Priority Queues & Promise Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Immediate Action Attention Board */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '14px',
          border: '1px solid #1F2937',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB' }}>Action Attention Priority</h3>
              <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Ranked deterministically by overdue aging and commitment state</p>
            </div>
            <Link href="/collections" style={{ fontSize: '13px', color: '#10B981', fontWeight: '600' }}>
              View all (5) →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Customer Card 1: ABC Stores */}
            <div style={{
              backgroundColor: '#1A2234',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>ABC Stores</span>
                    <span style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      HIGH RISK (78/100)
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      MISSED PROMISE
                    </span>
                  </div>
                  <p style={{ color: '#FCA5A5', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>
                    ⚠️ Promised ₦300,000 on Friday (elapsed). Total ₦850,000 overdue across 2 invoices.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB' }}>₦850,000</div>
                  <div style={{ fontSize: '12px', color: '#EF4444' }}>21 days overdue</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #283548' }}>
                <Link
                  href="/messages/draft?id=cust-abc-1"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquareQuote size={14} />
                  <span>Draft WhatsApp Follow-up</span>
                </Link>
                <Link
                  href="/customers/cust-abc-1"
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #374151',
                    color: '#F3F4F6',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Inspect Profile & Evidence
                </Link>
              </div>
            </div>

            {/* Customer Card 2: Musa Enterprises */}
            <div style={{
              backgroundColor: '#1A2234',
              borderRadius: '10px',
              border: '1px solid #283548',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>Musa Enterprises</span>
                    <span style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      MEDIUM RISK (45/100)
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      DUE SOON
                    </span>
                  </div>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '6px' }}>
                    Invoice INV-103 for ₦450,000 is due tomorrow. Friendly reminder suggested.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB' }}>₦450,000</div>
                  <div style={{ fontSize: '12px', color: '#38BDF8' }}>Due in 1 day</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #283548' }}>
                <Link
                  href="/messages/draft?id=cust-musa-2"
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #374151',
                    color: '#34D399',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquareQuote size={14} />
                  <span>Send Polite Reminder</span>
                </Link>
                <Link
                  href="/customers/cust-musa-2"
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #374151',
                    color: '#F3F4F6',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  View Ledger
                </Link>
              </div>
            </div>

            {/* Customer Card 3: Northern Distribution */}
            <div style={{
              backgroundColor: '#1A2234',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>Northern Distribution</span>
                    <span style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      HIGH RISK (82/100)
                    </span>
                  </div>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '6px' }}>
                    Overdue by 35 days without recorded promise. High balance exposure.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB' }}>₦1,200,000</div>
                  <div style={{ fontSize: '12px', color: '#EF4444' }}>35 days overdue</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #283548' }}>
                <Link
                  href="/messages/draft?id=cust-north-4"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquareQuote size={14} />
                  <span>Draft Firm Notice</span>
                </Link>
                <Link
                  href="/customers/cust-north-4"
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #374151',
                    color: '#F3F4F6',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Inspect Risk Details
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Promise Tracker & Quick RAG Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Promise Tracker Card */}
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '14px',
            border: '1px solid #1F2937',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Clock size={18} color="#34D399" />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>Payment Promises</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                  <span style={{ color: '#F9FAFB' }}>ABC Stores</span>
                  <span style={{ color: '#EF4444' }}>₦300,000</span>
                </div>
                <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>
                  Status: MISSED (Was due Friday)
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                  Extracted from WhatsApp chat
                </div>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#1A2234',
                border: '1px solid #283548'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                  <span style={{ color: '#F9FAFB' }}>Musa Enterprises</span>
                  <span style={{ color: '#38BDF8' }}>₦450,000</span>
                </div>
                <div style={{ fontSize: '12px', color: '#38BDF8', marginTop: '4px' }}>
                  Status: PENDING (Due Tomorrow)
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                  Invoice INV-103 commitment
                </div>
              </div>
            </div>
          </div>

          {/* Quick Business Memory Assistant Widget */}
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '14px',
            border: '1px solid #1F2937',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={18} color="#10B981" />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>AI Business Memory</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: '18px', marginBottom: '14px' }}>
              Query customer records, past commitments, payment history, and evidence citations in natural language.
            </p>
            <Link
              href="/chat"
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'block',
                textAlign: 'center'
              }}
            >
              Open AI Copilot
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
