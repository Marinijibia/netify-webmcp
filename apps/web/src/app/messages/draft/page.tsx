'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  customersApi, 
  aiApi, 
  collectionActivitiesApi, 
  receivablesApi,
  ReceivableItem,
  CustomerItem,
  CollectionMessageDraftData,
  CollectionChannel
} from '@/lib/api';
import { commitmentsApi } from '@/lib/api/commitments';
import { formatCurrency } from '@/lib/formatters';
import { 
  getWhatsAppUrl, 
  getWhatsAppWebUrl,
  getSmsUrl, 
  getTelUrl, 
  getMailtoUrl, 
  getGmailWebUrl,
  getOutlookWebUrl,
  formatDisplayPhone,
  isMobileDevice
} from '@/lib/deeplink';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage, LANGUAGE_REGISTRY } from '@/lib/i18n';
import CallAssistantModal from '@/components/CallAssistantModal';
import PhoneQrBridgeModal from '@/components/PhoneQrBridgeModal';
import { useTheme } from '@/lib/theme/theme-context';
import { speakText, stopSpeech } from '@/lib/voice/voice-service';
import { 
  MessageSquareQuote, 
  CheckCircle2, 
  Send, 
  Edit3, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  Copy, 
  Loader2, 
  Check, 
  Building, 
  PhoneCall, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  Calendar, 
  DollarSign, 
  ThumbsUp, 
  X, 
  QrCode, 
  Smartphone,
  Volume2,
  VolumeX
} from 'lucide-react';

