'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Banknote, 
  Check, 
  Loader2,
  Smartphone,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { onboardingApi } from '@/lib/api/onboarding';
import WebFingerprintModal from '@/components/WebFingerprintModal';

interface BusinessTypeOption {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

const BUSINESS_TYPES: BusinessTypeOption[] = [
  { id: 'RETAIL', label: 'Retail & Supermarket', desc: 'Fast inventory turnover & everyday walk-in buyers', icon: '🛍️' },
  { id: 'WHOLESALE', label: 'Wholesale & Distribution', desc: 'Bulk supply to retailers with rolling trade credit', icon: '📦' },
  { id: 'SERVICES', label: 'Services & Consulting', desc: 'Milestone billings, retainers & agency accounts', icon: '💼' },
  { id: 'LOGISTICS', label: 'Logistics & Haulage', desc: 'Freight manifest, waybills & transport credit', icon: '🚚' },
  { id: 'MANUFACTURING', label: 'Manufacturing & Production', desc: 'Raw material procurement & factory distributor credit', icon: '🏭' },
  { id: 'HOSPITALITY', label: 'Food, Hotel & Events', desc: 'Catering accounts, hospitality & vendor supply', icon: '🍽️' },
  { id: 'AGRICULTURE', label: 'Agro-Allied & Commodities', desc: 'Farm produce, grain aggregators & seasonal credit', icon: '🌾' },
  { id: 'HEALTHCARE', label: 'Pharmacy & Healthcare', desc: 'Hospitals, clinics & pharmaceutical distribution', icon: '💊' },
  { id: 'TECH_DIGITAL', label: 'Tech & Digital Agency', desc: 'SaaS solutions, digital marketing & cloud services', icon: '💻' },
  { id: 'OTHER', label: 'General Trade & Commerce', desc: 'Import, multi-line merchandise & open marketplace', icon: '🏢' },
];

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: '₵', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', symbol: 'RF', flag: '🇷🇼' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', flag: '🇿🇦' },
  { code: 'US', name: 'Global Trade (USD)', currency: 'USD', symbol: '$', flag: '🌍' },
];

const PRESET_GRACE_PERIODS = [
  { days: 1, label: '1 Day', description: 'Pay tomorrow / Fast daily retail turnover' },
  { days: 3, label: '3 Days', description: 'Short-term trust & weekend settlement' },
  { days: 7, label: '7 Days', description: 'Weekly supply & recurring trade accounts' },
  { days: 14, label: '14 Days (Standard)', description: 'Standard wholesale trade credit & invoices' },
  { days: 30, label: '30 Days', description: 'Monthly supply contracts & Net 30 terms' },
];

const REMINDER_TONES = [
  { 
    id: 'FRIENDLY', 
    title: 'Friendly & Conversational', 
    desc: 'Warm West African merchant relationship style ("Good day Alhaji, just following up on your invoice...")',
    tag: 'Highest Response Rate',
    icon: '🤝'
  },
  { 
    id: 'PROFESSIONAL', 
    title: 'Professional & Courteous', 
    desc: 'Formal corporate accounting style ("Dear Accounts Dept, this is a scheduled payment reminder...")',
    tag: 'Corporate Standard',
    icon: '🏛️'
  },
  { 
    id: 'FIRM', 
    title: 'Firm & Direct', 
    desc: 'Strict enforcement for overdue receivables ("Urgent Notice: invoice is overdue and requires settlement today...")',
    tag: 'Escalations',
    icon: '⚖️'
  },
];

