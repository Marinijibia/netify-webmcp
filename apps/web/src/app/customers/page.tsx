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
  RefreshCw,
  MessageSquareQuote,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type FilterTab = 'ALL' | 'WITH_BALANCE' | 'HIGH_RISK' | 'CLEAN';

export default function CustomersPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
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

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const outstanding = c.totalOutstanding ?? 0;
    const isRisk = (c.riskScore ?? 0) >= 60 || c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL';

    if (activeFilter === 'WITH_BALANCE') return outstanding > 0;
    if (activeFilter === 'HIGH_RISK') return isRisk;
    if (activeFilter === 'CLEAN') return outstanding === 0;
    return true;
  });

  // Calculate summary metrics
  const totalDebtorsWithBalance = customers.filter((c) => (c.totalOutstanding ?? 0) > 0).length;
  const totalExposureAmount = customers.reduce((sum, c) => sum + (c.totalOutstanding ?? 0), 0);
  const highRiskCount = customers.filter((c) => (c.riskScore ?? 0) >= 60 || c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length;
  const cleanCount = customers.filter((c) => (c.totalOutstanding ?? 0) === 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Header & Quick Action Controls */}
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
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.6px', margin: 0 }}>
              {t('customers.title')}
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
              Live PostgreSQL Balances
            </span>
          </div>

          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            Authoritative debtor records, live outstanding ledger balances, risk classifications, and historical payment memory.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => loadCustomers(search)}
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
            href="/customers/create"
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
              boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
            }}
          >
            <Plus size={15} />
            <span>{t('commandCenter.addCustomer')}</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive KPI Bento Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
      }}>
        {/* Total Exposure */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Debtor Exposure
          </span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : formatCurrency(totalExposureAmount, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: '#00A581', fontWeight: '600' }}>
            Across {totalDebtorsWithBalance} active accounts
          </span>
        </div>

        {/* High / Critical Risk */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)'}`,
          background: isLight ? '#FEF2F2' : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: isLight ? '#DC2626' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            High / Critical Risk
          </span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : highRiskCount}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
            Require proactive follow-up
          </span>
        </div>

        {/* Total Accounts */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Directory Accounts
          </span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : customers.length}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Registered customers
          </span>
        </div>

        {/* Zero Balance / Paid Clean */}
        <div style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${tokens.accentBorder}`,
          background: isLight ? tokens.accentSoft : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#00A581', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Clean / Zero Balance
          </span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#00A581', letterSpacing: '-0.5px' }}>
            {isLoading ? '...' : cleanCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#00A581' }}>
            100% in good standing
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Tab Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.7)',
          padding: '4px',
          borderRadius: '10px',
          border: `1px solid ${tokens.surfaceBorder}`,
        }}>
          {[
            { id: 'ALL', label: `All (${customers.length})` },
            { id: 'WITH_BALANCE', label: `With Balance (${totalDebtorsWithBalance})` },
            { id: 'HIGH_RISK', label: `High Risk (${highRiskCount})` },
            { id: 'CLEAN', label: `Clean (${cleanCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as FilterTab)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: activeFilter === tab.id ? '700' : '500',
                color: activeFilter === tab.id ? '#FFFFFF' : tokens.textSecondary,
                backgroundColor: activeFilter === tab.id ? '#00A581' : 'transparent',
                border: activeFilter === tab.id ? '1px solid #00A581' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customers.searchPlaceholder')}
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 20, 36, 0.8)',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '8px',
              color: tokens.textPrimary,
              fontSize: '12.5px',
              outline: 'none',
              boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
            }}
          />
        </form>
      </div>

      {/* Error Alert */}
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

      {/* 4. Customers Directory Table */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        overflow: 'hidden',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px', gap: '10px', color: tokens.textMuted }}>
            <Loader2 size={30} className="animate-spin text-teal-500" />
            <span style={{ fontSize: '13px' }}>Loading live customer balances & ledger metrics...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: tokens.textSecondary }}>
            <Users size={36} color={tokens.textMuted} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '700', color: tokens.textPrimary, margin: 0 }}>No customers found</p>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
              {search ? 'No customer matched your search query.' : 'No customers exist in this filter category.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: isLight ? '#F8FAFC' : 'rgba(0, 20, 36, 0.85)', borderBottom: `1px solid ${tokens.surfaceBorder}`, color: tokens.textMuted, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                <th style={{ padding: '14px 20px' }}>CUSTOMER & TAGS</th>
                <th style={{ padding: '14px 20px' }}>CONTACT CHANNELS</th>
                <th style={{ padding: '14px 20px' }}>RISK CLASSIFICATION</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>OUTSTANDING BALANCE</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const outstanding = c.totalOutstanding ?? 0;
                const overdue = c.totalOverdue ?? 0;
                const isCritical = c.riskLevel === 'CRITICAL';
                const isHigh = c.riskLevel === 'HIGH' || (c.riskScore ?? 0) >= 60;
                const isMedium = c.riskLevel === 'MEDIUM' || (c.riskScore ?? 0) >= 40;
                
                const riskColor = isCritical ? '#EF4444' : isHigh ? (isLight ? '#DC2626' : '#F87171') : isMedium ? (isLight ? '#D97706' : '#F59E0B') : outstanding > 0 ? '#3B82F6' : '#00A581';
                const riskBg = isCritical ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.18)') : isHigh ? (isLight ? '#FEF2F2' : 'rgba(248, 113, 113, 0.15)') : isMedium ? (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)') : outstanding > 0 ? (isLight ? '#EFF6FF' : 'rgba(59, 130, 246, 0.15)') : tokens.accentSoft;

                const initials = c.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: `1px solid ${tokens.surfaceBorder}`,
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Customer Identity */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: isLight ? '#F0FDF4' : '#00253E',
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
                          <Link
                            href={`/customers/${c.id}`}
                            style={{
                              fontWeight: '700',
                              color: tokens.textPrimary,
                              fontSize: '14.5px',
                              textDecoration: 'none',
                            }}
                          >
                            {c.name}
                          </Link>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            {c.tags && c.tags.length > 0 ? (
                              c.tags.slice(0, 2).map((t, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '10.5px',
                                    color: tokens.textSecondary,
                                    backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 20, 36, 0.6)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    border: `1px solid ${tokens.surfaceBorder}`,
                                  }}
                                >
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: tokens.textMuted, fontSize: '11px' }}>Account ID: {c.id.slice(0, 8)}...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Channels */}
                    <td style={{ padding: '16px 20px', color: tokens.textSecondary }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {c.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: tokens.textPrimary }}>
                            <Phone size={12} color="#00A581" />
                            <span>{c.phone}</span>
                          </div>
                        ) : null}
                        {c.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: tokens.textMuted }}>
                            <Mail size={12} color={tokens.textMuted} />
                            <span>{c.email}</span>
                          </div>
                        ) : null}
                        {c.address ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: tokens.textMuted }}>
                            <MapPin size={11} color={tokens.textMuted} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{c.address}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Risk Classification */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: riskBg, border: `1px solid ${riskColor}40`, padding: '4px 10px', borderRadius: '6px' }}>
                        {outstanding > 0 ? (
                          <ShieldAlert size={14} color={riskColor} />
                        ) : (
                          <ShieldCheck size={14} color="#00A581" />
                        )}
                        <span style={{ color: riskColor, fontWeight: '800', fontSize: '11.5px' }}>
                          {c.riskLevel || (outstanding > 0 ? 'HIGH' : 'NORMAL')} ({c.riskScore ?? 10}/100)
                        </span>
                      </div>
                    </td>

                    {/* Outstanding Balance & Aging */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '900',
                        color: outstanding > 0 ? tokens.textPrimary : '#00A581',
                        letterSpacing: '-0.3px',
                      }}>
                        {formatCurrency(outstanding, c.currency || currency)}
                      </div>
                      
                      {outstanding > 0 ? (
                        <div style={{ fontSize: '11.5px', color: overdue > 0 ? '#EF4444' : tokens.textMuted, marginTop: '2px' }}>
                          {c.oldestOverdueDays ? (
                            <span>{c.oldestOverdueDays} days past terms</span>
                          ) : (
                            <span>Current term</span>
                          )}
                          {c.missedPromisesCount ? (
                            <span style={{ color: isLight ? '#D97706' : '#FCD34D', marginLeft: '4px' }}>• {c.missedPromisesCount} missed promise</span>
                          ) : null}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#00A581', marginTop: '2px' }}>
                          Clean Ledger • Paid
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {outstanding > 0 && (
                          <Link
                            href={`/messages/draft?customerId=${c.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: tokens.accentSoft,
                              border: `1px solid ${tokens.accentBorder}`,
                              color: '#00A581',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <MessageSquareQuote size={13} />
                            <span>Draft Follow-up</span>
                          </Link>
                        )}

                        <Link
                          href={`/customers/${c.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 20, 36, 0.7)',
                            border: `1px solid ${tokens.surfaceBorder}`,
                            color: tokens.textPrimary,
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                          }}
                        >
                          <span>Ledger</span>
                          <ChevronRight size={13} color={tokens.textMuted} />
                        </Link>
                      </div>
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
