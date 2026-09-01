'use client';

import React, { useState } from 'react';
import { CustomerItem } from '@/lib/api/customers';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { formatDisplayPhone, getTelUrl } from '@/lib/deeplink';
import { commitmentsApi } from '@/lib/api/commitments';
import { collectionActivitiesApi, receivablesApi } from '@/lib/api';
import { 
  PhoneCall, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Loader2, 
  HelpCircle,
  FileText,
  MessageSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';
import { speakText, stopSpeech } from '@/lib/voice/voice-service';

interface CallAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerItem | null;
  scriptText?: string;
  onActionComplete?: (message: string) => void;
}

export default function CallAssistantModal({
  isOpen,
  onClose,
  customer,
  scriptText,
  onActionComplete,
}: CallAssistantModalProps) {
  const { tokens, isLight } = useTheme();
  const { t } = useLanguage();
  const [selectedOutcome, setSelectedOutcome] = useState<
    'PROMISED' | 'CALLBACK' | 'NO_ANSWER' | 'DISPUTED' | null
  >(null);
  const [promisedAmount, setPromisedAmount] = useState<string>(
    customer?.totalOutstanding ? String(customer.totalOutstanding) : ''
  );
  const [promisedDate, setPromisedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // Default 3 days ahead
    return d.toISOString().split('T')[0];
  });
  const [callNotes, setCallNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeakingScript, setIsSpeakingScript] = useState(false);

  React.useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleToggleSpeakScript = () => {
    if (isSpeakingScript) {
      stopSpeech();
      setIsSpeakingScript(false);
    } else {
      const textToRead =
        scriptText ||
        `Good day Alhaji or Mr. ${customer?.name || ''}. This is a courtesy follow-up regarding invoice reconciliation on your account. The outstanding balance is ${formatCurrency(
          customer?.totalOutstanding ?? 0
        )}. We wanted to confirm if we can record your transfer confirmation today or arrange a convenient settlement schedule.`;

      setIsSpeakingScript(true);
      speakText(textToRead, 'en', {
        onEnd: () => setIsSpeakingScript(false),
        onError: () => setIsSpeakingScript(false),
      });
    }
  };

  if (!isOpen || !customer) return null;

  const phoneUrl = getTelUrl(customer.phone);

  const handleRedial = () => {
    if (phoneUrl) {
      window.location.href = phoneUrl;
    }
  };

  const handleSaveOutcome = async () => {
    if (!selectedOutcome) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Log the call activity
      let outcomeLabel = 'CONTACTED';
      let outcomeText = '';

      if (selectedOutcome === 'PROMISED') {
        outcomeLabel = 'PROMISED_PAYMENT';
        outcomeText = `Customer verbally promised payment of ₦${Number(promisedAmount || 0).toLocaleString()} for ${promisedDate}. Notes: ${callNotes || 'None'}`;
      } else if (selectedOutcome === 'CALLBACK') {
        outcomeLabel = 'REQUESTED_EXTENSION';
        outcomeText = `Customer requested callback / extension. Notes: ${callNotes || 'Customer was busy'}`;
      } else if (selectedOutcome === 'NO_ANSWER') {
        outcomeLabel = 'NO_RESPONSE';
        outcomeText = `Called customer phone (${customer.phone || 'N/A'}), line rang with no answer / busy.`;
      } else if (selectedOutcome === 'DISPUTED') {
        outcomeLabel = 'DISPUTE';
        outcomeText = `Customer disputed invoice balance during phone call. Notes: ${callNotes || 'Dispute raised'}`;
      }

      // 1. Resolve target receivable
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
            description: 'Direct call follow-up ledger',
            reference: `INV-${Date.now().toString().slice(-4)}`,
          });
          targetRecId = newRec.id;
        } catch (e) {
          console.warn('Could not auto-create fallback receivable:', e);
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

      // 2. If promise was made, record active PaymentCommitment
      if (selectedOutcome === 'PROMISED' && Number(promisedAmount) > 0 && targetRecId) {
        try {
          await commitmentsApi.createCommitment({
            receivableId: targetRecId,
            customerId: customer.id,
            amount: Number(promisedAmount),
            currency: customer.currency || 'NGN',
            promisedFor: promisedDate,
            notes: `Recorded via Call Assistant phone follow-up: ${callNotes || 'Verbal promise on call'}`,
          });
        } catch (commitErr) {
          console.warn('Could not auto-bind commitment to specific receivable:', commitErr);
        }
      }

      setSuccessMsg('Call outcome and debtor ledger updated successfully!');
      if (onActionComplete) {
        onActionComplete(outcomeText);
      }
      setTimeout(() => {
        onClose();
        setSelectedOutcome(null);
        setSuccessMsg(null);
      }, 1400);
    } catch (err: any) {
      console.error('Failed to log call outcome:', err);
      setErrorMsg(err?.message || 'Failed to save call outcome.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 15, 26, 0.7)',
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
          maxWidth: 'min(680px, calc(100vw - 24px))',
          width: '100%',
          maxHeight: '92svh',
          overflowY: 'auto',
          boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.15)' : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: isLight ? '#F8FAFC' : '#001A2C',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: tokens.accentSoft,
                border: `1px solid ${tokens.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00A581',
              }}
            >
              <PhoneCall size={22} className="animate-pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
                  {t('common.call')} Assistant
                </h3>
                <span
                  style={{
                    backgroundColor: tokens.accentSoft,
                    color: '#00A581',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: `1px solid ${tokens.accentBorder}`,
                  }}
                >
                  Dialed from your device
                </span>
              </div>
              <p style={{ color: tokens.textSecondary, fontSize: '13px', margin: '4px 0 0' }}>
                Calling {customer.name} ({formatDisplayPhone(customer.phone)})
              </p>
            </div>
          </div>

          <button
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

        {/* Financial & Ledger Cheat Sheet */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px',
              backgroundColor: isLight ? '#F8FAFC' : '#001D31',
              padding: '14px',
              borderRadius: '10px',
              border: `1px solid ${tokens.surfaceBorder}`,
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Outstanding
              </span>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: '2px 0 0' }}>
                {formatCurrency(customer.totalOutstanding ?? 0)}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overdue Days
              </span>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: (customer.oldestOverdueDays ?? 0) > 30 ? '#EF4444' : '#F59E0B', margin: '2px 0 0' }}>
                {customer.oldestOverdueDays ? `${customer.oldestOverdueDays} days` : 'Current'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Risk Status
              </span>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#00A581', margin: '2px 0 0' }}>
                {customer.riskLevel || 'LOW'} ({customer.riskScore ?? 15}/100)
              </p>
            </div>
          </div>

          {/* AI Talking Points & Script */}
          <div
            style={{
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="#00A581" />
                <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#00A581' }}>
                  AI Suggested Call Talking Points (Cultural Etiquette)
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSpeakScript}
                title={isSpeakingScript ? 'Stop reading script' : 'Listen to AI voice read this script'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: isSpeakingScript
                    ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)')
                    : (isLight ? '#FFFFFF' : '#001D31'),
                  border: `1px solid ${isSpeakingScript ? '#EF4444' : tokens.accentBorder}`,
                  color: isSpeakingScript ? '#EF4444' : '#00A581',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {isSpeakingScript ? <VolumeX size={12} /> : <Volume2 size={12} />}
                <span>{isSpeakingScript ? 'Stop' : 'Listen'}</span>
              </button>
            </div>
            <div
              style={{
                fontSize: '13px',
                color: tokens.textPrimary,
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                maxHeight: '130px',
                overflowY: 'auto',
                paddingRight: '6px',
              }}
            >
              {scriptText || `Good day Alhaji/Mr. ${customer.name}. This is a courtesy follow-up regarding invoice reconciliation on your account. The outstanding balance is ${formatCurrency(customer.totalOutstanding ?? 0)}. We wanted to confirm if we can record your transfer confirmation today or arrange a convenient settlement schedule.`}
            </div>
          </div>

          {/* Redial button if call dropped */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRedial}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#00A581',
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.accentBorder}`,
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              <PhoneCall size={12} />
              <span>Redial Number (+{customer.phone})</span>
            </button>
          </div>

          {/* Outcome Section */}
          <div style={{ borderTop: `1px solid ${tokens.surfaceBorder}`, paddingTop: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary, display: 'block', marginBottom: '10px' }}>
              Record Call Outcome (1-Click Ledger Update):
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedOutcome('PROMISED')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: selectedOutcome === 'PROMISED' ? '2px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: selectedOutcome === 'PROMISED' ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#001D31'),
                  color: selectedOutcome === 'PROMISED' ? '#00A581' : tokens.textPrimary,
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isLight && selectedOutcome !== 'PROMISED' ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                <CheckCircle2 size={16} color="#00A581" />
                <span>🤝 Customer Promised Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOutcome('CALLBACK')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: selectedOutcome === 'CALLBACK' ? '2px solid #2563EB' : `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: selectedOutcome === 'CALLBACK' ? (isLight ? '#EFF6FF' : 'rgba(96, 165, 250, 0.15)') : (isLight ? '#FFFFFF' : '#001D31'),
                  color: selectedOutcome === 'CALLBACK' ? '#2563EB' : tokens.textPrimary,
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isLight && selectedOutcome !== 'CALLBACK' ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                <Clock size={16} color="#2563EB" />
                <span>⏳ Request Callback / Busy</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOutcome('NO_ANSWER')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: selectedOutcome === 'NO_ANSWER' ? '2px solid #D97706' : `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: selectedOutcome === 'NO_ANSWER' ? (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)') : (isLight ? '#FFFFFF' : '#001D31'),
                  color: selectedOutcome === 'NO_ANSWER' ? (isLight ? '#B45309' : '#FBBF24') : tokens.textPrimary,
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isLight && selectedOutcome !== 'NO_ANSWER' ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                <AlertTriangle size={16} color="#D97706" />
                <span>📞 No Answer / Switched Off</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOutcome('DISPUTED')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: selectedOutcome === 'DISPUTED' ? '2px solid #DC2626' : `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: selectedOutcome === 'DISPUTED' ? (isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#FFFFFF' : '#001D31'),
                  color: selectedOutcome === 'DISPUTED' ? '#DC2626' : tokens.textPrimary,
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isLight && selectedOutcome !== 'DISPUTED' ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                <HelpCircle size={16} color="#DC2626" />
                <span>⚠️ Disputed Invoice / Quality</span>
              </button>
            </div>

            {/* Promise Details Form if PROMISED */}
            {selectedOutcome === 'PROMISED' && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '14px',
                  backgroundColor: tokens.accentSoft,
                  border: `1px solid ${tokens.accentBorder}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#00A581' }}>
                  Log Payment Commitment (Auto-Monitored by Netify):
                </span>
                <div className="responsive-split-2">
                  <div>
                    <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                      Promised Amount (₦)
                    </label>
                    <input
                      type="number"
                      value={promisedAmount}
                      onChange={(e) => setPromisedAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#FFFFFF' : '#001625',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        borderRadius: '6px',
                        padding: '8px 10px',
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
                        padding: '8px 10px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* General Notes Field */}
            {selectedOutcome && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Call Notes / Customer Comments (Optional)
                </label>
                <input
                  type="text"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. Said director is traveling, will transfer Friday morning..."
                  style={{
                    width: '100%',
                    backgroundColor: isLight ? '#FFFFFF' : '#001625',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    color: tokens.textPrimary,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Error or Success feedback */}
            {errorMsg && (
              <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '8px' }}>{errorMsg}</p>
            )}
            {successMsg && (
              <p style={{ color: '#00A581', fontSize: '12px', marginTop: '8px', fontWeight: 'bold' }}>
                ✓ {successMsg}
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: isLight ? '#F8FAFC' : '#001A2C',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textSecondary,
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedOutcome || isSubmitting}
            onClick={handleSaveOutcome}
            style={{
              padding: '8px 20px',
              backgroundColor: selectedOutcome ? '#00A581' : (isLight ? '#CBD5E1' : '#003051'),
              color: selectedOutcome ? '#FFFFFF' : (isLight ? '#64748B' : '#8FB7C7'),
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: selectedOutcome && !isSubmitting ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: selectedOutcome ? '0 2px 8px rgba(0, 165, 129, 0.3)' : 'none',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving to Ledger...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save Outcome to Timeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
