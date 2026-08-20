'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Search, ChevronRight, ShieldAlert, ShieldCheck } from 'lucide-react';

const mockCustomers = [
  {
    id: 'cust-abc-1',
    name: 'ABC Stores',
    city: 'Lagos Island, Nigeria',
    phone: '+234 803 123 4567',
    totalOutstanding: 850000,
    overdueInvoicesCount: 2,
    totalInvoicesCount: 3,
    riskScore: 78,
    riskLevel: 'HIGH',
    lastPaymentDate: '2026-06-15',
    status: 'ACTIVE',
  },
  {
    id: 'cust-musa-2',
    name: 'Musa Enterprises',
    city: 'Kano, Nigeria',
    phone: '+234 805 555 1234',
    totalOutstanding: 450000,
    overdueInvoicesCount: 0,
    totalInvoicesCount: 2,
    riskScore: 45,
    riskLevel: 'MEDIUM',
    lastPaymentDate: '2026-07-20',
    status: 'ACTIVE',
  },
  {
    id: 'cust-green-3',
    name: 'Greenfield Supplies',
    city: 'Ibadan, Nigeria',
    phone: '+234 802 222 3344',
    totalOutstanding: 180000,
    overdueInvoicesCount: 0,
    totalInvoicesCount: 4,
    riskScore: 12,
    riskLevel: 'LOW',
    lastPaymentDate: '2026-08-01',
    status: 'ACTIVE',
  },
  {
    id: 'cust-north-4',
    name: 'Northern Distribution',
    city: 'Kaduna, Nigeria',
    phone: '+234 809 876 5432',
    totalOutstanding: 1200000,
    overdueInvoicesCount: 1,
    totalInvoicesCount: 2,
    riskScore: 82,
    riskLevel: 'HIGH',
    lastPaymentDate: '2026-05-10',
    status: 'ACTIVE',
  },
  {
    id: 'cust-kano-5',
    name: 'Kano Retail Outlets',
    city: 'Kano, Nigeria',
    phone: '+234 807 111 9988',
    totalOutstanding: 2020000,
    overdueInvoicesCount: 0,
    totalInvoicesCount: 1,
    riskScore: 25,
    riskLevel: 'LOW',
    lastPaymentDate: '2026-08-05',
    status: 'ACTIVE',
  },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = mockCustomers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#10B981" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9FAFB' }}>Customer Directory</h2>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
            All active accounts with real-time financial balances, payment history, and risk classifications.
          </p>
        </div>

        {/* Search Box */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search customers or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#111827',
              border: '1px solid #1F2937',
              borderRadius: '8px',
              padding: '10px 14px 10px 38px',
              color: '#F9FAFB',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #1F2937',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #1F2937' }}>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>Customer</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>Location & Phone</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>Risk Rating</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>Invoices</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', textAlign: 'right' }}>Total Outstanding</th>
              <th style={{ padding: '14px 20px', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr
                key={customer.id}
                style={{
                  borderBottom: '1px solid #1F2937',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <td style={{ padding: '18px 20px' }}>
                  <Link href={`/customers/${customer.id}`} style={{ fontWeight: 'bold', color: '#F9FAFB', fontSize: '15px' }}>
                    {customer.name}
                  </Link>
                </td>
                <td style={{ padding: '18px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                  <div>{customer.city}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{customer.phone}</div>
                </td>
                <td style={{ padding: '18px 20px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: customer.riskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : customer.riskLevel === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: customer.riskLevel === 'HIGH' ? '#EF4444' : customer.riskLevel === 'MEDIUM' ? '#F59E0B' : '#10B981',
                    border: `1px solid ${customer.riskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : customer.riskLevel === 'MEDIUM' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {customer.riskScore}/100 • {customer.riskLevel}
                  </span>
                </td>
                <td style={{ padding: '18px 20px', fontSize: '13px', color: '#D1D5DB' }}>
                  <div>{customer.totalInvoicesCount} total</div>
                  {customer.overdueInvoicesCount > 0 ? (
                    <div style={{ color: '#EF4444', fontSize: '11px', fontWeight: 'bold' }}>
                      {customer.overdueInvoicesCount} overdue
                    </div>
                  ) : (
                    <div style={{ color: '#10B981', fontSize: '11px' }}>All current</div>
                  )}
                </td>
                <td style={{ padding: '18px 20px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#F9FAFB' }}>
                  ₦{customer.totalOutstanding.toLocaleString()}
                </td>
                <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                  <Link href={`/customers/${customer.id}`} style={{ color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <ChevronRight size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
