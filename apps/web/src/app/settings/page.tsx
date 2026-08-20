'use client';

import React, { useState } from 'react';
import { Settings, Globe, CreditCard, Sparkles, Building, Check } from 'lucide-react';

export default function SettingsPage() {
  const [currency, setCurrency] = useState('NGN');
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
          <Settings size={24} color="#10B981" />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9FAFB' }}>Settings & Configuration</h2>
        </div>
        <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
          Manage your organization profile, multi-currency settings, and AI provider integrations.
        </p>
      </div>

      {/* Organization Profile */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #1F2937',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={18} color="#10B981" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>Organization Profile</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' }}>Company Name</label>
            <input
              type="text"
              readOnly
              value="Apex Trading Ltd"
              style={{
                width: '100%',
                backgroundColor: '#1A2234',
                border: '1px solid #283548',
                borderRadius: '6px',
                padding: '10px',
                color: '#F9FAFB',
                fontSize: '14px',
                marginTop: '4px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' }}>Operating Market</label>
            <input
              type="text"
              readOnly
              value="Lagos, Nigeria (FMCG Wholesale)"
              style={{
                width: '100%',
                backgroundColor: '#1A2234',
                border: '1px solid #283548',
                borderRadius: '6px',
                padding: '10px',
                color: '#F9FAFB',
                fontSize: '14px',
                marginTop: '4px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Multi-Currency Configuration */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #1F2937',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="#10B981" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>Multi-Currency Architecture</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
          Select the base currency for invoices, payments, and risk threshold calculations.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { code: 'NGN', name: 'Nigerian Naira (₦)', locale: 'en-NG' },
            { code: 'GHS', name: 'Ghanaian Cedi (GH₵)', locale: 'en-GH' },
            { code: 'KES', name: 'Kenyan Shilling (KSh)', locale: 'en-KE' },
            { code: 'ZAR', name: 'South African Rand (R)', locale: 'en-ZA' },
            { code: 'USD', name: 'US Dollar ($)', locale: 'en-US' },
            { code: 'GBP', name: 'British Pound (£)', locale: 'en-GB' },
          ].map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: currency === c.code ? '#10B981' : '#1A2234',
                border: '1px solid',
                borderColor: currency === c.code ? '#10B981' : '#283548',
                color: currency === c.code ? '#FFFFFF' : '#D1D5DB',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.code}</div>
              <div style={{ fontSize: '11px', color: currency === c.code ? '#E5E7EB' : '#9CA3AF' }}>{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Provider Telemetry */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #1F2937',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#34D399" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB' }}>AI Provider Status</h3>
        </div>
        <div style={{
          backgroundColor: '#1A2234',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid #283548',
          fontSize: '13px',
          color: '#D1D5DB'
        }}>
          <div><strong>Active Model:</strong> Gemini 1.5 Flash (Development)</div>
          <div style={{ marginTop: '4px', color: '#9CA3AF', fontSize: '12px' }}>
            Production automatically routes to OpenAI GPT-4o via <code style={{ color: '#38BDF8' }}>AI_PROVIDER=openai</code> without frontend code changes.
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #10B981',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Subscription</span>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '2px' }}>
            Netify Growth Pro Plan
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            Unlimited customers, pgvector business memory, automated follow-up drafting.
          </p>
        </div>
        <span style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          padding: '6px 14px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 'bold'
        }}>
          ACTIVE
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {saved ? <Check size={16} /> : null}
          <span>{saved ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
