'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Lock, Mail, User, Building, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: '',
    currency: 'NGN',
    country: 'NG',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.organizationName) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register(formData);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#001D31',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#003051',
        borderRadius: '16px',
        border: '1px solid #0F5470',
        padding: '36px 32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '24px',
            marginBottom: '12px',
          }}>
            N
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            Register Organization Workspace
          </h1>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
            Create your account to start managing receivables & AI collections
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#FCA5A5',
            fontSize: '13px',
          }}>
            <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DCEAF0', marginBottom: '4px' }}>
                FIRST NAME *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Tunde"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DCEAF0', marginBottom: '4px' }}>
                LAST NAME *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Bakare"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DCEAF0', marginBottom: '4px' }}>
              BUSINESS / ORGANIZATION NAME *
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={16} color="#8FB7C7" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder="Apex Trading Ltd"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DCEAF0', marginBottom: '4px' }}>
              WORK EMAIL *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#8FB7C7" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="owner@apextrading.ng"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DCEAF0', marginBottom: '4px' }}>
              PASSWORD *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#8FB7C7" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 8 characters"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DCEAF0', marginBottom: '4px' }}>
                PRIMARY CURRENCY
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="NGN">NGN - Nigerian Naira (₦)</option>
                <option value="KES">KES - Kenyan Shilling (KSh)</option>
                <option value="GHS">GHS - Ghanaian Cedi (GH₵)</option>
                <option value="USD">USD - US Dollar ($)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#DCEAF0', marginBottom: '4px' }}>
                COUNTRY
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="NG">Nigeria</option>
                <option value="KE">Kenya</option>
                <option value="GH">Ghana</option>
                <option value="US">Other / International</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '10px',
              padding: '12px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating workspace...</span>
              </>
            ) : (
              <>
                <span>Create Workspace</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #0F5470', paddingTop: '14px' }}>
          <p style={{ color: '#8FB7C7', fontSize: '13px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#00A581', fontWeight: '600' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