const PAYMENT_METHODS = [
  { id: 'Bank Transfer', label: 'Bank Transfer (NIP / RTGS)', icon: '🏛️' },
  { id: 'Mobile Money / USSD', label: 'Mobile Money / USSD (*737#, M-Pesa, MoMo)', icon: '📱' },
  { id: 'POS / Cash', label: 'POS Terminal / Cash Collection', icon: '💳' },
  { id: 'Debit Card', label: 'Direct Debit & Payment Links', icon: '🔗' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, organization, refreshProfile } = useAuth();
  const { tokens, isLight } = useTheme();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [businessName, setBusinessName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('RETAIL');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  
  const [graceDays, setGraceDays] = useState(14);
  const [isCustomGrace, setIsCustomGrace] = useState(false);
  const [customDaysText, setCustomDaysText] = useState('10');
  const [reminderTone, setReminderTone] = useState('FRIENDLY');
  const [selectedMethods, setSelectedMethods] = useState<string[]>([
    'Bank Transfer',
    'Mobile Money / USSD',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricConfigured, setBiometricConfigured] = useState(false);

  // Initialize from user / org profile
  useEffect(() => {
    if (organization?.name) {
      setBusinessName(organization.name);
    } else if (user?.firstName) {
      setBusinessName(`${user.firstName}'s Enterprise`);
    }

    if (organization?.currency) {
      const match = COUNTRIES.find((c) => c.currency === organization.currency);
      if (match) setSelectedCountry(match);
    }
  }, [organization, user]);

  const togglePaymentMethod = (id: string) => {
    if (selectedMethods.includes(id)) {
      if (selectedMethods.length > 1) {
        setSelectedMethods(selectedMethods.filter((m) => m !== id));
      }
    } else {
      setSelectedMethods([...selectedMethods, id]);
    }
  };

  const handleStep1Next = () => {
    if (!businessName.trim()) {
      setErrorMessage('Please enter your business or organization name.');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Next = () => {
    setErrorMessage(null);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const finalGraceDays = isCustomGrace ? (parseInt(customDaysText, 10) || 14) : graceDays;
      
      const payload = {
        step: 'COMPLETED',
        onboardingCompleted: true,
        onboardingData: {
          businessName: businessName.trim(),
          businessType: selectedCategory,
          country: selectedCountry.code,
          currency: selectedCountry.currency,
          defaultGracePeriodDays: finalGraceDays,
          aiReminderTone: reminderTone,
          acceptedPaymentMethods: selectedMethods,
          biometricEnabled: biometricConfigured,
        },
      };

      await onboardingApi.updateStatus(payload);
      await refreshProfile();
      router.push('/workspace');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      backgroundColor: tokens.background,
      padding: '40px 24px 80px',
      position: 'relative',
      transition: 'background-color 0.2s ease',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(0, 165, 129, 0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '840px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Step Progress Tracker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '36px',
        }}>
          {[
            { step: 1, title: 'Business Profile', icon: Building2 },
            { step: 2, title: 'Credit & AI Tone', icon: Clock },
            { step: 3, title: 'Ready to Collect', icon: CheckCircle2 },
          ].map((item, idx) => {
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.step}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: isDone || isActive ? '#00A581' : (isLight ? '#F1F5F9' : '#00253F'),
                    color: isDone || isActive ? '#FFFFFF' : tokens.textMuted,
                    border: `1px solid ${isDone || isActive ? '#00A581' : tokens.surfaceBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 15px rgba(0, 165, 129, 0.4)' : 'none',
                  }}>
                    {isDone ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                  </div>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: isActive ? '#00A581' : tokens.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Step {item.step}
                    </span>
                    <h4 style={{
                      margin: 0,
                      fontSize: '13.5px',
                      fontWeight: isActive ? 'bold' : '600',
                      color: isActive ? tokens.textPrimary : tokens.textSecondary,
                    }}>
                      {item.title}
                    </h4>
                  </div>
                </div>

                {idx < 2 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: currentStep > idx + 1 ? '#00A581' : tokens.surfaceBorder,
                    margin: '0 16px',
                    transition: 'all 0.2s ease',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '12px',
            padding: '12px 18px',
            color: isLight ? '#B91C1C' : '#FCA5A5',
            fontSize: '13.5px',
            marginBottom: '24px',
          }}>
            {errorMessage}
          </div>
        )}

        {/* =========================================================================
            STEP 1: BUSINESS IDENTITY & CATEGORY
           ========================================================================= */}
        {currentStep === 1 && (
          <div style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ marginBottom: '28px' }}>
              <span style={{
                backgroundColor: tokens.accentSoft,
                color: '#00A581',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                STEP 1 OF 3
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '12px' }}>
                Tell us about your business
              </h2>
              <p style={{ color: tokens.textSecondary, fontSize: '14px', marginTop: '4px' }}>
                Tailor Netify's collections intelligence to your specific trade model and billing cycles.
              </p>
            </div>

            {/* Business Name Input */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '8px', textTransform: 'uppercase' }}>
                Business or Organization Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Kano Central Supplies Ltd"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  borderRadius: '12px',
                  color: tokens.textPrimary,
                  fontSize: '15px',
                  outline: 'none',
                  boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                }}
              />
            </div>

            {/* Operating Country & Primary Currency */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px', textTransform: 'uppercase' }}>
                Primary Operating Currency & Settlement Region
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
              }}>
                {COUNTRIES.map((c) => {
                  const isSelected = selectedCountry.code === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCountry(c)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '12px',
                        backgroundColor: isSelected ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#00253F'),
                        border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isLight && !isSelected ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{c.flag}</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: isSelected ? '#00A581' : tokens.textPrimary }}>
                        {c.currency} ({c.symbol})
                      </span>
                      <span style={{ fontSize: '11px', color: tokens.textMuted }}>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Category Selection */}
            <div style={{ marginBottom: '36px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px', textTransform: 'uppercase' }}>
                Select Your Industry Category
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}>
                {BUSINESS_TYPES.map((type) => {
                  const isSelected = selectedCategory === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedCategory(type.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#00253F'),
                        border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        boxShadow: isLight && !isSelected ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '24px', lineHeight: 1 }}>{type.icon}</span>
                      <div>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: 'bold',
                          color: isSelected ? '#00A581' : tokens.textPrimary,
                        }}>
                          {type.label}
                        </div>
                        <p style={{
                          margin: '4px 0 0',
                          fontSize: '11.5px',
                          color: tokens.textSecondary,
                          lineHeight: '1.4',
                        }}>
                          {type.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleStep1Next}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '13px 28px',
                  borderRadius: '12px',
                  fontSize: '14.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(0, 165, 129, 0.35)',
                }}
              >
                <span>Continue to Credit Policy</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: CREDIT TERMS & AI FOLLOW-UP PERSONA
           ========================================================================= */}
        {currentStep === 2 && (
          <div style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ marginBottom: '28px' }}>
              <span style={{
                backgroundColor: tokens.accentSoft,
                color: '#00A581',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                STEP 2 OF 3
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '12px' }}>
                Configure Your Collections Policy
              </h2>
              <p style={{ color: tokens.textSecondary, fontSize: '14px', marginTop: '4px' }}>
                Set your standard grace periods and establish how the Netify AI speaks to your buyers.
              </p>
            </div>

            {/* Default Credit Grace Period */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px', textTransform: 'uppercase' }}>
                Default Invoice Grace Period Before Reminders Trigger
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
              }}>
                {PRESET_GRACE_PERIODS.map((preset) => {
                  const isSelected = !isCustomGrace && graceDays === preset.days;
                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => {
                        setIsCustomGrace(false);
                        setGraceDays(preset.days);
                      }}
                      style={{
                        padding: '14px 12px',
                        borderRadius: '12px',
                        backgroundColor: isSelected ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#00253F'),
                        border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isLight && !isSelected ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: isSelected ? '#00A581' : tokens.textPrimary }}>
                        {preset.label}
                      </div>
                      <div style={{ fontSize: '11px', color: tokens.textMuted, marginTop: '4px' }}>
                        {preset.description}
                      </div>
                    </button>
                  );
                })}

                {/* Custom Days Card */}
                <button
                  type="button"
                  onClick={() => setIsCustomGrace(true)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '12px',
                    backgroundColor: isCustomGrace ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#00253F'),
                    border: `1.5px solid ${isCustomGrace ? '#00A581' : tokens.surfaceBorder}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isLight && !isCustomGrace ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: isCustomGrace ? '#00A581' : tokens.textPrimary }}>
                    Custom Days
                  </div>
                  {isCustomGrace ? (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={customDaysText}
                        onChange={(e) => setCustomDaysText(e.target.value)}
                        style={{
                          width: '50px',
                          textAlign: 'center',
                          padding: '3px',
                          borderRadius: '6px',
                          border: `1px solid ${tokens.surfaceBorder}`,
                          backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                          color: tokens.textPrimary,
                          fontWeight: 'bold',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: tokens.textMuted }}>Days</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: tokens.textMuted, marginTop: '4px' }}>
                      Enter custom duration
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* AI Communication Tone */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px', textTransform: 'uppercase' }}>
                AI Follow-Up & WhatsApp Personality
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {REMINDER_TONES.map((tone) => {
                  const isSelected = reminderTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setReminderTone(tone.id)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#00253F'),
                        border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isLight && !isSelected ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '24px' }}>{tone.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: isSelected ? '#00A581' : tokens.textPrimary }}>
                              {tone.title}
                            </span>
                            <span style={{
                              fontSize: '10.5px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: isSelected ? 'rgba(0, 165, 129, 0.2)' : (isLight ? '#F1F5F9' : '#001D31'),
                              color: isSelected ? '#00A581' : tokens.textMuted,
                              fontWeight: 'bold',
                            }}>
                              {tone.tag}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: tokens.textSecondary }}>
                            {tone.desc}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: `1.5px solid ${isSelected ? '#00A581' : tokens.surfaceBorder}`,
                        backgroundColor: isSelected ? '#00A581' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accepted Payment Channels */}
            <div style={{ marginBottom: '36px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '10px', textTransform: 'uppercase' }}>
                Accepted Settlement Channels (Embedded in Follow-Ups)
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
              }}>
                {PAYMENT_METHODS.map((method) => {
                  const isChecked = selectedMethods.includes(method.id);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => togglePaymentMethod(method.id)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        backgroundColor: isChecked ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#00253F'),
                        border: `1.5px solid ${isChecked ? '#00A581' : tokens.surfaceBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `1.5px solid ${isChecked ? '#00A581' : tokens.surfaceBorder}`,
                        backgroundColor: isChecked ? '#00A581' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: isChecked ? '#00A581' : tokens.textPrimary }}>
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textSecondary,
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Next}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '13px 28px',
                  borderRadius: '12px',
                  fontSize: '14.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(0, 165, 129, 0.35)',
                }}
              >
                <span>Review & Finish</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: VERIFICATION & LAUNCH CELEBRATION
           ========================================================================= */}
        {currentStep === 3 && (
          <div style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.surfaceBorder}`,
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}>
            {/* Header Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: tokens.accentSoft,
              border: '1.5px solid #00A581',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00A581',
              marginBottom: '20px',
              boxShadow: '0 10px 25px rgba(0, 165, 129, 0.3)',
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: tokens.textPrimary, letterSpacing: '-0.5px' }}>
              You're Ready to Collect
            </h2>
            <p style={{ color: tokens.textSecondary, fontSize: '14.5px', marginTop: '6px', maxWidth: '520px', margin: '6px auto 32px' }}>
              Your business memory is initialized. Receivables tracking, automated promises, and AI WhatsApp reminders are configured.
            </p>

            {/* Audit Summary Card */}
            <div style={{
              backgroundColor: isLight ? '#F8FAFC' : '#00253F',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'left',
              maxWidth: '560px',
              margin: '0 auto 28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                <span style={{ fontSize: '13px', color: tokens.textMuted }}>Organization</span>
                <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: tokens.textPrimary }}>{businessName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                <span style={{ fontSize: '13px', color: tokens.textMuted }}>Category</span>
                <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: tokens.textPrimary }}>
                  {BUSINESS_TYPES.find((t) => t.id === selectedCategory)?.label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                <span style={{ fontSize: '13px', color: tokens.textMuted }}>Settlement Currency</span>
                <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: tokens.textPrimary }}>
                  {selectedCountry.flag} {selectedCountry.currency} ({selectedCountry.symbol})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                <span style={{ fontSize: '13px', color: tokens.textMuted }}>Default Grace Period</span>
                <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#00A581' }}>
                  {isCustomGrace ? `${customDaysText} Days` : `${graceDays} Days Net`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${tokens.surfaceBorder}` }}>
                <span style={{ fontSize: '13px', color: tokens.textMuted }}>AI Follow-Up Tone</span>
                <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: tokens.textPrimary }}>
                  {REMINDER_TONES.find((t) => t.id === reminderTone)?.title}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
                <span style={{ fontSize: '13px', color: tokens.textMuted }}>Settlement Channels</span>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: tokens.textSecondary, maxWidth: '280px', textAlign: 'right' }}>
                  {selectedMethods.join(' • ')}
                </span>
              </div>
            </div>

            {/* Optional Hardware Biometrics Binding */}
            <div style={{
              maxWidth: '560px',
              margin: '0 auto 32px',
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: biometricConfigured ? tokens.accentSoft : (isLight ? '#FFFFFF' : '#001D31'),
              border: `1px solid ${biometricConfigured ? '#00A581' : tokens.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: tokens.accentSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00A581',
                }}>
                  <Fingerprint size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>
                    {biometricConfigured ? 'Computer Biometrics Enabled' : 'Enable 1-Touch Fingerprint Login'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
                    {biometricConfigured ? 'Windows Hello / Touch ID linked to this browser' : 'Skip typing password on future logins'}
                  </div>
                </div>
              </div>

              {!biometricConfigured && (
                <button
                  type="button"
                  onClick={() => setShowBiometricModal(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: tokens.accentSoft,
                    border: '1px solid #00A581',
                    color: '#00A581',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Enable
                </button>
              )}

              {biometricConfigured && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00A581', fontSize: '12px', fontWeight: 'bold' }}>
                  <Check size={14} strokeWidth={3} />
                  <span>Ready</span>
                </span>
              )}
            </div>

            {/* Launch CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '16px 36px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 12px 28px rgba(0, 165, 129, 0.4)',
                  opacity: isSubmitting ? 0.7 : 1,
                  minWidth: '260px',
                }}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : null}
                <span>{isSubmitting ? 'Launching Workspace...' : 'Launch Collections Workspace'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  color: tokens.textMuted,
                  fontSize: '13px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                Back to Credit Policy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Biometric Verification Modal */}
      <WebFingerprintModal
        isOpen={showBiometricModal}
        email={user?.email || 'merchant@netify.ng'}
        onSuccess={() => {
          setBiometricConfigured(true);
          setShowBiometricModal(false);
        }}
        onClose={() => setShowBiometricModal(false)}
        title="Link Computer Biometrics"
        subtitle="Touch your device sensor or confirm Windows Hello to enable instant sign-in"
      />
    </div>
  );
}
