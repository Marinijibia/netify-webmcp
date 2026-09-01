'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customersApi } from '@/lib/api';
import { 
  Users, 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';

export default function CreateCustomerPage() {
  const router = useRouter();
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the customer or business name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await customersApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      router.push(`/customers/${created.id}`);
    } catch (err: any) {
      console.warn('Failed to create customer:', err);
      setError(err?.message || 'Failed to create customer account in live API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', margin: '0 auto' }}>
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
        borderRadius: '12px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(20px, 4vw, 32px)',
        boxShadow: isLight ? tokens.shadowCard : 'none',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="#00A581" />
            <h2 style={{ fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
              {t('customers.addCustomerModalTitle')}
            </h2>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13px', marginTop: '4px' }}>
            Register a debtor or buyer account for credit tracking and business memory intelligence.
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
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>
              Customer / Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alhaji Musa Provisions"
              style={{
                width: '100%',
                padding: '11px 14px',
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                color: tokens.textPrimary,
                fontSize: '14px',
                outline: 'none',
                boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
              }}
            />
          </div>

          <div className="responsive-split-2">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>
                Primary Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="buyer@domain.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>
              Physical Address / Market Location
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} color={tokens.textMuted} style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop 14, Alaba International Market, Lagos"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '8px',
                  color: tokens.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                  boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>
              Customer Relationship Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pays via bank transfer on alternate Mondays..."
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
                boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            style={{
              marginTop: '10px',
              padding: '12px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
              opacity: isSubmitting || !name.trim() ? 0.6 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Customer...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{t('customers.addCustomerSubmit')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
