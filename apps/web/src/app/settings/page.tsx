'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Settings, Globe, CreditCard, Sparkles, Building, Check, User, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user, organization, isAuthenticated } = useAuth();
  const [currency, setCurrency] = useState(organization?.currency || 'NGN');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={24} color="#00A581" />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Settings & Workspace Preferences</h2>
        </div>
        <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
          Manage your organization profile, multi-currency settings, and AI provider integrations.
        </p>
      </div>

      {/* Organization Profile */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>Organization Profile</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#8FB7C7', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Organization Name
            </label>
            <input
              type="text"
              readOnly
              value={organization?.name || 'Workspace Account'}
              style={{
                width: '100%',
                backgroundColor: '#001D31',
                border: '1px solid #0F5470',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#8FB7C7', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Your Role & Slug
            </label>
            <input
              type="text"
              readOnly
              value={`${organization?.role || 'OWNER'} (${organization?.slug || 'workspace'})`}
              style={{
                width: '100%',
                backgroundColor: '#001D31',
                border: '1px solid #0F5470',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* User Account */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>User Account</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#8FB7C7', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              style={{
                width: '100%',
                backgroundColor: '#001D31',
                border: '1px solid #0F5470',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#8FB7C7', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <input
              type="text"
              readOnly
              value={user?.email || '—'}
              style={{
                width: '100%',
                backgroundColor: '#001D31',
                border: '1px solid #0F5470',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '13.5px',
                marginTop: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Multi-Currency Configuration */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>Base Operating Currency</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#8FB7C7' }}>
          Select the base currency for debtor ledgers, invoices, and risk exposure thresholds.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { code: 'NGN', name: 'Nigerian Naira (₦)' },
            { code: 'KES', name: 'Kenyan Shilling (KSh)' },
            { code: 'GHS', name: 'Ghanaian Cedi (GH₵)' },
            { code: 'USD', name: 'US Dollar ($)' },
            { code: 'ZAR', name: 'South African Rand (R)' },
            { code: 'GBP', name: 'British Pound (£)' },
          ].map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrency(c.code)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: currency === c.code ? '#00A581' : '#001D31',
                border: `1px solid ${currency === c.code ? '#00A581' : '#0F5470'}`,
                color: currency === c.code ? '#FFFFFF' : '#DCEAF0',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.code}</div>
              <div style={{ fontSize: '11px', color: currency === c.code ? '#ECFDF8' : '#8FB7C7' }}>{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Telemetry */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#00A581" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>AI Provider & WebMCP Integration</h3>
        </div>
        <div style={{
          backgroundColor: '#001D31',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid #0F5470',
          fontSize: '13px',
          color: '#DCEAF0',
        }}>
          <div><strong>WebMCP Standard:</strong> W3C / Chrome Native (<code style={{ color: '#3AD0A9' }}>document.modelContext</code>)</div>
          <div style={{ marginTop: '6px', color: '#8FB7C7', fontSize: '12px' }}>
            Backend automatically routes to Google Gemini or OpenAI GPT models based on server configuration.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          style={{
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {saved ? <Check size={16} /> : null}
          <span>{saved ? 'Preferences Saved!' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
}
