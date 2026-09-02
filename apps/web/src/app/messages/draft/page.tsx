'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
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
  isMobileDevice,
  calculateSmsSegments
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
  VolumeX,
  CreditCard,
  Zap,
  Tag,
  Share2,
  RotateCcw,
  Sliders,
  FileText,
  HelpCircle
} from 'lucide-react';

function DraftContent() {
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams?.get('customerId');
  const { organization, user } = useAuth();
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

  // Bank transfer details auto-embed state
  const [includeBankDetails, setIncludeBankDetails] = useState(true);

  // Desktop vs Mobile Detection & QR Phone Bridge State
  const [isMobileClient, setIsMobileClient] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalMode, setQrModalMode] = useState<'PHONE_CALL' | 'SMS'>('PHONE_CALL');

  // Multi-lingual message drafting
  const { currentLanguage, t } = useLanguage();
  const [draftLanguage, setDraftLanguage] = useState<SupportedLanguage>(currentLanguage);

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraftLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    setIsMobileClient(isMobileDevice());
  }, []);

  // Voice Preview Handler
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

  // Load customer list
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

  // Sync customer receivables
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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedRec = customerReceivables.find((r) => r.id === selectedReceivableId);
  const curr = organization?.currency || selectedCustomer?.currency || 'NGN';

  // Bank Details String builder
  const getBankDetailsString = useCallback(() => {
    const orgSettings = (organization as any)?.settings || {};
    const bankName = orgSettings.bankName || 'Zenith Bank';
    const accountNumber = orgSettings.accountNumber || '1029384756';
    const accountName = orgSettings.accountName || organization?.name || 'Netify Business Account';
    return `\n\nPayment Details:\nBank: ${bankName}\nAccount Number: ${accountNumber}\nAccount Name: ${accountName}`;
  }, [organization]);

  // Fast Snippet Presets (Offline instant templates)
  const applyPresetSnippet = (presetId: number) => {
    if (!selectedCustomer) return;
    const name = selectedCustomer.name || 'Customer';
    const amountStr = formatCurrency(Number(selectedCustomer.totalOutstanding || selectedRec?.balance || 0), curr);
    const dueDateStr = selectedRec?.dueDate ? new Date(selectedRec.dueDate).toLocaleDateString() : 'recently';
    const bankInfo = includeBankDetails ? getBankDetailsString() : '';

    let text = '';
    switch (presetId) {
      case 1: // Friendly First Reminder
        text = `Good day ${name},\n\nWe hope your business is thriving. This is a gentle reminder regarding your balance of ${amountStr} due on ${dueDateStr}.\n\nPlease confirm when payment is initiated.${bankInfo}\n\nThank you for your business!\n${organization?.name || 'Netify Merchant'}`;
        break;
      case 2: // Standard Overdue with Bank
        text = `Hello ${name},\n\nWe are following up on your invoice for ${amountStr} which is now past due. Kindly arrange payment today so we can update your ledger.${bankInfo}\n\nPlease share the transfer receipt once completed.\n\nRegards,\n${organization?.name || 'Netify Merchant'}`;
        break;
      case 3: // Broken Promise Follow-up
        text = `Good day ${name},\n\nWe are checking in regarding the payment promise of ${amountStr} previously agreed upon. We have not yet received confirmation of the transfer.\n\nKindly let us know if payment was initiated or if you need our bank details re-sent.${bankInfo}\n\n${organization?.name || 'Netify Merchant'}`;
        break;
      case 4: // Urgent Final Demand
        text = `URGENT NOTICE: Good day ${name},\n\nYour overdue account balance of ${amountStr} requires immediate settlement to avoid account suspension and collection escalation.\n\nKindly transfer the full balance today.${bankInfo}\n\nNetify Accounts Department`;
        break;
      case 5: // Partial Payment Proposal
        text = `Hello ${name},\n\nTo support your cashflow, we can accept an immediate partial deposit of 50% on your outstanding balance of ${amountStr}, with the remainder scheduled for next week.${bankInfo}\n\nKindly confirm if this payment plan works for you.\n\n${organization?.name || 'Netify Merchant'}`;
        break;
    }

    setEditableBody(text);
  };

  // Variable Insertion Helper
  const insertVariable = (varType: string) => {
    if (!selectedCustomer) return;
    const name = selectedCustomer.name || 'Customer';
    const amountStr = formatCurrency(Number(selectedCustomer.totalOutstanding || selectedRec?.balance || 0), curr);
    const dueDateStr = selectedRec?.dueDate ? new Date(selectedRec.dueDate).toLocaleDateString() : 'Due on agreed date';
    const overdueDays = selectedRec?.dueDate ? Math.max(0, Math.floor((Date.now() - new Date(selectedRec.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const bankDetails = getBankDetailsString().trim();
    const paymentLink = `https://app.netify.africa/pay/${selectedCustomer.id.slice(0, 8)}`;

    let replacement = '';
    switch (varType) {
      case 'NAME': replacement = name; break;
      case 'AMOUNT': replacement = amountStr; break;
      case 'DUE_DATE': replacement = dueDateStr; break;
      case 'OVERDUE_DAYS': replacement = `${overdueDays} days overdue`; break;
      case 'BANK': replacement = bankDetails; break;
      case 'PAY_LINK': replacement = paymentLink; break;
    }

    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = editableBody;
      const updated = current.substring(0, start) + replacement + current.substring(end);
      setEditableBody(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      }, 50);
    } else {
      setEditableBody((prev) => `${prev} ${replacement}`);
    }
  };

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

      const bankInstruction = includeBankDetails ? ' Include clear bank account transfer details at the bottom.' : '';
      const fullCustomNote = languageInstruction + (customNote.trim() ? customNote.trim() : '') + bankInstruction;

      const data = await aiApi.draftMessage(selectedCustomerId, {
        channel,
        tone,
        customNote: fullCustomNote.trim() || undefined,
        receivableId: selectedReceivableId || undefined,
      });

      let bodyText = data?.messageBody || (data as any)?.messageText || (data as any)?.body || '';
      if (includeBankDetails && !bodyText.toLowerCase().includes('bank')) {
        bodyText += getBankDetailsString();
      }

      setDraft(data);
      setEditableBody(bodyText);
    } catch (err: any) {
      console.warn('Failed to generate draft message:', err);
      setError(err?.message || 'Failed to generate draft from live AI service.');
    } finally {
      setIsDrafting(false);
    }
  }, [selectedCustomerId, channel, tone, customNote, draftLanguage, selectedReceivableId, includeBankDetails, getBankDetailsString]);

  useEffect(() => {
    if (selectedCustomerId) {
      generateDraft();
    }
  }, [selectedCustomerId, channel, tone, draftLanguage, generateDraft]);

  // Native deep-link dispatch handler with automatic Activity & Memory logging
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
        setQrModalMode('PHONE_CALL');
        setIsQrModalOpen(true);
      }
      return;
    }

    // Direct SMS
    if (ch === 'SMS') {
      if (isMobileClient) {
        const smsUrl = getSmsUrl(selectedCustomer?.phone, editableBody);
        if (smsUrl) {
          window.location.href = smsUrl;
        }
      } else {
        setQrModalMode('SMS');
        setIsQrModalOpen(true);
      }
    }

    // Direct WhatsApp
    if (ch === 'WHATSAPP') {
      const waUrl = isMobileClient 
        ? getWhatsAppUrl(selectedCustomer?.phone, editableBody)
        : getWhatsAppWebUrl(selectedCustomer?.phone, editableBody);
      
      if (waUrl) {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    }

    // Direct Email
    if (ch === 'EMAIL') {
      const subject = draft?.subject || `Payment Notice regarding your account with ${organization?.name || 'Netify'}`;
      const toEmail = selectedCustomer?.email || '';

      if (emailProvider === 'GMAIL') {
        window.open(getGmailWebUrl(toEmail, subject, editableBody), '_blank', 'noopener,noreferrer');
      } else if (emailProvider === 'OUTLOOK') {
        window.open(getOutlookWebUrl(toEmail, subject, editableBody), '_blank', 'noopener,noreferrer');
      } else {
        const mailto = getMailtoUrl(toEmail, subject, editableBody);
        if (mailto) window.location.href = mailto;
      }
    }

    // Auto-record collection activity in database
    try {
      await collectionActivitiesApi.createActivity({
        customerId: selectedCustomerId,
        receivableId: selectedReceivableId || undefined,
        type: ch === 'WHATSAPP' ? 'WHATSAPP' : (ch === 'SMS' ? 'SMS' : 'EMAIL'),
        channel: ch as any,
        outcome: 'CONTACTED',
        notes: `${editableBody}\n\n(Dispatched via ${ch} by ${user?.firstName || 'Owner'})`,
      });
      setLastDispatchedChannel(ch);
      setApprovedSuccess(true);
      setTimeout(() => setApprovedSuccess(false), 4000);
    } catch (err) {
      console.warn('Failed to auto-record collection activity:', err);
    }
  };

  // Quick Promise Logger Handler
  const handleSaveQuickPromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !promisedAmount || !promisedDate) return;
    setIsSavingPromise(true);
    setPromiseSuccessMsg(null);

    try {
      await commitmentsApi.createCommitment({
        customerId: selectedCustomerId,
        receivableId: selectedReceivableId || undefined,
        amount: Number(promisedAmount),
        currency: curr,
        promisedFor: promisedDate,
        notes: promiseNotes || 'Captured during customer message follow-up',
      });
      setPromiseSuccessMsg(`Payment promise of ${formatCurrency(Number(promisedAmount), curr)} logged for ${new Date(promisedDate).toLocaleDateString()}!`);
      setTimeout(() => {
        setQuickPromiseOpen(false);
        setPromiseSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err?.message || 'Failed to save payment promise');
    } finally {
      setIsSavingPromise(false);
    }
  };

  const smsMeta = calculateSmsSegments(editableBody);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link
            href="/collections"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: tokens.textMuted,
              textDecoration: 'none',
              marginBottom: '6px',
              fontWeight: '600',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Collections Queue</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581' }}>
              <MessageSquareQuote size={18} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
              Follow-up & Message Studio
            </h2>
          </div>
        </div>

        {/* Quick Promise Drawer Trigger */}
        <button
          type="button"
          onClick={() => setQuickPromiseOpen(!quickPromiseOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: quickPromiseOpen ? '#00A581' : (isLight ? '#F1F5F9' : '#002B49'),
            color: quickPromiseOpen ? '#FFFFFF' : tokens.textPrimary,
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          <Calendar size={14} />
          <span>{quickPromiseOpen ? 'Close Promise Logger' : 'Log Debtor Promise'}</span>
        </button>
      </div>

      {/* Quick Promise-to-Pay Logger Card */}
      {quickPromiseOpen && (
        <div className="animate-fade-in" style={{
          backgroundColor: tokens.surface,
          borderRadius: '12px',
          border: '1.5px solid #00A581',
          padding: '20px',
          boxShadow: isLight ? tokens.shadowCard : '0 8px 30px rgba(0, 165, 129, 0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="#00A581" />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary }}>
                Log Debtor Payment Commitment
              </span>
            </div>
            <button type="button" onClick={() => setQuickPromiseOpen(false)} style={{ background: 'none', border: 'none', color: tokens.textMuted, cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {promiseSuccessMsg ? (
            <div style={{ backgroundColor: isLight ? '#ECFDF5' : 'rgba(0, 165, 129, 0.2)', border: '1px solid #00A581', color: '#00A581', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{promiseSuccessMsg}</span>
            </div>
          ) : (
            <form onSubmit={handleSaveQuickPromise} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Promised Amount ({curr}) *
                </label>
                <input
                  type="number"
                  value={promisedAmount}
                  onChange={(e) => setPromisedAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${tokens.surfaceBorder}`, backgroundColor: isLight ? '#FFFFFF' : '#00192B', color: tokens.textPrimary, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Promised Repayment Date *
                </label>
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${tokens.surfaceBorder}`, backgroundColor: isLight ? '#FFFFFF' : '#00192B', color: tokens.textPrimary, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Debtor Note / Agreement
                </label>
                <input
                  type="text"
                  value={promiseNotes}
                  onChange={(e) => setPromiseNotes(e.target.value)}
                  placeholder="e.g. Promised via WhatsApp check-in"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${tokens.surfaceBorder}`, backgroundColor: isLight ? '#FFFFFF' : '#00192B', color: tokens.textPrimary, fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPromise}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: isSavingPromise ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {isSavingPromise ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Commitment</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '20px' }}>
        
        {/* Left Column: Context & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 1. Target Customer Selection Card */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Select Target Debtor
            </label>

            {isLoadingCustomers ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', color: tokens.textMuted, fontSize: '13px' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading customers...</span>
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  color: tokens.textPrimary,
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {formatCurrency(Number(c.totalOutstanding || 0), c.currency || curr)}
                  </option>
                ))}
              </select>
            )}

            {/* Debtor Overview Chip */}
            {selectedCustomer && (
              <div style={{
                backgroundColor: isLight ? '#F8FAFC' : '#00192B',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: tokens.textMuted }}>Total Outstanding:</span>
                  <span style={{ fontWeight: '800', color: '#EF4444' }}>
                    {formatCurrency(Number(selectedCustomer.totalOutstanding || 0), selectedCustomer.currency || curr)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: tokens.textMuted }}>Phone Number:</span>
                  <span style={{ fontWeight: '600', color: tokens.textPrimary }}>
                    {formatDisplayPhone(selectedCustomer.phone)}
                  </span>
                </div>
                {selectedCustomer.email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: tokens.textMuted }}>Email:</span>
                    <span style={{ color: tokens.textSecondary }}>{selectedCustomer.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Channel & Tone Selection */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                2. Outreach Channel
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquareQuote, color: '#10B981' },
                  { id: 'SMS', label: 'SMS Text', icon: MessageSquare, color: '#00A581' },
                  { id: 'PHONE_CALL', label: 'Phone Call', icon: PhoneCall, color: '#3B82F6' },
                  { id: 'EMAIL', label: 'Email', icon: Mail, color: '#8B5CF6' },
                ].map((ch) => {
                  const isSelected = channel === ch.id;
                  const Icon = ch.icon;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChannel(ch.id as any)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? ch.color : tokens.surfaceBorder}`,
                        backgroundColor: isSelected ? (isLight ? '#F0FDF4' : 'rgba(0, 165, 129, 0.15)') : 'transparent',
                        color: isSelected ? tokens.textPrimary : tokens.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        fontWeight: '700',
                      }}
                    >
                      <Icon size={16} color={isSelected ? ch.color : tokens.textMuted} />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                3. Desired Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  color: tokens.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <option value="DIRECT_FOLLOWUP">Direct Follow-up (Firm & Factual)</option>
                <option value="RESPECTFUL_REMINDER">Respectful Reminder (Gentle & Polite)</option>
                <option value="URGENT_ESCALATION">Urgent Escalation (High Risk & Overdue)</option>
                <option value="PARTIAL_PAYMENT_PROPOSAL">Partial Payment Offer (Installment Plan)</option>
              </select>
            </div>

            {/* Language Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Language & Local Dialect
              </label>
              <select
                value={draftLanguage}
                onChange={(e) => setDraftLanguage(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  color: tokens.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Details Switch */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${tokens.surfaceBorder}`, cursor: 'pointer', fontSize: '12px', color: tokens.textPrimary, fontWeight: '600' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={15} color="#00A581" />
                <span>Auto-Embed Bank Transfer Details</span>
              </div>
              <input
                type="checkbox"
                checked={includeBankDetails}
                onChange={(e) => setIncludeBankDetails(e.target.checked)}
                style={{ accentColor: '#00A581', width: '15px', height: '15px', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* 3. Fast Snippet Presets */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Zap size={13} color="#F59E0B" />
              <span>Fast Template Presets (Instant)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 1, label: '1. Gentle Check-in (Due Soon)' },
                { id: 2, label: '2. Overdue with Bank Details' },
                { id: 3, label: '3. Broken Promise Follow-up' },
                { id: 4, label: '4. Urgent Final Demand Notice' },
                { id: 5, label: '5. 50% Token Deposit Offer' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPresetSnippet(p.id)}
                  style={{
                    textAlign: 'left',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    color: tokens.textPrimary,
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Message Editor & Variable Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '12px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            
            {/* Editor Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={17} color="#00A581" />
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary }}>
                  Message Composer
                </span>
                {draftLanguage !== 'en' && (
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: tokens.accentSoft, color: '#00A581', border: `1px solid ${tokens.accentBorder}` }}>
                    {LANGUAGE_REGISTRY[draftLanguage].flag} {LANGUAGE_REGISTRY[draftLanguage].name}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleToggleVoicePreview}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: isPlayingAudio ? '#EF4444' : (isLight ? '#F1F5F9' : '#002B49'),
                    color: isPlayingAudio ? '#FFFFFF' : tokens.textSecondary,
                    border: `1px solid ${tokens.surfaceBorder}`,
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {isPlayingAudio ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>{isPlayingAudio ? 'Stop Audio' : 'Voice Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={isDrafting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: tokens.accentSoft,
                    color: '#00A581',
                    border: `1px solid ${tokens.accentBorder}`,
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: isDrafting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isDrafting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>Regenerate AI</span>
                </button>
              </div>
            </div>

            {/* Dynamic Variable Chips Insertion Bar */}
            <div style={{
              backgroundColor: isLight ? '#F8FAFC' : '#00192B',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textMuted, marginRight: '4px', textTransform: 'uppercase' }}>
                Insert Variable:
              </span>
              {[
                { id: 'NAME', label: '{{CustomerName}}' },
                { id: 'AMOUNT', label: '{{OutstandingAmount}}' },
                { id: 'DUE_DATE', label: '{{DueDate}}' },
                { id: 'OVERDUE_DAYS', label: '{{DaysOverdue}}' },
                { id: 'BANK', label: '{{BankDetails}}' },
                { id: 'PAY_LINK', label: '{{PaymentLink}}' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => insertVariable(v.id)}
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#002B49',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#00A581',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Live Editable Text Area */}
            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                rows={12}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                placeholder="Drafting personalized collection message..."
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${tokens.surfaceBorder}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#00192B',
                  color: tokens.textPrimary,
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />

              {isDrafting && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(2px)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                }}>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Synthesizing live ledger records...</span>
                </div>
              )}
            </div>

            {/* Bottom Meta & SMS Segment Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: tokens.textMuted }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Character Count: <strong>{editableBody.length}</strong></span>
                
                {channel === 'SMS' && (
                  <span style={{
                    fontWeight: '700',
                    color: smsMeta.segments > 1 ? '#F59E0B' : '#00A581',
                    backgroundColor: smsMeta.segments > 1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 165, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {smsMeta.segments} SMS Page{smsMeta.segments > 1 ? 's' : ''} ({smsMeta.charsRemaining} chars left in segment)
                  </span>
                )}
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(editableBody);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: copied ? '#00A581' : tokens.textMuted,
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
              </button>
            </div>

            {/* Success Toast Banner */}
            {approvedSuccess && (
              <div style={{
                backgroundColor: isLight ? '#ECFDF5' : 'rgba(0, 165, 129, 0.2)',
                border: '1.5px solid #00A581',
                padding: '12px 16px',
                borderRadius: '8px',
                color: '#00A581',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle2 size={18} />
                <span>Follow-up dispatched via {lastDispatchedChannel} & automatically logged in Customer Ledger!</span>
              </div>
            )}

            {/* Primary Dispatch Action Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              
              {channel === 'EMAIL' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNativeDispatch('EMAIL', 'GMAIL')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#EA4335',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Mail size={14} />
                    <span>Open in Gmail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNativeDispatch('EMAIL', 'OUTLOOK')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#0078D4',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Mail size={14} />
                    <span>Open in Outlook</span>
                  </button>
                </>
              )}

              {channel === 'WHATSAPP' && (
                <button
                  type="button"
                  onClick={() => handleNativeDispatch('WHATSAPP')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <MessageSquareQuote size={17} />
                  <span>Launch WhatsApp & Log Activity</span>
                </button>
              )}

              {channel === 'SMS' && (
                <button
                  type="button"
                  onClick={() => handleNativeDispatch('SMS')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#00A581',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
                  }}
                >
                  <MessageSquare size={17} />
                  <span>{isMobileClient ? 'Send SMS via Phone' : 'Send SMS via Phone QR Bridge'}</span>
                </button>
              )}

              {channel === 'PHONE_CALL' && (
                <button
                  type="button"
                  onClick={() => handleNativeDispatch('PHONE_CALL')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <PhoneCall size={17} />
                  <span>{isMobileClient ? 'Call with Teleprompter' : 'Call via Desktop QR Bridge'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Call Assistant Modal */}
      {selectedCustomer && (
        <CallAssistantModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          customer={selectedCustomer}
          scriptText={editableBody}
        />
      )}

      {/* Phone QR Bridge Modal for Desktop Users */}
      {selectedCustomer && (
        <PhoneQrBridgeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          customer={selectedCustomer}
          scriptText={editableBody}
          mode={qrModalMode}
        />
      )}
    </div>
  );
}

export default function MessageDraftPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    }>
      <DraftContent />
    </Suspense>
  );
}
