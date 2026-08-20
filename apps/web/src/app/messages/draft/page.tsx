'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquareQuote, 
  Sparkles, 
  Copy, 
  ExternalLink, 
  Check, 
  ArrowLeft,
  Smartphone,
  MessageCircle
} from 'lucide-react';

export default function MessageDraftPage() {
  const [tone, setTone] = useState<'polite_reminder' | 'firm_followup' | 'payment_plan' | 'urgent_escalation'>('firm_followup');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [copied, setCopied] = useState(false);

  const drafts = {
    polite_reminder: "Good day Mr. Segun, Alhaji Tunde here from Apex Trading Ltd. We hope business is moving smoothly. We are following up regarding invoice INV-102 for ₦500,000. Kindly confirm when the transfer will be initiated so we can balance your ledger. Thank you!",
    firm_followup: "Dear Mr. Segun, following up from Apex Trading regarding the overdue balance of ₦850,000 for ABC Stores. The commitment of ₦300,000 promised for Friday morning has now elapsed without receipt. Kindly ensure payment is remitted today to maintain uninterrupted consignments.",
    payment_plan: "Good day Mr. Segun. To assist ABC Stores with cash flow regarding the ₦850,000 balance, Apex Trading can accept a structured payment: ₦300,000 this week and the remaining balance in 14 days. Kindly let us know if this works for your team.",
    urgent_escalation: "URGENT NOTICE: Mr. Segun, your account ABC Stores is 21 days overdue with ₦850,000 outstanding across invoices INV-102 and INV-101. Multiple commitments have been missed. Please contact Alhaji Tunde immediately to resolve payment before credit facilities are frozen.",
  };

  const [messageText, setMessageText] = useState(drafts.firm_followup);

  const handleToneChange = (newTone: typeof tone) => {
    setTone(newTone);
    setMessageText(drafts[newTone]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/2348031234567?text=${encoded}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '900px' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/collections"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#9CA3AF',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Collections</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquareQuote size={24} color="#10B981" />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9FAFB' }}>
            AI Follow-up Message Generator
          </h2>
        </div>
        <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
          Context-aware communications tailored for African SME business relationships. Respectful, clear, and action-oriented.
        </p>
      </div>

      {/* Target Recipient Card */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '10px',
        border: '1px solid #1F2937',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 'bold' }}>Recipient Account</span>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9FAFB', marginTop: '2px' }}>
            ABC Stores (Segun Adebayo)
          </div>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>Phone: +234 803 123 4567 • Balance: ₦850,000</span>
        </div>
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          Missed Friday Promise (₦300k)
        </div>
      </div>

      {/* Generator Controls */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '14px',
        border: '1px solid #1F2937',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Tone Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Select Tone
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { key: 'polite_reminder', label: 'Polite Reminder', desc: 'Courteous check-in' },
              { key: 'firm_followup', label: 'Firm Follow-up', desc: 'References broken promise' },
              { key: 'payment_plan', label: 'Payment Plan Offer', desc: 'Proposes installments' },
              { key: 'urgent_escalation', label: 'Urgent Escalation', desc: 'Pending credit freeze' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => handleToneChange(t.key as any)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: tone === t.key ? '#10B981' : '#1A2234',
                  border: '1px solid',
                  borderColor: tone === t.key ? '#10B981' : '#283548',
                  textAlign: 'left',
                  color: tone === t.key ? '#FFFFFF' : '#D1D5DB'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{t.label}</div>
                <div style={{ fontSize: '11px', color: tone === t.key ? '#E5E7EB' : '#9CA3AF', marginTop: '2px' }}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase' }}>
              Review & Customize Draft Message
            </label>
            <span style={{ fontSize: '11px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              AI Drafted with Gemini 1.5 Flash
            </span>
          </div>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              backgroundColor: '#1A2234',
              border: '1px solid #283548',
              borderRadius: '8px',
              padding: '14px',
              color: '#F9FAFB',
              fontSize: '14px',
              lineHeight: '22px',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #1F2937' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid #374151',
              color: '#F9FAFB',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              padding: '12px 22px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            <MessageCircle size={16} />
            <span>Open in WhatsApp Web</span>
          </button>
        </div>
      </div>
    </div>
  );
}
