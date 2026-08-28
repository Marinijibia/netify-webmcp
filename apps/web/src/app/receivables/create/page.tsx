'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  receivablesApi, 
  customersApi, 
  CustomerItem 
} from '@/lib/api';
import { 
  FileText, 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

const TERM_OPTIONS = [7, 14, 30, 60];

export default function CreateReceivablePage() {
  const router = useRouter();
  const { organization } = useAuth();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [termDays, setTermDays] = useState(14);
  const [source, setSource] = useState<'MANUAL' | 'INVOICE' | 'CREDIT_SALE' | 'OTHER'>('INVOICE');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = organization?.currency || 'NGN';

  useEffect(() => {
    async function loadCustomers() {
      try {
        const list = await customersApi.list();
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      } catch (err: any) {
        console.warn('Failed to load customers for invoice creation:', err);
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  const calculateDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + termDays);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + termDays);

      await receivablesApi.create({
        customerId: selectedCustomerId,
        amount: num,
        currency,
        dueDate: dueDate.toISOString(),
        description: description.trim() || undefined,
        reference: reference.trim() || undefined,
        source,
        notes: notes.trim() || undefined,
      });

      router.push('/receivables');
    } catch (err: any) {
      console.warn('Failed to create receivable:', err);
      setError(err?.message || 'Failed to issue receivable in live API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px', margin: '0 auto' }}>
      {/* Back Link */}
      <Link
        href="/receivables"
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
        <span>Back to Receivables Ledger</span>
      </Link>

      {/* Form Card */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '32px',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} color="#00A581" />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>Issue New Receivable / Invoice</h2>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '4px' }}>
            Log a new credit sale or invoice with deterministic due dates.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Customer Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '6px', textTransform: 'uppercase' }}>
              Assign Customer *
            </label>
            {loadingCustomers ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8FB7C7', fontSize: '13px' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading customer accounts...</span>
              </div>
            ) : customers.length === 0 ? (
              <div style={{ color: '#FCA5A5', fontSize: '13px' }}>
                No active customers found.{' '}
                <Link href="/customers/create" style={{ color: '#00A581', fontWeight: 'bold' }}>
                  Create Customer First
                </Link>
              </div>
            ) : (
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
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
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '6px', textTransform: 'uppercase' }}>
              Invoice Amount ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 250000"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#001D31',
                border: '1px solid #0F5470',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 'bold',
                outline: 'none',
              }}
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '8px', textTransform: 'uppercase' }}>
              Payment Terms (Due in {termDays} days — {calculateDueDate()})
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {TERM_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTermDays(days)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    backgroundColor: termDays === days ? '#00A581' : '#001D31',
                    color: termDays === days ? '#FFFFFF' : '#8FB7C7',
                    border: `1px solid ${termDays === days ? '#00A581' : '#0F5470'}`,
                  }}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Reference & Source */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '6px', textTransform: 'uppercase' }}>
                Invoice Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. INV-2026-001"
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '6px', textTransform: 'uppercase' }}>
                Receivable Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
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
                <option value="INVOICE">Formal Invoice</option>
                <option value="CREDIT_SALE">Credit Sale (Goods Dispatched)</option>
                <option value="MANUAL">Manual Balance Entry</option>
                <option value="OTHER">Other / Service Agreement</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '6px', textTransform: 'uppercase' }}>
              Item / Goods Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 50 bags of flour, 20 cartons of sugar"
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

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '6px', textTransform: 'uppercase' }}>
              Internal Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery confirmed by warehouse supervisor..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#001D31',
                border: '1px solid #0F5470',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || customers.length === 0}
            style={{
              marginTop: '8px',
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
              opacity: isSubmitting || customers.length === 0 ? 0.6 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Issuing Receivable...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Issue Receivable & Commit to Ledger</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
