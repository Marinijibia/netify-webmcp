'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customersApi, organizationApi, TeamMemberItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  CreditCard,
  UserCheck,
  Building
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

export default function CreateCustomerPage() {
  const router = useRouter();
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [staffMembers, setStaffMembers] = useState<TeamMemberItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  useEffect(() => {
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
  }, [organization?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the customer or business name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const combinedNotes = [
        notes.trim(),
        creditLimit ? `Credit Limit: ${currency} ${creditLimit}` : null,
      ].filter(Boolean).join('\n');

      const created = await customersApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: combinedNotes || undefined,
      });

      if (assignedStaffId && created.id) {
        try {
          await customersApi.assignStaff(created.id, assignedStaffId);
        } catch {}
      }

      router.push(`/customers/${created.id}`);
    } catch (err: any) {
      console.warn('Failed to create customer:', err);
      setError(err?.message || 'Failed to create customer account in live API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px', margin: '0 auto' }}>
      {/* Back Link */}
      <Link
        href="/customers"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#00A581',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Customer Directory</span>
      </Link>

      {/* Form Card */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '16px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(20px, 4vw, 32px)',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="#00A581" />
            <h2 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: '900', color: tokens.textPrimary, margin: 0 }}>
              {t('customers.addCustomerModalTitle')}
            </h2>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13px', marginTop: '4px' }}>
            Register a debtor or buyer account for credit tracking, automated reminders, and business memory.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Customer / Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alhaji Musa Provisions Ltd"
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                color: tokens.textPrimary,
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
          </div>

          {/* Phone & Email */}
          <div className="responsive-split-2">
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Primary Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="musa@example.com"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Credit Limit & Assigned Staff */}
          <div className="responsive-split-2">
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Credit Limit ({currency})
              </label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={14} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="e.g. 500,000"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Assigned Credit Officer
              </label>
              <div style={{ position: 'relative' }}>
                <UserCheck size={14} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer',
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

          {/* Physical Address */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Physical Address / Store Location
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop 14, Balogun Market, Lagos"
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '8px',
                  color: tokens.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Initial Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Internal Credit Notes & Commercial Terms
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard 14-day net payment terms. Prefers WhatsApp reminders on Mondays."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                color: tokens.textPrimary,
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link
              href="/customers"
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: 'transparent',
                color: tokens.textSecondary,
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #00A581 0%, #007D62 100%)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0, 165, 129, 0.3)',
              }}
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>Create Debtor Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
