'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { customersApi, CustomerItem } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { 
  Users, 
  Search, 
  ChevronRight, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  Plus,
  RefreshCw 
} from 'lucide-react';

export default function CustomersPage() {
  const { organization } = useAuth();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadCustomers = useCallback(async (searchQuery?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customersApi.list({ search: searchQuery });
      setCustomers(data);
    } catch (err: any) {
      console.warn('Failed to load customers from API:', err);
      setError(err?.message || 'Failed to load customers from live API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(search);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#00A581" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Customer Directory</h2>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
            Live customer records, outstanding receivables, contact channels, and behavioral risk scores.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#8FB7C7" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search live customers..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                backgroundColor: '#003051',
                border: '1px solid #0F5470',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </form>

          <button
            onClick={() => loadCustomers(search)}
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
            href="/customers/create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            <Plus size={15} />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Customers Table */}
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
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8FB7C7' }}>
            <Users size={36} color="#5F94A9" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>No customers found</p>
            <p style={{ fontSize: '13px', color: '#8FB7C7', marginTop: '4px' }}>
              {search ? 'No customer matched your search query.' : 'No customers exist in this live organization yet.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#001D31', borderBottom: '1px solid #0F5470', color: '#8FB7C7', fontSize: '12px' }}>
                <th style={{ padding: '14px 20px' }}>CUSTOMER NAME</th>
                <th style={{ padding: '14px 20px' }}>CONTACT</th>
                <th style={{ padding: '14px 20px' }}>STATUS</th>
                <th style={{ padding: '14px 20px' }}>RISK CLASSIFICATION</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>OUTSTANDING</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const isHighRisk = (c.riskScore ?? 0) >= 70 || c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL';

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #0F5470',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <Link href={`/customers/${c.id}`} style={{ fontWeight: '600', color: '#FFFFFF' }}>
                        {c.name}
                      </Link>
                      <p style={{ color: '#8FB7C7', fontSize: '11px', marginTop: '2px' }}>
                        ID: {c.id} {c.address ? `• ${c.address}` : ''}
                      </p>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#DCEAF0' }}>
                      <div>{c.phone || 'No phone'}</div>
                      <p style={{ color: '#8FB7C7', fontSize: '11px' }}>{c.email || 'No email'}</p>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        backgroundColor: c.status === 'ACTIVE' ? 'rgba(0, 165, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                        color: c.status === 'ACTIVE' ? '#3AD0A9' : '#9CA3AF',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isHighRisk ? (
                          <ShieldAlert size={16} color="#EF4444" />
                        ) : (
                          <ShieldCheck size={16} color="#00A581" />
                        )}
                        <span style={{
                          color: isHighRisk ? '#FCA5A5' : '#3AD0A9',
                          fontWeight: '600',
                          fontSize: '12px',
                        }}>
                          {c.riskLevel || (c.riskScore ? `${c.riskScore}/100` : 'NORMAL')}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 'bold', color: '#FFFFFF' }}>
                      {formatCurrency(c.totalOutstanding ?? 0, c.currency || currency)}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <Link
                        href={`/customers/${c.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#00A581',
                          fontWeight: '600',
                          fontSize: '12.5px',
                        }}
                      >
                        <span>View Ledger</span>
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
