'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldAlert, 
  MessageSquareQuote, 
  FileText, 
  Clock, 
  Receipt, 
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'commitments' | 'evidence' | 'memory'>('evidence');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/customers"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#9CA3AF',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '14px',
        border: '1px solid #1F2937',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9FAFB' }}>ABC Stores</h2>
            <span style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              HIGH RISK (78/100)
            </span>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '6px' }}>
            Lagos Island, Nigeria • Contact: Segun Adebayo (+234 803 123 4567)
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#6B7280' }}>
            <span>Customer ID: cust-abc-1</span>
            <span>•</span>
            <span>Payment Terms: Net 14</span>
            <span>•</span>
            <span>Credit Limit: ₦1,500,000</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/messages/draft?id=${params.id}`}
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquareQuote size={16} />
          <span>Draft AI Follow-up</span>
        </Link>
      </div>

      {/* Financial Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ backgroundColor: '#111827', padding: '18px', borderRadius: '10px', border: '1px solid #1F2937' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Total Outstanding</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '6px' }}>₦850,000</div>
          <span style={{ fontSize: '11px', color: '#EF4444' }}>Across 2 overdue invoices</span>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '18px', borderRadius: '10px', border: '1px solid #1F2937' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Oldest Overdue</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444', marginTop: '6px' }}>21 Days</div>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Due date: July 30, 2026</span>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '18px', borderRadius: '10px', border: '1px solid #1F2937' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Historical Paid</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', marginTop: '6px' }}>₦500,000</div>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Last paid June 15, 2026</span>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '18px', borderRadius: '10px', border: '1px solid #1F2937' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Promise Compliance</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B', marginTop: '6px' }}>0% (0/1)</div>
          <span style={{ fontSize: '11px', color: '#FCA5A5' }}>1 commitment missed</span>
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1F2937', paddingBottom: '10px' }}>
        {[
          { key: 'evidence', label: '🔍 "Why?" Evidence Drilldown', icon: HelpCircle },
          { key: 'invoices', label: '📄 Invoices Ledger (3)', icon: FileText },
          { key: 'commitments', label: '⏰ Payment Promises (1)', icon: Clock },
          { key: 'memory', label: '🧠 Business Memory Log', icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeTab === t.key ? 'bold' : '500',
                backgroundColor: activeTab === t.key ? '#10B981' : '#111827',
                color: activeTab === t.key ? '#FFFFFF' : '#9CA3AF',
                border: '1px solid',
                borderColor: activeTab === t.key ? '#10B981' : '#1F2937'
              }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'evidence' && (
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#EF4444" />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB' }}>
                Why ABC Stores is Rated High Risk (Score: 78/100)
              </h3>
            </div>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
              Every risk claim is backed by deterministic database evidence. Netify never hallucinates risk assessments.
            </p>
          </div>

          {/* Evidence Citations Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              backgroundColor: '#1A2234',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #283548',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#EF4444', textTransform: 'uppercase' }}>
                  Signal 1 • Overdue Invoices
                </span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '2px' }}>
                  2 invoices totaling ₦850,000 have elapsed credit terms.
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  Database Evidence: <code style={{ color: '#38BDF8' }}>INV-102 (₦500,000, 21d overdue)</code> and <code style={{ color: '#38BDF8' }}>INV-101 (₦350,000, 14d overdue)</code>
                </div>
              </div>
              <div style={{ textAlign: 'right', color: '#EF4444', fontWeight: 'bold', fontSize: '13px' }}>
                +40 Risk Pts
              </div>
            </div>

            <div style={{
              backgroundColor: '#1A2234',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #283548',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#EF4444', textTransform: 'uppercase' }}>
                  Signal 2 • Broken Payment Commitment
                </span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '2px' }}>
                  Promised payment of ₦300,000 was not fulfilled by Friday deadline.
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  Database Evidence: <code style={{ color: '#38BDF8' }}>COM-001 (Promise date: Friday 10:00 AM, Status: MISSED)</code>
                </div>
              </div>
              <div style={{ textAlign: 'right', color: '#EF4444', fontWeight: 'bold', fontSize: '13px' }}>
                +30 Risk Pts
              </div>
            </div>

            <div style={{
              backgroundColor: '#1A2234',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #283548',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#F59E0B', textTransform: 'uppercase' }}>
                  Signal 3 • Exposure to Historical Ratio
                </span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '2px' }}>
                  Outstanding balance represents 63% of all-time customer transaction volume.
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  Deterministic Metric: <code style={{ color: '#38BDF8' }}>₦850k outstanding / (₦850k + ₦500k paid) = 0.63</code>
                </div>
              </div>
              <div style={{ textAlign: 'right', color: '#F59E0B', fontWeight: 'bold', fontSize: '13px' }}>
                +8 Risk Pts
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          border: '1px solid #1F2937',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #1F2937' }}>
                <th style={{ padding: '12px 18px', fontSize: '12px', color: '#9CA3AF' }}>Invoice Number</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', color: '#9CA3AF' }}>Issued Date</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', color: '#9CA3AF' }}>Due Date</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', color: '#9CA3AF' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', color: '#9CA3AF', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 18px', fontSize: '12px', color: '#9CA3AF', textAlign: 'right' }}>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                <td style={{ padding: '14px 18px', fontWeight: 'bold', color: '#F9FAFB' }}>INV-102</td>
                <td style={{ padding: '14px 18px', color: '#9CA3AF' }}>2026-07-16</td>
                <td style={{ padding: '14px 18px', color: '#EF4444' }}>2026-07-30 (21d overdue)</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>OVERDUE</span>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right', color: '#F9FAFB' }}>₦500,000</td>
                <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 'bold', color: '#EF4444' }}>₦500,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                <td style={{ padding: '14px 18px', fontWeight: 'bold', color: '#F9FAFB' }}>INV-101</td>
                <td style={{ padding: '14px 18px', color: '#9CA3AF' }}>2026-07-23</td>
                <td style={{ padding: '14px 18px', color: '#EF4444' }}>2026-08-06 (14d overdue)</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>OVERDUE</span>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right', color: '#F9FAFB' }}>₦350,000</td>
                <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 'bold', color: '#EF4444' }}>₦350,000</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 18px', fontWeight: 'bold', color: '#F9FAFB' }}>INV-098</td>
                <td style={{ padding: '14px 18px', color: '#9CA3AF' }}>2026-06-01</td>
                <td style={{ padding: '14px 18px', color: '#9CA3AF' }}>2026-06-15</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>PAID</span>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right', color: '#F9FAFB' }}>₦500,000</td>
                <td style={{ padding: '14px 18px', textAlign: 'right', color: '#10B981' }}>₦0</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'commitments' && (
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          border: '1px solid #1F2937',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB', marginBottom: '16px' }}>
            Payment Promises Timeline
          </h3>
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#F9FAFB' }}>₦300,000 Promised</span>
                <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  MISSED
                </span>
              </div>
              <p style={{ color: '#D1D5DB', fontSize: '13px', marginTop: '4px' }}>
                "Hello Alhaji, I will send ₦300,000 on Friday morning for invoice INV-102."
              </p>
              <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                Extracted by AI from WhatsApp message on 2026-08-14
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 'bold' }}>Deadline elapsed 6 days ago</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'memory' && (
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          border: '1px solid #1F2937',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="#10B981" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>
              Persistent Business Memory & Vector Index
            </h3>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '20px' }}>
            All informal agreements, SMS transcripts, invoice receipts, and bank payment notices are indexed with pgvector hybrid search.
          </p>
        </div>
      )}
    </div>
  );
}
