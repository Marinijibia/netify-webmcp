'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  customersApi, 
  commitmentsApi, 
  collectionActivitiesApi, 
  organizationApi, 
  CustomerItem, 
  TeamMemberItem,
  ActivityOutcome,
  CollectionChannel
} from '@/lib/api';
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
  ArrowUpRight,
  UserCheck,
  Download,
  CalendarCheck,
  PhoneCall,
  SlidersHorizontal,
  Check,
  X,
  CheckSquare,
  Square,
  Building
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

type FilterTab = 'ALL' | 'WITH_BALANCE' | 'HIGH_RISK' | 'CLEAN';
type SortOption = 'OUTSTANDING_DESC' | 'OVERDUE_DAYS_DESC' | 'RISK_DESC' | 'NAME_ASC';

interface PromiseModalData {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  promisedFor: string;
  notes: string;
  isSaving: boolean;
}

interface CallModalData {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  phone?: string;
  channel: CollectionChannel;
  outcome: ActivityOutcome;
  notes: string;
  isSaving: boolean;
}

export default function CustomersPage() {
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [staffMembers, setStaffMembers] = useState<TeamMemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('OUTSTANDING_DESC');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Selection
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  // In-line Promise Logger Modal State
  const [promiseModal, setPromiseModal] = useState<PromiseModalData>({
    isOpen: false,
    customerId: '',
    customerName: '',
    amount: 0,
    currency: 'NGN',
    promisedFor: '',
    notes: '',
    isSaving: false,
  });

  // Quick Call Logger Modal State
  const [callModal, setCallModal] = useState<CallModalData>({
    isOpen: false,
    customerId: '',
    customerName: '',
    phone: '',
    channel: 'PHONE',
    outcome: 'CONTACTED',
    notes: '',
    isSaving: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customersApi.list({ pageSize: 200 });
      setCustomers(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live customers from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    async function loadStaff() {
      if (!organization?.id) return;
      try {
        const mems = await organizationApi.getMembers(organization.id);
        setStaffMembers(mems);
      } catch (e) {
        console.warn('Could not fetch staff members:', e);
      }
    }
    loadStaff();
  }, [loadCustomers, organization?.id]);

  const handleAssignStaff = async (customerId: string, staffUserId: string | null) => {
    try {
      const updated = await customersApi.assignStaff(customerId, staffUserId);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, assignedStaffId: staffUserId, assignedStaff: updated.assignedStaff } : c))
      );
      setToastMessage('Assigned staff updated!');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e: any) {
      alert(e?.message || 'Failed to assign staff member.');
    }
  };

  // Filter and Sort
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const outstanding = c.totalOutstanding ?? 0;
        const isRisk = (c.riskScore ?? 0) >= 60 || c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL';

        // Tab Filter
        if (activeFilter === 'WITH_BALANCE' && outstanding <= 0) return false;
        if (activeFilter === 'HIGH_RISK' && !isRisk) return false;
        if (activeFilter === 'CLEAN' && outstanding > 0) return false;

        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const nameMatch = c.name.toLowerCase().includes(q);
          const phoneMatch = c.phone ? c.phone.toLowerCase().includes(q) : false;
          const emailMatch = c.email ? c.email.toLowerCase().includes(q) : false;
          const addressMatch = c.address ? c.address.toLowerCase().includes(q) : false;
          if (!nameMatch && !phoneMatch && !emailMatch && !addressMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'OUTSTANDING_DESC') return (b.totalOutstanding ?? 0) - (a.totalOutstanding ?? 0);
        if (sortOption === 'OVERDUE_DAYS_DESC') return (b.oldestOverdueDays ?? 0) - (a.oldestOverdueDays ?? 0);
        if (sortOption === 'RISK_DESC') return (b.riskScore ?? 0) - (a.riskScore ?? 0);
        if (sortOption === 'NAME_ASC') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [customers, activeFilter, search, sortOption]);

  // Metrics
  const totalDebtorsCount = customers.filter((c) => (c.totalOutstanding ?? 0) > 0).length;
  const totalDebtSum = customers.reduce((sum, c) => sum + (c.totalOutstanding ?? 0), 0);
  const totalOverdueSum = customers.reduce((sum, c) => sum + (c.totalOverdue ?? 0), 0);

  // Bulk Selection toggle
  const toggleSelectAll = () => {
    if (selectedCustomerIds.size === filteredCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(filteredCustomers.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Promise Modal
  const handleOpenPromiseModal = (cust: CustomerItem) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateStr = nextDate.toISOString().split('T')[0];

    setPromiseModal({
      isOpen: true,
      customerId: cust.id,
      customerName: cust.name,
      amount: cust.totalOverdue && cust.totalOverdue > 0 ? cust.totalOverdue : (cust.totalOutstanding || 0),
      currency: cust.currency || currency,
      promisedFor: dateStr,
      notes: 'Customer agreed to settle payment via WhatsApp/Phone',
      isSaving: false,
    });
  };

  // Save Promise
  const handleSavePromise = async () => {
    if (!promiseModal.customerId || promiseModal.amount <= 0 || !promiseModal.promisedFor) {
      alert('Please specify a valid amount and agreed payment date.');
      return;
    }

    setPromiseModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await commitmentsApi.createCommitment({
        customerId: promiseModal.customerId,
        amount: Number(promiseModal.amount),
        currency: promiseModal.currency,
        promisedFor: new Date(promiseModal.promisedFor).toISOString(),
        notes: promiseModal.notes,
      });

      try {
        await collectionActivitiesApi.createActivity({
          customerId: promiseModal.customerId,
          type: 'PAYMENT_REMINDER',
          channel: 'PHONE',
          outcome: 'PROMISED_PAYMENT',
          notes: `Promise recorded for ${formatCurrency(promiseModal.amount, promiseModal.currency)} on ${promiseModal.promisedFor}`,
        });
      } catch {}

      setToastMessage(`Promise for ${promiseModal.customerName} logged!`);
      setTimeout(() => setToastMessage(null), 3000);

      setPromiseModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
      loadCustomers();
    } catch (err: any) {
      alert(`Could not log promise: ${err?.message || 'Server error'}`);
      setPromiseModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Open Call Modal
  const handleOpenCallModal = (cust: CustomerItem) => {
    setCallModal({
      isOpen: true,
      customerId: cust.id,
      customerName: cust.name,
      phone: cust.phone || '',
      channel: 'PHONE',
      outcome: 'CONTACTED',
      notes: `Called debtor regarding ${formatCurrency(cust.totalOutstanding || 0, cust.currency || currency)} outstanding balance.`,
      isSaving: false,
    });
  };

  // Save Call Activity
  const handleSaveCallActivity = async () => {
    setCallModal((prev) => ({ ...prev, isSaving: true }));
    try {
      await collectionActivitiesApi.createActivity({
        customerId: callModal.customerId,
        type: 'CALL',
        channel: callModal.channel,
        outcome: callModal.outcome,
        notes: callModal.notes,
      });

      setToastMessage(`Call outcome for ${callModal.customerName} logged!`);
      setTimeout(() => setToastMessage(null), 3000);

      setCallModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
    } catch (err: any) {
      alert(`Could not log activity: ${err?.message || 'Server error'}`);
      setCallModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedCustomerIds.size > 0
      ? filteredCustomers.filter((c) => selectedCustomerIds.has(c.id))
      : filteredCustomers;

    if (listToExport.length === 0) {
      alert('No customer records to export.');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone',
      'Email',
      'Total Outstanding',
      'Total Overdue',
      'Oldest Overdue Days',
      'Risk Tier',
      'Risk Score',
      'Assigned Staff',
    ];

    const rows = listToExport.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      c.totalOutstanding || 0,
      c.totalOverdue || 0,
      c.oldestOverdueDays || 0,
      c.riskLevel || 'LOW',
      c.riskScore || 0,
      `"${c.assignedStaff ? `${c.assignedStaff.firstName} ${c.assignedStaff.lastName}` : 'Unassigned'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Netify_Customers_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 999999,
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
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
              {t('customers.title')}
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              color: '#00A581',
              fontSize: '12px',
              fontWeight: '700',
            }}>
              {customers.length} Accounts
            </span>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', margin: '4px 0 0' }}>
            Comprehensive directory of debtor profiles, credit limits, and collection records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
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
            <span>{selectedCustomerIds.size > 0 ? `Export (${selectedCustomerIds.size})` : 'Export CSV'}</span>
          </button>

          {/* Add Customer */}
          <Link
            href="/customers/create"
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
            <Plus size={15} />
            <span>{t('customers.addCustomer')}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI Summary Bento */}
      <div className="responsive-grid-3">
        {/* Total Receivables Exposure */}
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
            Total Outstanding Receivables
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {isLoading ? '...' : formatCurrency(totalDebtSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
            Across {totalDebtorsCount} debtor accounts with active balances
          </span>
        </div>

        {/* Total Delinquent Overdue */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.35)'}`,
          background: isLight ? '#FEF2F2' : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isLight ? '#DC2626' : '#FCA5A5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Past-Due Balance
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: '#EF4444', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {isLoading ? '...' : formatCurrency(totalOverdueSum, currency)}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#B91C1C' : '#FCA5A5' }}>
            Requires immediate collections outreach
          </span>
        </div>

        {/* High Risk Accounts */}
        <div className="hover-lift" style={{
          backgroundColor: tokens.surface,
          padding: '18px 20px',
          borderRadius: '12px',
          border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.35)'}`,
          background: isLight ? '#FFFBEB' : 'rgba(0, 32, 53, 0.7)',
          boxShadow: isLight ? tokens.shadowCard : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isLight ? '#D97706' : '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            High Risk Accounts
          </span>
          <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', color: isLight ? '#D97706' : '#F59E0B', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {isLoading ? '...' : customers.filter((c) => (c.riskScore ?? 0) >= 60 || c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length}
          </div>
          <span style={{ fontSize: '11.5px', color: isLight ? '#92400E' : '#FCD34D' }}>
            High default probability or chronic late payment
          </span>
        </div>
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
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Search, Filter Tabs & Sort Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 280px)' }}>
          <Search size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, email, or address..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '8px',
              fontSize: '12.5px',
              color: tokens.textPrimary,
              outline: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: tokens.textMuted,
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
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
        }}>
          {[
            { key: 'ALL', label: `All (${customers.length})` },
            { key: 'WITH_BALANCE', label: `With Balance (${totalDebtorsCount})` },
            { key: 'HIGH_RISK', label: `High Risk (${customers.filter((c) => (c.riskScore ?? 0) >= 60 || c.riskLevel === 'HIGH').length})` },
            { key: 'CLEAN', label: `Settled (${customers.filter((c) => (c.totalOutstanding ?? 0) === 0).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key as FilterTab)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: activeFilter === tab.key ? '700' : '500',
                color: activeFilter === tab.key ? '#FFFFFF' : tokens.textSecondary,
                backgroundColor: activeFilter === tab.key ? '#00A581' : 'transparent',
                border: activeFilter === tab.key ? '1px solid #00A581' : '1px solid transparent',
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

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={13} color={tokens.textMuted} />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: tokens.textPrimary,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="OUTSTANDING_DESC">Sort: Highest Debt</option>
            <option value="OVERDUE_DAYS_DESC">Sort: Oldest Overdue</option>
            <option value="RISK_DESC">Sort: Highest Risk Score</option>
            <option value="NAME_ASC">Sort: Customer Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Select All Toggle */}
      {filteredCustomers.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: tokens.textSecondary, padding: '0 4px' }}>
          <button
            type="button"
            onClick={toggleSelectAll}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: tokens.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
            }}
          >
            {selectedCustomerIds.size === filteredCustomers.length ? (
              <CheckSquare size={14} color="#00A581" />
            ) : (
              <Square size={14} color={tokens.textMuted} />
            )}
            <span>Select All ({filteredCustomers.length} Customers)</span>
          </button>

          {selectedCustomerIds.size > 0 && (
            <span style={{ fontWeight: '700', color: '#00A581' }}>
              {selectedCustomerIds.size} customer accounts selected
            </span>
          )}
        </div>
      )}

      {/* 4. Customer Directory Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 8vw, 80px)', gap: '10px', color: tokens.textMuted }}>
          <Loader2 size={36} className="animate-spin text-teal-500" />
          <span style={{ fontSize: '13px' }}>Loading customer directory & credit profiles...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '14px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '60px 20px',
          textAlign: 'center',
          color: tokens.textSecondary,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <Users size={36} color={tokens.textMuted} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>No Customers Found</h3>
          <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '4px' }}>
            {search ? 'No customer accounts match your search.' : 'Start by registering your first customer ledger.'}
          </p>
          <Link
            href="/customers/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '16px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            <Plus size={14} />
            <span>Add Customer</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredCustomers.map((cust) => {
            const outstanding = cust.totalOutstanding ?? 0;
            const overdue = cust.totalOverdue ?? 0;
            const isSelected = selectedCustomerIds.has(cust.id);
            const isHighRisk = (cust.riskScore ?? 0) >= 60 || cust.riskLevel === 'HIGH' || cust.riskLevel === 'CRITICAL';
            const isMediumRisk = (cust.riskScore ?? 0) >= 35 || cust.riskLevel === 'MEDIUM';

            return (
              <div
                key={cust.id}
                className="hover-lift"
                style={{
                  backgroundColor: isSelected ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.08)') : tokens.surface,
                  borderRadius: '14px',
                  border: isSelected ? '1.5px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: isLight ? tokens.shadowCard : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minWidth: 'min(100%, 360px)', flex: 1 }}>
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(cust.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      marginTop: '2px',
                      color: isSelected ? '#00A581' : tokens.textMuted,
                    }}
                  >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Link
                        href={`/customers/${cust.id}`}
                        style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, textDecoration: 'none' }}
                      >
                        {cust.name}
                      </Link>

                      {/* Risk Badge */}
                      <span style={{
                        backgroundColor: isHighRisk 
                          ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)') 
                          : isMediumRisk 
                          ? (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)') 
                          : tokens.accentSoft,
                        color: isHighRisk ? '#DC2626' : isMediumRisk ? '#D97706' : '#00A581',
                        border: `1px solid ${isHighRisk ? '#FCA5A5' : isMediumRisk ? '#FDE68A' : tokens.accentBorder}`,
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '800',
                      }}>
                        {isHighRisk ? 'HIGH RISK' : isMediumRisk ? 'MEDIUM RISK' : 'LOW RISK'} • {cust.riskScore || 0}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: tokens.textSecondary, flexWrap: 'wrap' }}>
                      {cust.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="#00A581" />
                          <span>{cust.phone}</span>
                        </span>
                      )}
                      {cust.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} color={tokens.textMuted} />
                          <span>{cust.email}</span>
                        </span>
                      )}
                      {cust.address && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color={tokens.textMuted} />
                          <span>{cust.address}</span>
                        </span>
                      )}
                    </div>

                    {/* Assigned Officer Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11.5px' }}>
                      <UserCheck size={12} color={tokens.textMuted} />
                      <span style={{ color: tokens.textSecondary }}>Officer:</span>
                      <select
                        value={cust.assignedStaffId || ''}
                        onChange={(e) => handleAssignStaff(cust.id, e.target.value || null)}
                        style={{
                          backgroundColor: 'transparent',
                          border: `1px solid ${tokens.surfaceBorder}`,
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          color: tokens.textPrimary,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="">Unassigned</option>
                        {staffMembers.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.user?.firstName || m.user?.email || m.userId} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions Hub */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '17px', fontWeight: '900', color: tokens.textPrimary, letterSpacing: '-0.4px', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(outstanding, cust.currency || currency)}
                    </div>
                    {overdue > 0 ? (
                      <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700', marginTop: '2px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(overdue, cust.currency || currency)} overdue
                      </p>
                    ) : (
                      <p style={{ fontSize: '11.5px', color: '#00A581', fontWeight: '600', marginTop: '2px', margin: 0 }}>
                        Current / No Overdue
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Log Call */}
                    <button
                      type="button"
                      onClick={() => handleOpenCallModal(cust)}
                      title="Log phone call outcome"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 32, 53, 0.8)',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <PhoneCall size={13} color="#00A581" />
                      <span>Log Call</span>
                    </button>

                    {/* Log Promise */}
                    <button
                      type="button"
                      onClick={() => handleOpenPromiseModal(cust)}
                      title="Log agreed promise-to-pay date"
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
                        border: `1px solid ${isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.4)'}`,
                        color: isLight ? '#D97706' : '#FCD34D',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CalendarCheck size={13} />
                      <span>Promise</span>
                    </button>

                    {/* View Ledger */}
                    <Link
                      href={`/customers/${cust.id}`}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 20, 36, 0.7)',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Ledger</span>
                      <ChevronRight size={13} color={tokens.textMuted} />
                    </Link>

                    {/* Draft AI Message */}
                    <Link
                      href={`/messages/draft?customerId=${cust.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(0, 165, 129, 0.25)',
                      }}
                    >
                      <MessageSquareQuote size={13} />
                      <span>Draft</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. In-Line Promise-to-Pay Logger Modal */}
      {promiseModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPromiseModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={18} color="#00A581" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Log Payment Promise
                </h3>
              </div>
              <button
                onClick={() => setPromiseModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Recording a verbal promise sets automated reminder alerts and tracks fulfillment memory for <strong>{promiseModal.customerName}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Promised Amount ({promiseModal.currency})
                </label>
                <input
                  type="number"
                  value={promiseModal.amount}
                  onChange={(e) => setPromiseModal((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Promised Payment Date
                </label>
                <input
                  type="date"
                  value={promiseModal.promisedFor}
                  onChange={(e) => setPromiseModal((prev) => ({ ...prev, promisedFor: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Agreed Channel & Notes
                </label>
                <textarea
                  value={promiseModal.notes}
                  onChange={(e) => setPromiseModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '12px',
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setPromiseModal((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: 'transparent',
                  color: tokens.textSecondary,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePromise}
                disabled={promiseModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: promiseModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {promiseModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Promise</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Quick Call Logger Modal */}
      {callModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={18} color="#00A581" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
                  Log Call Outcome
                </h3>
              </div>
              <button
                onClick={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: tokens.textSecondary }}>
              Recording phone outreach updates collection timelines for <strong>{callModal.customerName}</strong> {callModal.phone ? `(${callModal.phone})` : ''}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Call Result / Outcome
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { key: 'PROMISED_PAYMENT', label: '🤝 Promised Payment' },
                    { key: 'CONTACTED', label: '📞 Contacted & Reminded' },
                    { key: 'NO_RESPONSE', label: '📵 No Answer / Busy' },
                    { key: 'REQUESTED_EXTENSION', label: '⏳ Asked for Extension' },
                    { key: 'DISPUTE', label: '⚠️ Disputed Invoice' },
                    { key: 'WRONG_CONTACT', label: '❌ Wrong Number' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setCallModal((prev) => ({ ...prev, outcome: opt.key as ActivityOutcome }))}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        textAlign: 'left',
                        cursor: 'pointer',
                        backgroundColor: callModal.outcome === opt.key ? '#00A581' : (isLight ? '#F1F5F9' : '#001424'),
                        color: callModal.outcome === opt.key ? '#FFFFFF' : tokens.textPrimary,
                        border: callModal.outcome === opt.key ? '1px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Call Notes
                </label>
                <textarea
                  value={callModal.notes}
                  onChange={(e) => setCallModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '12px',
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: 'transparent',
                  color: tokens.textSecondary,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCallActivity}
                disabled={callModal.isSaving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00A581 0%, #008B6E 100%)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  cursor: callModal.isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {callModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Log Outcome</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
