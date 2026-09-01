'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { CustomerItem } from '@/lib/api/customers';
import { formatCurrency } from '@/lib/formatters';
import { formatDisplayPhone, getPhoneQrPayload, getSmsQrPayload } from '@/lib/deeplink';
import { commitmentsApi } from '@/lib/api/commitments';
import { collectionActivitiesApi, receivablesApi, ReceivableItem } from '@/lib/api';
import {
  PhoneCall,
  MessageSquare,
  X,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  HelpCircle,
  Loader2,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

interface PhoneQrBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerItem | null;
  mode: 'PHONE_CALL' | 'SMS';
  scriptText: string;
  onActionComplete?: (notes: string) => void;
}

type CallOutcomeType = 'PROMISED' | 'CALLBACK' | 'NO_ANSWER' | 'DISPUTED';

export default function PhoneQrBridgeModal({
  isOpen,
  onClose,
  customer,
  mode,
  scriptText,
  onActionComplete,
}: PhoneQrBridgeModalProps) {
  const { tokens, isLight } = useTheme();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);

  // Copy state
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Call outcome state
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcomeType | null>(null);
  const [promisedAmount, setPromisedAmount] = useState<string>('');
  const [promisedDate, setPromisedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [callNotes, setCallNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync default amount
  useEffect(() => {
    if (customer?.totalOutstanding) {
      setPromisedAmount(String(customer.totalOutstanding));
    }
  }, [customer]);

  // Generate QR Code data URL
  useEffect(() => {
    if (!isOpen || !customer) return;

    let payload = '';
    if (mode === 'PHONE_CALL') {
      payload = getPhoneQrPayload(customer.phone);
    } else {
      payload = getSmsQrPayload(customer.phone, scriptText);
    }

    if (!payload) {
      setIsGeneratingQr(false);
      return;
    }

    setIsGeneratingQr(true);
    QRCode.toDataURL(payload, {
      margin: 1,
      width: 220,
      color: {
        dark: '#001D31',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGeneratingQr(false);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        setIsGeneratingQr(false);
      });
  }, [isOpen, customer, mode, scriptText]);

  if (!isOpen || !customer) return null;

  const handleCopyPhone = () => {
    if (customer.phone) {
      navigator.clipboard.writeText(customer.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleCopyText = () => {
    if (scriptText) {
      navigator.clipboard.writeText(scriptText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleSaveOutcome = async () => {
    if (!selectedOutcome) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let outcomeLabel = 'CONTACTED';
      let outcomeText = '';

      if (selectedOutcome === 'PROMISED') {
        outcomeLabel = 'PROMISED_PAYMENT';
        outcomeText = `[QR Desktop Bridge] Customer verbally promised payment of ₦${Number(
          promisedAmount || 0
        ).toLocaleString()} on ${promisedDate}. Notes: ${callNotes || 'None'}`;
      } else if (selectedOutcome === 'CALLBACK') {
        outcomeLabel = 'REQUESTED_EXTENSION';
        outcomeText = `[QR Desktop Bridge] Customer requested callback or payment extension. Notes: ${
          callNotes || 'Customer busy'
        }`;
      } else if (selectedOutcome === 'NO_ANSWER') {
        outcomeLabel = 'NO_RESPONSE';
        outcomeText = `[QR Desktop Bridge] Called customer line (${customer.phone || 'N/A'}), no response / busy.`;
      } else if (selectedOutcome === 'DISPUTED') {
        outcomeLabel = 'DISPUTE';
        outcomeText = `[QR Desktop Bridge] Customer disputed balance or delivery during phone call. Notes: ${
          callNotes || 'Dispute raised'
        }`;
      }

      // Find open receivable
      let targetRecId: string | undefined;
      try {
        const recs = await receivablesApi.list({ customerId: customer.id });
        const openRec = recs.find(r => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE') || recs[0];
        targetRecId = openRec?.id;
      } catch (e) {
        console.warn('Could not query receivables:', e);
      }

      if (!targetRecId) {
        try {
          const newRec = await receivablesApi.create({
            customerId: customer.id,
            amount: Number(customer.totalOutstanding || promisedAmount || 100000),
            dueDate: promisedDate || new Date(Date.now() + 86400000 * 7).toISOString(),
            currency: customer.currency || 'NGN',
            description: 'Direct call QR bridge ledger',
            reference: `INV-${Date.now().toString().slice(-4)}`,
          });
          targetRecId = newRec.id;
        } catch (e) {
          console.warn('Could not create receivable:', e);
        }
      }

      if (targetRecId) {
        await collectionActivitiesApi.createActivity({
          receivableId: targetRecId,
          customerId: customer.id,
          type: 'CALL',
          channel: 'PHONE',
          outcome: outcomeLabel as any,
          notes: outcomeText,
        });
      }

      if (selectedOutcome === 'PROMISED' && Number(promisedAmount) > 0 && targetRecId) {
        try {
          await commitmentsApi.createCommitment({
            receivableId: targetRecId,
            customerId: customer.id,
            amount: Number(promisedAmount),
            currency: customer.currency || 'NGN',
            promisedFor: promisedDate,
            notes: `Recorded via Desktop QR Phone Bridge: ${callNotes || 'Verbal commitment on call'}`,
          });
        } catch (commitErr) {
          console.warn('Could not auto-bind commitment:', commitErr);
        }
      }

      setSuccessMsg('Outcome and debtor ledger updated successfully!');
      if (onActionComplete) {
        onActionComplete(outcomeText);
      }

      setTimeout(() => {
        onClose();
        setSelectedOutcome(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to log outcome:', err);
      setErrorMsg(err?.message || 'Failed to save outcome.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 16, 28, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 16px)',
      }}
    >
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: 'clamp(12px, 2vw, 16px)',
          width: '100%',
          maxWidth: 'min(780px, calc(100vw - 24px))',
          maxHeight: '92svh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.15)' : '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: isLight ? '#F8FAFC' : '#00253F',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: mode === 'PHONE_CALL' ? (isLight ? '#F3E8FF' : 'rgba(124, 58, 237, 0.2)') : (isLight ? '#EFF6FF' : 'rgba(37, 99, 235, 0.2)'),
                border: `1px solid ${mode === 'PHONE_CALL' ? (isLight ? '#C084FC' : '#7C3AED') : (isLight ? '#93C5FD' : '#2563EB')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {mode === 'PHONE_CALL' ? (
                <PhoneCall size={20} color={isLight ? '#7C3AED' : '#A78BFA'} />
              ) : (
                <MessageSquare size={20} color={isLight ? '#2563EB' : '#60A5FA'} />
              )}
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary }}>
                {mode === 'PHONE_CALL' ? 'Direct Phone Call (Scan to Dial)' : 'Direct SMS (Scan to Text)'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: tokens.textSecondary }}>
                Send directly using your phone's cellular SIM card • Zero telephony fees
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: tokens.textMuted,
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Left Column: Phone QR Bridge */}
          <div
            style={{
              backgroundColor: isLight ? '#F8FAFC' : '#00253F',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#00A581',
                marginBottom: '12px',
              }}
            >
              <Smartphone size={15} />
              <span>Scan with Phone Camera</span>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                padding: '10px',
                borderRadius: '10px',
                boxShadow: isLight ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 8px 16px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${tokens.surfaceBorder}`,
                width: '180px',
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isGeneratingQr ? (
                <Loader2 size={32} className="animate-spin text-teal-500" />
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scan to Call or SMS"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              ) : (
                <span style={{ fontSize: '11px', color: '#EF4444' }}>No phone available</span>
              )}
            </div>

            <p style={{ fontSize: '11.5px', color: tokens.textSecondary, marginTop: '12px', lineHeight: '1.4' }}>
              {mode === 'PHONE_CALL'
                ? 'Point your smartphone camera at this code. Tap the prompt to dial instantly.'
                : 'Point your camera at this code. Tap to open your phone messages app pre-filled.'}
            </p>

            {/* 1-Click Copy Fallbacks */}
            <div style={{ width: '100%', borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '12px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyPhone}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textPrimary,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                {copiedPhone ? <Check size={13} color="#00A581" /> : <Copy size={13} />}
                <span>{copiedPhone ? 'Copied Number!' : 'Copy Phone Number'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textPrimary,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                {copiedText ? <Check size={13} color="#00A581" /> : <Copy size={13} />}
                <span>{copiedText ? 'Copied Message!' : 'Copy Message Text'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Debtor Details, Talking Points & Live Outcome Logger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Debtor Header Card */}
            <div
              style={{
                backgroundColor: isLight ? '#F8FAFC' : '#00253F',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary }}>
                  {customer.name}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#00A581', fontWeight: '600' }}>
                  {formatDisplayPhone(customer.phone)}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: tokens.textMuted, display: 'block' }}>Total Outstanding</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#EF4444' }}>
                  {formatCurrency(customer.totalOutstanding ?? 0)}
                </span>
                <span style={{ fontSize: '11px', color: '#F59E0B', display: 'block', marginTop: '2px' }}>
                  {customer.oldestOverdueDays ? `${customer.oldestOverdueDays} days overdue` : 'Current'}
                </span>
              </div>
            </div>

            {/* AI Talking Points Script */}
            <div
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#001625',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <HelpCircle size={14} color="#00A581" />
                <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase' }}>
                  {mode === 'PHONE_CALL' ? 'Live AI Call Talking Points' : 'SMS Message Draft'}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: tokens.textPrimary, lineHeight: '1.5', fontStyle: 'italic' }}>
                "{scriptText || `Good day ${customer.name}, following up on your invoice balance of ${formatCurrency(customer.totalOutstanding ?? 0)}.`}"
              </p>
            </div>

            {/* 1-Click Call Outcome Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>
                {mode === 'PHONE_CALL' ? 'Customer Response on Call:' : 'Customer Follow-up Status:'}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'PROMISED', label: '🤝 Promised Payment', color: '#00A581' },
                  { id: 'CALLBACK', label: '⏳ Callback / Extension', color: '#2563EB' },
                  { id: 'NO_ANSWER', label: '📞 No Answer / Busy', color: '#64748B' },
                  { id: 'DISPUTED', label: '⚠️ Disputed Balance', color: '#EF4444' },
                ].map((item) => {
                  const isSelected = selectedOutcome === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedOutcome(item.id as CallOutcomeType)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 'bold' : '500',
                        backgroundColor: isSelected ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.2)') : (isLight ? '#FFFFFF' : '#00253F'),
                        border: `1px solid ${isSelected ? item.color : tokens.surfaceBorder}`,
                        color: isSelected ? item.color : tokens.textPrimary,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: isLight && !isSelected ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                      }}
                    >
                      <span>{item.label}</span>
                      {isSelected && <CheckCircle2 size={14} color={item.color} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promise Amount & Date Inputs (If Promised selected) */}
            {selectedOutcome === 'PROMISED' && (
              <div
                style={{
                  backgroundColor: tokens.accentSoft,
                  border: `1px solid ${tokens.accentBorder}`,
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '11.5px', color: '#00A581', fontWeight: 'bold' }}>
                  Schedule Promise into Collections Queue:
                </span>

                <div className="responsive-split-2">
                  <div>
                    <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                      Agreed Amount (₦)
                    </label>
                    <input
                      type="number"
                      value={promisedAmount}
                      onChange={(e) => setPromisedAmount(e.target.value)}
                      placeholder="e.g. 200000"
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#FFFFFF' : '#001625',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                      Promised Date
                    </label>
                    <input
                      type="date"
                      value={promisedDate}
                      onChange={(e) => setPromisedDate(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#FFFFFF' : '#001625',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="e.g. Promised to transfer before noon..."
                    style={{
                      width: '100%',
                      backgroundColor: isLight ? '#FFFFFF' : '#001625',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      color: tokens.textPrimary,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: isLight ? '#F8FAFC' : '#00253F',
          }}
        >
          {errorMsg ? (
            <span style={{ fontSize: '12px', color: '#EF4444' }}>{errorMsg}</span>
          ) : successMsg ? (
            <span style={{ fontSize: '12px', color: '#00A581', fontWeight: 'bold' }}>✓ {successMsg}</span>
          ) : (
            <span style={{ fontSize: '12px', color: tokens.textMuted }}>
              Outcome updates debtor timeline and collections queue
            </span>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textSecondary,
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSaveOutcome}
              disabled={isSubmitting || !selectedOutcome}
              style={{
                backgroundColor: selectedOutcome ? '#00A581' : (isLight ? '#CBD5E1' : '#003E30'),
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: isSubmitting || !selectedOutcome ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: selectedOutcome ? '0 2px 8px rgba(0, 165, 129, 0.3)' : 'none',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Save Outcome to Books</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
