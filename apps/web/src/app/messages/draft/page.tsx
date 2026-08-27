'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  customersApi, 
  aiApi, 
  collectionActivitiesApi, 
  CustomerItem,
  CollectionMessageDraftData,
  CollectionChannel
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
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
  Building
} from 'lucide-react';

function DraftContent() {
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams?.get('customerId');
  const { organization } = useAuth();

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
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Generate live AI draft
  const generateDraft = useCallback(async () => {
    if (!selectedCustomerId) return;
    setIsDrafting(true);
    setError(null);
    setApprovedSuccess(false);

    try {
      const data = await aiApi.draftMessage(selectedCustomerId, {
        channel,
        tone,
        customNote: customNote.trim() || undefined,
      });

      setDraft(data);
      setEditableBody(data.messageBody);
    } catch (err: any) {
      console.warn('Failed to generate draft message:', err);
      setError(err?.message || 'Failed to generate draft from live AI service.');
    } finally {
      setIsDrafting(false);
    }
  }, [selectedCustomerId, channel, tone, customNote]);

  useEffect(() => {
    if (selectedCustomerId) {
      generateDraft();
    }
  }, [selectedCustomerId, channel, tone, generateDraft]);

  const handleApproveAndLog = async () => {
    if (!selectedCustomerId || !editableBody.trim()) return;
    setIsApproving(true);
    setError(null);

    const channelMapping: Record<string, CollectionChannel> = {
      WHATSAPP: 'WHATSAPP',
      SMS: 'SMS',
      PHONE_CALL: 'PHONE',
      EMAIL: 'EMAIL',
    };

    try {
      await collectionActivitiesApi.createActivity({
        customerId: selectedCustomerId,
        type: 'PAYMENT_REMINDER',
        channel: channelMapping[channel] || 'WHATSAPP',
        outcome: 'CONTACTED',
        notes: `AI Follow-up Draft Approved & Dispatched via ${channel} (Tone: ${tone}):\n"${editableBody}"`,
      });

      setApprovedSuccess(true);
    } catch (err: any) {
      console.warn('Failed to record approved collection activity:', err);
      setError(err?.message || 'Failed to persist collection activity to live API.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleCopy = () => {
    if (!editableBody) return;
    navigator.clipboard.writeText(editableBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquareQuote size={24} color="#00A581" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>AI Follow-up Draft & Action Review</h2>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
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
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Queue</span>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#FCA5A5',
          fontSize: '13px',
        }}>
          <AlertCircle size={16} color="#EF4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {approvedSuccess && (
        <div style={{
          backgroundColor: 'rgba(0, 165, 129, 0.15)',
          border: '1px solid #00A581',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#3AD0A9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#00A581" />
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '14px' }}>Collection Action Successfully Approved & Logged</p>
              <p style={{ fontSize: '12px', color: '#A8F0DB' }}>
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
              }}
            >
              View Timeline
            </Link>
          )}
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
        {/* Left Column: Customer & Tone Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target Customer Card */}
          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '20px',
          }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '8px', textTransform: 'uppercase' }}>
              Target Customer Account
            </label>
            {isLoadingCustomers ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8FB7C7', fontSize: '13px' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading customers...</span>
              </div>
            ) : customers.length === 0 ? (
              <p style={{ color: '#8FB7C7', fontSize: '13px' }}>No customers available.</p>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  outline: 'none',
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
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #0F5470', fontSize: '12px', color: '#DCEAF0' }}>
                <p><strong>Contact:</strong> {selectedCustomer.phone || 'No phone recorded'}</p>
                <p style={{ marginTop: '4px' }}><strong>Status:</strong> {selectedCustomer.status}</p>
              </div>
            )}
          </div>

          {/* Delivery Channel Selector */}
          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '20px',
          }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '10px', textTransform: 'uppercase' }}>
              Outreach Channel
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['WHATSAPP', 'SMS', 'PHONE_CALL', 'EMAIL'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: channel === ch ? '#00A581' : '#001D31',
                    color: channel === ch ? '#FFFFFF' : '#8FB7C7',
                    border: '1px solid #0F5470',
                  }}
                >
                  {ch.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Strategy Selector */}
          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '20px',
          }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '10px', textTransform: 'uppercase' }}>
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
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: tone === t.id ? '600' : 'normal',
                    backgroundColor: tone === t.id ? '#001D31' : 'transparent',
                    color: tone === t.id ? '#3AD0A9' : '#8FB7C7',
                    border: `1px solid ${tone === t.id ? '#00A581' : '#0F5470'}`,
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Draft Editor & Actions */}
        <div style={{
          backgroundColor: '#003051',
          borderRadius: '12px',
          border: '1px solid #0F5470',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#00A581" />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>
                  AI Generated Message Content
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#001D31',
                    border: '1px solid #0F5470',
                    color: '#8FB7C7',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                >
                  {copied ? <Check size={14} color="#00A581" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={isDrafting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#001D31',
                    border: '1px solid #0F5470',
                    color: '#00A581',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {isDrafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Editor Area */}
            {isDrafting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px', color: '#8FB7C7' }}>
                <Loader2 size={32} className="animate-spin text-teal-400" />
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
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            )}

            {draft?.culturalNotes && (
              <p style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '8px' }}>
                <strong style={{ color: '#3AD0A9' }}>AI Strategy Note:</strong> {draft.culturalNotes}
              </p>
            )}
          </div>

          {/* Action Confirmation Footer */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #0F5470',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: '12px', color: '#8FB7C7' }}>
              <span>Action will be logged to customer timeline upon human approval.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                href="/collections"
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  color: '#DCEAF0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Cancel
              </Link>

              <button
                type="button"
                onClick={handleApproveAndLog}
                disabled={isApproving || !editableBody.trim() || isDrafting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  opacity: isApproving || !editableBody.trim() || isDrafting ? 0.6 : 1,
                }}
              >
                {isApproving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Persisting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Approve & Log Collection Activity</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
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
