'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  AlertCircle, 
  Clock, 
  MessageSquareQuote, 
  ShieldAlert, 
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const mockQueue = [
  {
    id: 'cust-abc-1',
    name: 'ABC Stores',
    contact: 'Segun Adebayo (08031234567)',
    balance: 850000,
    daysOverdue: 21,
    riskScore: 78,
    priorityScore: 95,
    reason: 'MISSED_COMMITMENT',
    reasonLabel: 'Missed Friday ₦300k promise + ₦850k overdue (21d)',
    severity: 'danger',
    suggestedAction: 'Send Firm Follow-up citing missed commitment',
    commitment: 'Promised ₦300k on Friday (elapsed)',
  },
  {
    id: 'cust-north-4',
    name: 'Northern Distribution',
    contact: 'Ibrahim Bello (08098765432)',
    balance: 1200000,
    daysOverdue: 35,
    riskScore: 82,
    priorityScore: 88,
    reason: 'OVERDUE',
    reasonLabel: '35 days overdue, highest balance exposure (₦1.2M)',
    severity: 'danger',
    suggestedAction: 'Offer structured 2-part payment plan',
    commitment: 'None recorded',
  },
  {
    id: 'cust-musa-2',
    name: 'Musa Enterprises',
    contact: 'Musa Garba (08055551234)',
    balance: 450000,
    daysOverdue: 0,
    riskScore: 45,
    priorityScore: 60,
    reason: 'DUE_SOON',
    reasonLabel: 'Invoice INV-103 (₦450k) due tomorrow',
    severity: 'warning',
    suggestedAction: 'Send polite courtesy reminder before due date',
    commitment: 'Payment promised tomorrow',
  },
  {
    id: 'cust-green-3',
    name: 'Greenfield Supplies',
    contact: 'Chidi Okafor (08022223344)',
    balance: 180000,
    daysOverdue: 0,
    riskScore: 12,
    priorityScore: 20,
    reason: 'CURRENT',
    reasonLabel: 'Consistent on-time payer, invoice due in 8 days',
    severity: 'success',
    suggestedAction: 'No action required — standard prompt payer',
    commitment: 'On schedule',
  },
];

export default function CollectionsPage() {
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'MISSED_COMMITMENT' | 'HIGH_RISK'>('ALL');

  const filteredQueue = mockQueue.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'OVERDUE') return item.daysOverdue > 0;
    if (filter === 'MISSED_COMMITMENT') return item.reason === 'MISSED_COMMITMENT';
    if (filter === 'HIGH_RISK') return item.riskScore >= 70;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={24} color="#10B981" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9FAFB' }}>Collections Priority Queue</h2>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
            Deterministically prioritized by invoice age, promise compliance, and financial exposure.
          </p>
        </div>

        {/* Quick stat */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid #1F2937',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#9CA3AF'
        }}>
          Total Collectible: <strong style={{ color: '#EF4444' }}>₦2,500,000</strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1F2937', paddingBottom: '12px' }}>
        {[
          { key: 'ALL', label: 'All Items (4)' },
          { key: 'MISSED_COMMITMENT', label: '⚠️ Broken Promises (1)' },
          { key: 'OVERDUE', label: '🚨 Overdue Accounts (2)' },
          { key: 'HIGH_RISK', label: '🛡️ High Risk (2)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: filter === tab.key ? 'bold' : '500',
              backgroundColor: filter === tab.key ? '#10B981' : '#111827',
              color: filter === tab.key ? '#FFFFFF' : '#9CA3AF',
              border: '1px solid',
              borderColor: filter === tab.key ? '#10B981' : '#1F2937',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredQueue.map((item, index) => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: item.severity === 'danger' ? 'rgba(239, 68, 68, 0.4)' : '#1F2937',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: item.severity === 'danger' ? 'rgba(239, 68, 68, 0.15)' : '#1F2937',
                  color: item.severity === 'danger' ? '#EF4444' : '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  #{index + 1}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB' }}>{item.name}</h3>
                    <span style={{
                      backgroundColor: item.riskScore >= 70 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: item.riskScore >= 70 ? '#EF4444' : '#10B981',
                      border: `1px solid ${item.riskScore >= 70 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      Risk: {item.riskScore}/100
                    </span>
                    <span style={{
                      backgroundColor: '#1E293B',
                      color: '#9CA3AF',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      Priority Rank: {item.priorityScore}
                    </span>
                  </div>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
                    Contact: {item.contact}
                  </p>
                  <p style={{
                    color: item.severity === 'danger' ? '#FCA5A5' : '#D1D5DB',
                    fontSize: '13px',
                    fontWeight: '500',
                    marginTop: '6px'
                  }}>
                    {item.reasonLabel}
                  </p>
                </div>
              </div>

              {/* Financial Amount */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#F9FAFB' }}>
                  ₦{item.balance.toLocaleString()}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: item.daysOverdue > 0 ? '#EF4444' : '#10B981',
                  fontWeight: '600',
                  marginTop: '2px'
                }}>
                  {item.daysOverdue > 0 ? `${item.daysOverdue} days overdue` : 'Current / On Track'}
                </div>
              </div>
            </div>

            {/* AI Recommendation Banner */}
            <div style={{
              backgroundColor: '#1A2234',
              borderRadius: '8px',
              padding: '12px 16px',
              border: '1px solid #283548',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#34D399', textTransform: 'uppercase' }}>
                  AI Recommendation:
                </span>
                <span style={{ fontSize: '13px', color: '#F3F4F6' }}>
                  {item.suggestedAction}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href={`/customers/${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#9CA3AF',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #374151'
                  }}
                >
                  <HelpCircle size={14} />
                  <span>Why? (Evidence)</span>
                </Link>
                <Link
                  href={`/messages/draft?id=${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '6px 14px',
                    borderRadius: '6px'
                  }}
                >
                  <MessageSquareQuote size={14} />
                  <span>Draft Message</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