function DraftContent() {
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams?.get('customerId');
  const { organization } = useAuth();
  const { tokens, isLight } = useTheme();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'EMAIL'>('WHATSAPP');
  const [tone, setTone] = useState<'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' | 'PARTIAL_PAYMENT_PROPOSAL'>('DIRECT_FOLLOWUP');
  const [customNote, setCustomNote] = useState('');
  const [draft, setDraft] = useState<CollectionMessageDraftData | null>(null);
  const [editableBody, setEditableBody] = useState('');
  
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [lastDispatchedChannel, setLastDispatchedChannel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEmailOnly, setCopiedEmailOnly] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleToggleVoicePreview = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      if (!editableBody) return;
      setIsPlayingAudio(true);
      speakText(editableBody, (draftLanguage || 'en') as any, {
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  // Desktop vs Mobile Detection & QR Phone Bridge State
  const [isMobileClient, setIsMobileClient] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalMode, setQrModalMode] = useState<'PHONE_CALL' | 'SMS'>('PHONE_CALL');

  // Multi-lingual message drafting
  const { currentLanguage, t } = useLanguage();
  const [draftLanguage, setDraftLanguage] = useState<SupportedLanguage>(currentLanguage);

  useEffect(() => {
    setDraftLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    setIsMobileClient(isMobileDevice());
  }, []);

  // Call Assistant Modal State
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Quick Promise Logger State
  const [quickPromiseOpen, setQuickPromiseOpen] = useState(false);
  const [promisedAmount, setPromisedAmount] = useState('');
  const [promisedDate, setPromisedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [promiseNotes, setPromiseNotes] = useState('');
  const [isSavingPromise, setIsSavingPromise] = useState(false);
  const [promiseSuccessMsg, setPromiseSuccessMsg] = useState<string | null>(null);

  // Active Customer Receivables
  const [customerReceivables, setCustomerReceivables] = useState<ReceivableItem[]>([]);
  const [selectedReceivableId, setSelectedReceivableId] = useState<string>('');

  // Load customer list for selector
  useEffect(() => {
    async function fetchCustomers() {
      setIsLoadingCustomers(true);
      try {
        const list = await customersApi.list();
        setCustomers(list);
        if (!selectedCustomerId && list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      } catch (err: any) {
        console.warn('Failed to load customers for draft screen:', err);
      } finally {
        setIsLoadingCustomers(false);
      }
    }
    fetchCustomers();
  }, [selectedCustomerId]);

  // Sync customer receivables & default promised amount when customer changes
  useEffect(() => {
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (cust?.totalOutstanding) {
      setPromisedAmount(String(cust.totalOutstanding));
    }

    if (!selectedCustomerId) {
      setCustomerReceivables([]);
      setSelectedReceivableId('');
      return;
    }

    async function loadCustomerReceivables() {
      try {
        const recs = await receivablesApi.list({ customerId: selectedCustomerId });
        const openRecs = recs.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE');
        const activeList = openRecs.length > 0 ? openRecs : recs;
        setCustomerReceivables(activeList);
        if (activeList.length > 0) {
          setSelectedReceivableId(activeList[0].id);
          if (activeList[0].balance) {
            setPromisedAmount(String(activeList[0].balance));
          }
        } else {
          setSelectedReceivableId('');
        }
      } catch (err) {
        console.warn('Failed to fetch receivables for customer:', err);
      }
    }

    loadCustomerReceivables();
  }, [selectedCustomerId, customers]);

  // Generate live AI draft
  const generateDraft = useCallback(async () => {
    if (!selectedCustomerId) return;
    setIsDrafting(true);
    setError(null);
    setApprovedSuccess(false);

    try {
      const languageInstruction = draftLanguage !== 'en' 
        ? `[Draft this collection message in ${LANGUAGE_REGISTRY[draftLanguage].name} (${LANGUAGE_REGISTRY[draftLanguage].nativeName}) language]: ` 
        : '';

      const fullCustomNote = languageInstruction + (customNote.trim() ? customNote.trim() : '');

      const data = await aiApi.draftMessage(selectedCustomerId, {
        channel,
        tone,
        customNote: fullCustomNote.trim() || undefined,
      });

      const bodyText = data?.messageBody || (data as any)?.messageText || (data as any)?.body || '';
      setDraft(data);
      setEditableBody(bodyText);
    } catch (err: any) {
      console.warn('Failed to generate draft message:', err);
      setError(err?.message || 'Failed to generate draft from live AI service.');
    } finally {
      setIsDrafting(false);
    }
  }, [selectedCustomerId, channel, tone, customNote, draftLanguage]);

  useEffect(() => {
    if (selectedCustomerId) {
      generateDraft();
    }
  }, [selectedCustomerId, channel, tone, draftLanguage, generateDraft]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Native deep-link dispatch handler with Desktop QR Bridge and Webmail support
  const handleNativeDispatch = async (
    targetChannel?: 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'EMAIL',
    emailProvider?: 'GMAIL' | 'OUTLOOK' | 'DEFAULT'
  ) => {
    const ch = targetChannel || channel;
    if (!selectedCustomerId || !(editableBody || '').trim()) return;

    // Direct Phone Call
    if (ch === 'PHONE_CALL') {
      if (isMobileClient) {
        setIsCallModalOpen(true);
        const telUrl = getTelUrl(selectedCustomer?.phone);
        if (telUrl) {
          window.location.href = telUrl;
        }
      } else {
        // Desktop PC: Launch "Option A" QR Phone Bridge
        setQrModalMode('PHONE_CALL');
        setIsQrModalOpen(true);
      }
      return;
    }

    // Direct SMS on Desktop
    if (ch === 'SMS' && !isMobileClient) {
      // Desktop PC: Launch "Option A" QR Phone Bridge with pre-filled SMS payload
      setQrModalMode('SMS');
      setIsQrModalOpen(true);
      return;
    }

    setIsApproving(true);
    setError(null);

    const channelMapping: Record<string, CollectionChannel> = {
      WHATSAPP: 'WHATSAPP',
      SMS: 'SMS',
      PHONE_CALL: 'PHONE',
      EMAIL: 'EMAIL',
    };

    try {
      // 1. Resolve target receivableId
      let targetRecId = selectedReceivableId;
      if (!targetRecId) {
        const recs = await receivablesApi.list({ customerId: selectedCustomerId });
        const openRecs = recs.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE');
        targetRecId = openRecs[0]?.id || recs[0]?.id;
      }

      // Auto-create initial ledger invoice if customer has no invoice yet
      if (!targetRecId) {
        try {
          const newRec = await receivablesApi.create({
            customerId: selectedCustomerId,
            amount: Number(selectedCustomer?.totalOutstanding || 100000),
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
            currency: selectedCustomer?.currency || 'NGN',
            description: 'Account balance follow-up ledger',
            reference: `INV-${Date.now().toString().slice(-4)}`,
          });
          targetRecId = newRec.id;
          setSelectedReceivableId(newRec.id);
        } catch (e) {
          console.warn('Could not auto-create fallback receivable:', e);
        }
      }

      // 2. Auto-record to customer timeline in background
      if (targetRecId) {
        await collectionActivitiesApi.createActivity({
          receivableId: targetRecId,
          customerId: selectedCustomerId,
          type: 'PAYMENT_REMINDER',
          channel: channelMapping[ch] || 'WHATSAPP',
          outcome: 'CONTACTED',
          notes: `AI Follow-up approved & opened on merchant device via ${ch} (Tone: ${tone}):\n"${editableBody}"`,
        });
      }

      setApprovedSuccess(true);
      setLastDispatchedChannel(ch);

      // 3. Open appropriate desktop or mobile application
      if (ch === 'WHATSAPP') {
        if (!isMobileClient) {
          // Open WhatsApp Web in new browser tab for desktop users
          const webUrl = getWhatsAppWebUrl(selectedCustomer?.phone, editableBody);
          if (webUrl) {
            window.open(webUrl, '_blank');
          }
        } else {
          // Open mobile WhatsApp
          const waUrl = getWhatsAppUrl(selectedCustomer?.phone, editableBody);
          if (waUrl) {
            window.open(waUrl, '_blank');
          }
        }
      } else if (ch === 'SMS') {
        // Mobile device SMS
        const smsUrl = getSmsUrl(selectedCustomer?.phone, editableBody);
        if (smsUrl) {
          window.location.href = smsUrl;
        }
      } else if (ch === 'EMAIL') {
        if (emailProvider === 'GMAIL') {
          const gmailUrl = getGmailWebUrl(selectedCustomer?.email, 'Payment Follow-Up & Account Statement', editableBody);
          if (gmailUrl) {
            window.open(gmailUrl, '_blank');
          }
        } else if (emailProvider === 'OUTLOOK') {
          const outlookUrl = getOutlookWebUrl(selectedCustomer?.email, 'Payment Follow-Up & Account Statement', editableBody);
          if (outlookUrl) {
            window.open(outlookUrl, '_blank');
          }
        } else {
          const mailUrl = getMailtoUrl(selectedCustomer?.email, 'Payment Follow-Up & Account Statement', editableBody);
          if (mailUrl) {
            window.location.href = mailUrl;
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to record approved collection activity:', err);
      setError(err?.message || 'Failed to persist collection activity to live API.');
    } finally {
      setIsApproving(false);
    }
  };

  // Quick Promise Saver
  const handleQuickSavePromise = async () => {
    if (!selectedCustomerId || !promisedAmount || !promisedDate) return;
    setIsSavingPromise(true);
    setPromiseSuccessMsg(null);
    setError(null);

    try {
      // 1. Resolve target receivable
      let targetRecId = selectedReceivableId;
      let targetRec = customerReceivables.find((r) => r.id === targetRecId);

      if (!targetRecId) {
        const recs = await receivablesApi.list({ customerId: selectedCustomerId });
        const openRecs = recs.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE');
        const candidate = openRecs.length > 0 ? openRecs[0] : recs[0];
        if (candidate) {
          targetRecId = candidate.id;
          targetRec = candidate;
        }
      }

      if (!targetRecId) {
        const newRec = await receivablesApi.create({
          customerId: selectedCustomerId,
          amount: Number(promisedAmount || 100000),
          dueDate: promisedDate,
          currency: selectedCustomer?.currency || 'NGN',
          description: 'Payment arrangement account',
          reference: `INV-${Date.now().toString().slice(-4)}`,
        });
        targetRecId = newRec.id;
        targetRec = newRec;
      }

      if (targetRecId) {
        // Create formal commitment bound to the invoice
        await commitmentsApi.createCommitment({
          receivableId: targetRecId,
          customerId: selectedCustomerId,
          amount: Number(promisedAmount),
          currency: targetRec?.currency || 'NGN',
          promisedFor: promisedDate,
          notes: promiseNotes.trim() ? `Promise from follow-up: ${promiseNotes}` : `Recorded via follow-up draft screen (${channel})`,
        });

        // Also log activity to customer timeline
        await collectionActivitiesApi.createActivity({
          customerId: selectedCustomerId,
          receivableId: targetRecId,
          type: 'PAYMENT_REMINDER',
          channel: (channel === 'PHONE_CALL' ? 'PHONE' : channel) as any,
          outcome: 'PROMISED_PAYMENT',
          notes: `Customer promised payment of ₦${Number(promisedAmount).toLocaleString()} by ${promisedDate}.${targetRec?.reference ? ` Bound to invoice ${targetRec.reference}.` : ''} Notes: ${promiseNotes || 'None'}`,
        });
      }

      setPromiseSuccessMsg(`Payment commitment of ₦${Number(promisedAmount).toLocaleString()} scheduled for ${promisedDate}!`);
      setTimeout(() => {
        setQuickPromiseOpen(false);
        setPromiseSuccessMsg(null);
      }, 2200);
    } catch (err: any) {
      console.error('Failed to create quick commitment:', err);
      setError(err?.message || 'Failed to save commitment to database.');
    } finally {
      setIsSavingPromise(false);
    }
  };

  const handleCopy = () => {
    if (!editableBody) return;
    navigator.clipboard.writeText(editableBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquareQuote size={24} color="#00A581" />
            <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>AI Follow-up Draft & Action Review</h2>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13px', marginTop: '4px' }}>
            Grounded in actual overdue balances and past WhatsApp commitments. Requires explicit human confirmation.
          </p>
        </div>

        <Link
          href="/collections"
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
          <span>Back to Queue</span>
        </Link>
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

      {/* Success Alert */}
      {approvedSuccess && (
        <div style={{
          backgroundColor: tokens.accentSoft,
          border: `1px solid ${tokens.accentBorder}`,
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#00A581',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#00A581" />
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Collection Action Successfully Approved & Logged</p>
              <p style={{ fontSize: '12px', color: tokens.textSecondary, margin: '2px 0 0' }}>
                Activity recorded to customer's live timeline in the database.
              </p>
            </div>
          </div>
          {selectedCustomerId && (
            <Link
              href={`/customers/${selectedCustomerId}`}
              style={{
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              View Timeline
            </Link>
          )}
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="responsive-webmcp-layout">
        {/* Left Column: Customer & Tone Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* Target Customer Card */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '20px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '8px', textTransform: 'uppercase' }}>
              Target Customer Account
            </label>
            {isLoadingCustomers ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.textMuted, fontSize: '13px' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading customers...</span>
              </div>
            ) : customers.length === 0 ? (
              <p style={{ color: tokens.textMuted, fontSize: '13px' }}>No customers available.</p>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '8px',
                  color: tokens.textPrimary,
                  fontSize: '13.5px',
                  outline: 'none',
                  boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.totalOutstanding ? `(${formatCurrency(c.totalOutstanding, c.currency || 'NGN')})` : ''}
                  </option>
                ))}
              </select>
            )}

            {selectedCustomer && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${tokens.surfaceBorder}`, fontSize: '12px', color: tokens.textSecondary }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><strong>Phone:</strong> {formatDisplayPhone(selectedCustomer.phone)}</span>
                  <span style={{ fontSize: '10px', backgroundColor: tokens.accentSoft, color: '#00A581', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${tokens.accentBorder}` }}>
                    Verified Mobile
                  </span>
                </div>
                <p style={{ marginTop: '6px' }}><strong>Status:</strong> {selectedCustomer.status} • Risk: {selectedCustomer.riskLevel || 'NORMAL'}</p>
                <p style={{ marginTop: '4px', color: tokens.textMuted }}>
                  <strong>Exposure:</strong> {formatCurrency(selectedCustomer.totalOutstanding ?? 0)} ({selectedCustomer.oldestOverdueDays ? `${selectedCustomer.oldestOverdueDays}d overdue` : 'Current'})
                </p>
              </div>
            )}
          </div>

          {/* Delivery Channel Selector */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '20px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, textTransform: 'uppercase', margin: 0 }}>
                Outreach Channel
              </label>
              <span style={{ fontSize: '10px', color: '#00A581', fontWeight: 'bold' }}>
                ₦0.00 Carrier Direct
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
              {[
                { id: 'WHATSAPP', name: 'WhatsApp', icon: MessageSquare, activeBg: '#25D366', activeColor: '#FFFFFF' },
                { id: 'SMS', name: 'Direct SMS', icon: Send, activeBg: '#2563EB', activeColor: '#FFFFFF' },
                { id: 'PHONE_CALL', name: 'Direct Call', icon: PhoneCall, activeBg: '#7C3AED', activeColor: '#FFFFFF' },
                { id: 'EMAIL', name: 'Email', icon: Mail, activeBg: '#0284C7', activeColor: '#FFFFFF' },
              ].map((ch) => {
                const IconComponent = ch.icon;
                const isActive = channel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannel(ch.id as any)}
                    className="tap-press hover-lift"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: isActive ? ch.activeBg : (isLight ? '#F8FAFC' : '#001D31'),
                      color: isActive ? ch.activeColor : tokens.textSecondary,
                      border: `1px solid ${isActive ? ch.activeBg : tokens.surfaceBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: isLight && !isActive ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IconComponent size={14} />
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone Strategy Selector */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '20px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, marginBottom: '10px', textTransform: 'uppercase' }}>
              Follow-Up Tone & Strategy
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'RESPECTFUL_REMINDER', name: 'Respectful Courtesy Reminder' },
                { id: 'DIRECT_FOLLOWUP', name: 'Direct Business Follow-up' },
                { id: 'URGENT_ESCALATION', name: 'Urgent Payment Escalation' },
                { id: 'PARTIAL_PAYMENT_PROPOSAL', name: 'Partial Payment Plan Proposal' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as any)}
                  className="tap-press hover-lift"
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: tone === t.id ? '700' : 'normal',
                    backgroundColor: tone === t.id ? (isLight ? '#ECFDF8' : '#001D31') : (isLight ? '#FFFFFF' : 'transparent'),
                    color: tone === t.id ? '#00A581' : tokens.textSecondary,
                    border: `1px solid ${tone === t.id ? '#00A581' : tokens.surfaceBorder}`,
                    cursor: 'pointer',
                    boxShadow: isLight && tone !== t.id ? '0 1px 2px rgba(0,0,0,0.02)' : 'none',
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Message Language Card */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '20px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textSecondary, textTransform: 'uppercase', margin: 0 }}>
                Message Language
              </label>
              <span style={{ fontSize: '11px', color: '#00A581', fontWeight: '700' }}>
                {LANGUAGE_REGISTRY[draftLanguage]?.name}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
              {SUPPORTED_LANGUAGES.map((l) => {
                const isSelected = draftLanguage === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setDraftLanguage(l.code)}
                    className="tap-press hover-lift"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? '700' : 'normal',
                      backgroundColor: isSelected ? (isLight ? '#ECFDF8' : '#001D31') : (isLight ? '#FFFFFF' : 'transparent'),
                      color: isSelected ? '#00A581' : tokens.textSecondary,
                      border: `1px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isLight && !isSelected ? '0 1px 2px rgba(0,0,0,0.02)' : 'none',
                    }}
                  >
                    <span>{l.flag}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.nativeName.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Draft Editor & Actions */}
        <div style={{
          backgroundColor: tokens.surface,
          borderRadius: '12px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#00A581" />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
                  AI Generated Message Content
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    color: tokens.textSecondary,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                  }}
                >
                  {copied ? <Check size={14} color="#00A581" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleVoicePreview}
                  disabled={!editableBody || isDrafting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: isPlayingAudio ? '#EF4444' : tokens.accentSoft,
                    border: `1px solid ${isPlayingAudio ? '#DC2626' : tokens.accentBorder}`,
                    color: isPlayingAudio ? '#FFFFFF' : '#00A581',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: !editableBody || isDrafting ? 'not-allowed' : 'pointer',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Listen to browser voice preview of this collection reminder"
                >
                  {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isPlayingAudio ? 'Stop Audio' : 'Voice Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={isDrafting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    color: '#00A581',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                  }}
                >
                  {isDrafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Editor Area */}
            {isDrafting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px', color: tokens.textMuted }}>
                <Loader2 size={32} className="animate-spin text-teal-500" />
                <p style={{ fontSize: '13px' }}>Generating tailored follow-up based on live customer evidence...</p>
              </div>
            ) : (
              <textarea
                rows={10}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                placeholder="Draft message will appear here..."
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '8px',
                  color: tokens.textPrimary,
                  fontSize: '14px',
                  lineHeight: '1.6',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxShadow: isLight ? 'inset 0 1px 2px rgba(0,0,0,0.02)' : 'none',
                }}
              />
            )}

            {draft?.culturalNotes && (
              <p style={{ fontSize: '12px', color: tokens.textSecondary, marginTop: '8px' }}>
                <strong style={{ color: '#00A581' }}>AI Strategy Note:</strong> {draft.culturalNotes}
              </p>
            )}
          </div>

          {/* Action Confirmation Footer */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ fontSize: '12px', color: tokens.textSecondary, maxWidth: '340px' }}>
              <span style={{ display: 'block', color: '#00A581', fontWeight: 'bold', marginBottom: '2px' }}>
                ✓ Strict Human-in-the-Loop Guarantee
              </span>
              <span>
                Netify opens your device's native app pre-populated with this message. Nothing is dispatched without your confirmation.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/collections"
                style={{
                  padding: '10px 16px',
                  backgroundColor: isLight ? '#F1F5F9' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textPrimary,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                Cancel
              </Link>

              {/* Dynamic 1-Click Native Dispatch Button */}
              {channel === 'WHATSAPP' && (
                <button
                  type="button"
                  onClick={() => handleNativeDispatch('WHATSAPP')}
                  disabled={isApproving || !(editableBody || '').trim() || isDrafting}
                  className="hover-lift tap-press"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: isApproving || !(editableBody || '').trim() || isDrafting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  {isApproving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Opening WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} />
                      <span>{isMobileClient ? 'Open in WhatsApp (₦0)' : 'Open in WhatsApp Web (₦0)'}</span>
                      <ExternalLink size={13} style={{ opacity: 0.8 }} />
                    </>
                  )}
                </button>
              )}

              {channel === 'SMS' && (
                <button
                  type="button"
                  onClick={() => handleNativeDispatch('SMS')}
                  disabled={isApproving || !(editableBody || '').trim() || isDrafting}
                  className="hover-lift tap-press"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: isApproving || !(editableBody || '').trim() || isDrafting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {isMobileClient ? (
                    <>
                      <Send size={16} />
                      <span>Open in Phone Messages (SMS)</span>
                      <ExternalLink size={13} style={{ opacity: 0.8 }} />
                    </>
                  ) : (
                    <>
                      <QrCode size={16} />
                      <span>📱 Scan QR to Text on Phone (₦0)</span>
                    </>
                  )}
                </button>
              )}

              {channel === 'PHONE_CALL' && (
                <button
                  type="button"
                  onClick={() => handleNativeDispatch('PHONE_CALL')}
                  disabled={isDrafting}
                  className="hover-lift tap-press"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#7C3AED',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: isDrafting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  }}
                >
                  {isMobileClient ? (
                    <>
                      <PhoneCall size={16} />
                      <span>Start Direct Call (+ AI Assistant)</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={16} />
                      <span>📱 Scan QR to Call on Phone (+ AI Script)</span>
                    </>
                  )}
                </button>
              )}

              {channel === 'EMAIL' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Gmail Web */}
                  <button
                    type="button"
                    onClick={() => handleNativeDispatch('EMAIL', 'GMAIL')}
                    disabled={isApproving || !(editableBody || '').trim() || isDrafting}
                    className="hover-lift tap-press"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#EA4335',
                      color: '#FFFFFF',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: isApproving || !(editableBody || '').trim() || isDrafting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 3px 10px rgba(234, 67, 53, 0.3)',
                    }}
                  >
                    <Mail size={14} />
                    <span>Open in Gmail (Web)</span>
                    <ExternalLink size={12} style={{ opacity: 0.8 }} />
                  </button>

                  {/* Outlook Web */}
                  <button
                    type="button"
                    onClick={() => handleNativeDispatch('EMAIL', 'OUTLOOK')}
                    disabled={isApproving || !(editableBody || '').trim() || isDrafting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: isApproving || !(editableBody || '').trim() || isDrafting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    <Mail size={14} />
                    <span>Open in Outlook (Web)</span>
                    <ExternalLink size={12} style={{ opacity: 0.8 }} />
                  </button>

                  {/* Default App */}
                  <button
                    type="button"
                    onClick={() => handleNativeDispatch('EMAIL', 'DEFAULT')}
                    disabled={isApproving || !(editableBody || '').trim() || isDrafting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: isLight ? '#FFFFFF' : '#00253F',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      color: tokens.textPrimary,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: isApproving || !(editableBody || '').trim() || isDrafting ? 'not-allowed' : 'pointer',
                      boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                    }}
                  >
                    <Mail size={13} />
                    <span>Default App</span>
                  </button>

                  {/* Copy Email & Text Fallback */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCustomer?.email && editableBody) {
                        navigator.clipboard.writeText(`To: ${selectedCustomer.email}\nSubject: Payment Follow-Up\n\n${editableBody}`);
                        setCopiedEmailOnly(true);
                        setTimeout(() => setCopiedEmailOnly(false), 2000);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      color: tokens.textSecondary,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                    }}
                  >
                    {copiedEmailOnly ? <Check size={13} color="#00A581" /> : <Copy size={13} />}
                    <span>{copiedEmailOnly ? 'Copied Full Email!' : 'Copy Email & Text'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Post-Dispatch Outcome & Promise Logger */}
          {approvedSuccess && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px 20px',
                backgroundColor: isLight ? '#ECFDF8' : 'rgba(0, 34, 56, 0.9)',
                border: `1px solid ${tokens.accentBorder}`,
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: isLight ? tokens.shadowCard : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#00A581" />
                  <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: isLight ? '#065F46' : '#FFFFFF' }}>
                    Follow-up Dispatched via {lastDispatchedChannel || channel}! Did customer make a promise?
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setQuickPromiseOpen(!quickPromiseOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: quickPromiseOpen ? (isLight ? '#FFFFFF' : '#001D31') : tokens.accentSoft,
                    border: `1px solid ${tokens.accentBorder}`,
                    color: '#00A581',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  <DollarSign size={14} />
                  <span>{quickPromiseOpen ? 'Hide Promise Form' : '🤝 Log Customer Promise to Pay'}</span>
                </button>
              </div>

              {/* Collapsible Promise Input Form */}
              {quickPromiseOpen && (
                <div
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '12px', color: tokens.textSecondary }}>
                    Log the agreed commitment to automatically track in Collections queue and alert you on due date:
                  </span>

                  {customerReceivables.length > 0 && (
                    <div>
                      <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                        Bound Invoice / Receivable
                      </label>
                      <select
                        value={selectedReceivableId}
                        onChange={(e) => {
                          setSelectedReceivableId(e.target.value);
                          const chosen = customerReceivables.find((r) => r.id === e.target.value);
                          if (chosen?.balance) {
                            setPromisedAmount(String(chosen.balance));
                          }
                        }}
                        style={{
                          width: '100%',
                          backgroundColor: isLight ? '#F8FAFC' : '#001625',
                          border: `1px solid ${tokens.surfaceBorder}`,
                          color: tokens.textPrimary,
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      >
                        {customerReceivables.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.reference || 'Invoice'} • {formatCurrency(r.balance || r.originalAmount, r.currency)} ({r.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="responsive-split-2">
                    <div>
                      <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                        Promised Amount (₦)
                      </label>
                      <input
                        type="number"
                        value={promisedAmount}
                        onChange={(e) => setPromisedAmount(e.target.value)}
                        placeholder="e.g. 300000"
                        style={{
                          width: '100%',
                          backgroundColor: isLight ? '#F8FAFC' : '#001625',
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
                          backgroundColor: isLight ? '#F8FAFC' : '#001625',
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

                  <div>
                    <label style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                      Additional Notes / Arrangements (Optional)
                    </label>
                    <input
                      type="text"
                      value={promiseNotes}
                      onChange={(e) => setPromiseNotes(e.target.value)}
                      placeholder="e.g. Promised to send transfer receipt before 2 PM..."
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#F8FAFC' : '#001625',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        color: tokens.textPrimary,
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                    {promiseSuccessMsg && (
                      <span style={{ fontSize: '12px', color: '#00A581', fontWeight: 'bold' }}>
                        ✓ {promiseSuccessMsg}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isSavingPromise || !promisedAmount || !promisedDate}
                      onClick={handleQuickSavePromise}
                      style={{
                        backgroundColor: '#00A581',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '12.5px',
                        fontWeight: 'bold',
                        cursor: isSavingPromise ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0, 165, 129, 0.3)',
                      }}
                    >
                      {isSavingPromise ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Saving Commitment...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Save Commitment to Books</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Call Assistant Modal for Mobile Callers */}
      <CallAssistantModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        customer={selectedCustomer || null}
        scriptText={editableBody}
        onActionComplete={(msg) => {
          setApprovedSuccess(true);
          setLastDispatchedChannel('PHONE_CALL');
        }}
      />

      {/* Phone QR Bridge Modal for Desktop PC Calling & SMS */}
      <PhoneQrBridgeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        customer={selectedCustomer || null}
        mode={qrModalMode}
        scriptText={editableBody}
        onActionComplete={(msg) => {
          setApprovedSuccess(true);
          setLastDispatchedChannel(qrModalMode);
        }}
      />
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: '#8FB7C7' }}>Loading draft workspace...</div>}>
      <DraftContent />
    </Suspense>
  );
}
