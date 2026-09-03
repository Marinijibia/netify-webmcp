'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Settings, 
  Globe, 
  Sparkles, 
  Building, 
  Check, 
  User, 
  ShieldCheck,
  Fingerprint,
  Camera,
  CheckCircle2,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Users,
  UserCheck,
  ShieldAlert,
  Key,
  Loader2,
  Plus,
  Lock,
  EyeOff,
  DollarSign,
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  Phone,
  MessageSquareQuote,
  Flame,
  Save,
  Mail,
  MapPin,
  FileCheck,
  Bot,
  Copy,
  Download,
  Upload,
  ExternalLink
} from 'lucide-react';
import { WebBiometricService, ComputerBiometricCapabilities } from '@/lib/biometrics';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import WebFaceRecognitionScanner from '@/components/WebFaceRecognitionScanner';
import { organizationApi, TeamMemberItem, DelegationSettings } from '@/lib/api';
import { NotificationPreferencesCard } from '@/components/NotificationPreferencesCard';

export default function SettingsPage() {
  const { user, organization } = useAuth();
  const { theme, setTheme, tokens, isLight } = useTheme();
  const { currentLanguage, setLanguage, openLanguageModal } = useLanguage();

  // Organization & Merchant Profile State
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [tradeName, setTradeName] = useState((organization as any)?.settings?.tradeName || '');
  const [rcNumber, setRcNumber] = useState((organization as any)?.settings?.rcNumber || '');
  const [contactEmail, setContactEmail] = useState((organization as any)?.settings?.contactEmail || user?.email || '');
  const [contactPhone, setContactPhone] = useState((organization as any)?.settings?.contactPhone || '');
  const [officeAddress, setOfficeAddress] = useState((organization as any)?.settings?.officeAddress || '');
  const [logoUrl, setLogoUrl] = useState((organization as any)?.settings?.logoUrl || '');
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Bank Settlement Account State
  const [bankName, setBankName] = useState((organization as any)?.settings?.bankDetails?.bankName || 'Guaranty Trust Bank (GTB)');
  const [accountNumber, setAccountNumber] = useState((organization as any)?.settings?.bankDetails?.accountNumber || '');
  const [accountName, setAccountName] = useState((organization as any)?.settings?.bankDetails?.accountName || organization?.name || '');
  const [paymentInstructions, setPaymentInstructions] = useState((organization as any)?.settings?.bankDetails?.instructions || 'Please include your Invoice Reference as the payment description.');
  const [currency, setCurrency] = useState(organization?.currency || 'NGN');
  const [isSavingBank, setIsSavingBank] = useState(false);

  // AI Copilot & Autonomy Defaults State
  const [aiTone, setAiTone] = useState<'PROFESSIONAL' | 'FIRM' | 'FRIENDLY'>((organization as any)?.settings?.aiDefaults?.tone || 'PROFESSIONAL');
  const [aiDefaultChannel, setAiDefaultChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL'>((organization as any)?.settings?.aiDefaults?.channel || 'WHATSAPP');
  const [isSavingAi, setIsSavingAi] = useState(false);

  // Global Toast / Saved Alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Team & Delegation State
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [delegationSettings, setDelegationSettings] = useState<DelegationSettings>({
    visibilityMode: organization?.settings?.delegation?.visibilityMode || 'OPEN_COLLABORATION',
    hideRevenueFromStaff: organization?.settings?.delegation?.hideRevenueFromStaff ?? true,
    requireCashierVerification: organization?.settings?.delegation?.requireCashierVerification ?? true,
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'ADMIN' | 'STAFF'>('STAFF');

  // Biometrics State
  const [capabilities, setCapabilities] = useState<ComputerBiometricCapabilities>({
    hasPlatformAuthenticator: false,
    hasWebcam: false,
    isFingerprintEnabled: false,
    isFaceEnabled: false,
    rememberedEmail: null,
  });
  const [isFaceEnrollModalOpen, setIsFaceEnrollModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadCapabilities() {
      const caps = await WebBiometricService.getCapabilities();
      setCapabilities(caps);
    }
    loadCapabilities();

    async function loadMembers() {
      if (!organization?.id) return;
      setIsLoadingMembers(true);
      try {
        const mems = await organizationApi.getMembers(organization.id);
        setMembers(mems);
      } catch (err) {
        console.warn('Could not load team members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    loadMembers();
    loadAgentGrants();
  }, [organization?.id]);

  // Connected AI Agents State
  const [agentGrants, setAgentGrants] = useState<any[]>([]);
  const [isLoadingGrants, setIsLoadingGrants] = useState(false);
  const [revokingGrantId, setRevokingGrantId] = useState<string | null>(null);

  const loadAgentGrants = async () => {
    setIsLoadingGrants(true);
    try {
      const res = await fetch('/api/oauth/grants');
      const data = await res.json();
      if (data?.grants) {
        setAgentGrants(data.grants);
      }
    } catch (err) {
      console.warn('Could not load agent grants:', err);
    } finally {
      setIsLoadingGrants(false);
    }
  };

  const handleRevokeGrant = async (grantId: string) => {
    setRevokingGrantId(grantId);
    try {
      const res = await fetch('/api/oauth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId }),
      });
      const data = await res.json();
      if (data?.success) {
        showToast('Agent access revoked immediately.');
        setAgentGrants((prev) => prev.map((g) => (g.id === grantId ? { ...g, status: 'REVOKED' } : g)));
      }
    } catch (err) {
      showToast('Failed to revoke agent grant.');
    } finally {
      setRevokingGrantId(null);
    }
  };

  // Save Merchant Profile
  const handleSaveProfile = async () => {
    if (!organization?.id) return;
    setIsSavingOrg(true);
    try {
      await organizationApi.update(organization.id, {
        name: orgName,
        settings: {
          ...(organization.settings || {}),
          tradeName,
          rcNumber,
          contactEmail,
          contactPhone,
          officeAddress,
          logoUrl,
        },
      });
      showToast('Merchant business profile updated successfully!');
    } catch (err: any) {
      alert(`Could not save profile: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingOrg(false);
    }
  };

  // Save Bank Details & Currency
  const handleSaveBank = async () => {
    if (!organization?.id) return;
    setIsSavingBank(true);
    try {
      await organizationApi.update(organization.id, {
        currency,
        settings: {
          ...(organization.settings || {}),
          bankDetails: {
            bankName,
            accountNumber,
            accountName,
            instructions: paymentInstructions,
          },
        },
      });
      showToast('Settlement bank account & currency saved!');
    } catch (err: any) {
      alert(`Could not save bank details: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingBank(false);
    }
  };

  // Copy Bank Remittance Text
  const handleCopyBankRemittance = () => {
    const text = `*OFFICIAL SETTLEMENT BANK DETAILS*\n` +
      `Bank: ${bankName || 'Guaranty Trust Bank'}\n` +
      `Account Number: ${accountNumber || '0123456789'}\n` +
      `Account Name: ${accountName || orgName}\n` +
      `Currency: ${currency}\n` +
      `Instructions: ${paymentInstructions}\n` +
      `Please use your Invoice Reference as payment description.`;

    navigator.clipboard.writeText(text);
    showToast('Bank remittance format copied to clipboard!');
  };

  // Save AI Copilot Defaults
  const handleSaveAiDefaults = async () => {
    if (!organization?.id) return;
    setIsSavingAi(true);
    try {
      await organizationApi.update(organization.id, {
        settings: {
          ...(organization.settings || {}),
          aiDefaults: {
            tone: aiTone,
            channel: aiDefaultChannel,
          },
        },
      });
      showToast('AI follow-up tone & autonomy defaults saved!');
    } catch (err: any) {
      alert(`Could not save AI defaults: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingAi(false);
    }
  };

  // Save Delegation Settings
  const handleToggleRevenueShield = async (val: boolean) => {
    const updated = { ...delegationSettings, hideRevenueFromStaff: val };
    setDelegationSettings(updated);
    if (!organization?.id) return;
    try {
      await organizationApi.update(organization.id, {
        settings: {
          ...(organization.settings || {}),
          delegation: updated,
        },
      });
      showToast(`Staff revenue shield ${val ? 'enabled (sensitive totals hidden from staff)' : 'disabled'}`);
    } catch (err: any) {
      console.warn('Failed to update delegation settings:', err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: any) => {
    if (!organization?.id) return;
    try {
      await organizationApi.updateMemberRole(organization.id, memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      showToast(`Team member role updated to ${newRole}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to update member role.');
    }
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember: TeamMemberItem = {
      id: `mem-${Date.now()}`,
      userId: `user-${Date.now()}`,
      role: inviteRole,
      status: 'ACTIVE',
      user: {
        id: `user-${Date.now()}`,
        email: inviteEmail,
        firstName: inviteName.split(' ')[0] || 'Staff',
        lastName: inviteName.split(' ').slice(1).join(' ') || 'Member',
        status: 'ACTIVE',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMembers((prev) => [newMember, ...prev]);
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteName('');
    showToast(`Staff invitation sent to ${inviteEmail}!`);
  };

  const handleToggleFingerprint = async (enabled: boolean) => {
    if (enabled && user?.email) {
      const res = await WebBiometricService.enrollPlatformAuthenticator(user.email);
      if (res.success) {
        setCapabilities((prev) => ({ ...prev, isFingerprintEnabled: true }));
        showToast('Windows Hello / Touch ID enabled on this computer!');
      }
    } else {
      WebBiometricService.setFingerprintEnabled(false);
      setCapabilities((prev) => ({ ...prev, isFingerprintEnabled: false }));
    }
  };

  const handleToggleFace = (enabled: boolean) => {
    if (enabled) {
      setIsFaceEnrollModalOpen(true);
    } else {
      WebBiometricService.setFaceEnabled(false);
      setCapabilities((prev) => ({ ...prev, isFaceEnabled: false }));
    }
  };

  const handleFaceEnrollSuccess = () => {
    setIsFaceEnrollModalOpen(false);
    WebBiometricService.setFaceEnabled(true);
    setCapabilities((prev) => ({ ...prev, isFaceEnabled: true }));
    showToast('Computer camera face recognition successfully enrolled!');
  };

  const handleClearBiometrics = () => {
    WebBiometricService.clearBiometricVault();
    setCapabilities((prev) => ({
      ...prev,
      isFingerprintEnabled: false,
      isFaceEnabled: false,
      rememberedEmail: null,
    }));
    showToast('Biometric credentials cleared from this computer.');
  };

  // Export Organization Audit
  const handleExportOrgAudit = () => {
    const data = {
      organizationName: orgName,
      tradeName,
      rcNumber,
      currency,
      contactEmail,
      contactPhone,
      officeAddress,
      settlementBank: {
        bankName,
        accountNumber,
        accountName,
        instructions: paymentInstructions,
      },
      delegation: delegationSettings,
      teamMembers: members.map((m) => ({
        name: `${m.user?.firstName} ${m.user?.lastName}`,
        email: m.user?.email,
        role: m.role,
        status: m.status,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Netify_Organization_Audit_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Organization audit file downloaded.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 999999,
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={26} color="#00A581" />
            <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: '900', color: tokens.textPrimary, margin: 0, letterSpacing: '-0.6px' }}>
              Settings &amp; Business Configuration
            </h1>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '6px' }}>
            Manage merchant identity, bank settlement accounts, team delegation, AI defaults, and biometrics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportOrgAudit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
            border: `1px solid ${tokens.surfaceBorder}`,
            color: tokens.textPrimary,
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}
        >
          <Download size={14} color="#00A581" />
          <span>Export Audit JSON</span>
        </button>
      </div>

      {/* 1. Merchant Business Profile & Identity */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="#00A581" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                Merchant Business Profile
              </h3>
            </div>
            <p style={{ color: tokens.textSecondary, fontSize: '12.5px', margin: '4px 0 0' }}>
              Official business identity displayed on debtor invoices, payment receipts, and communications.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSavingOrg}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: isSavingOrg ? 'not-allowed' : 'pointer',
            }}
          >
            {isSavingOrg ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save Profile</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Legal Business Name *
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Logistics Ltd"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Trading / Brand Name
            </label>
            <input
              type="text"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="e.g. Acme Express"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              RC / Company Registration No.
            </label>
            <input
              type="text"
              value={rcNumber}
              onChange={(e) => setRcNumber(e.target.value)}
              placeholder="e.g. RC-1889240"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Official Billing Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="billing@company.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Official Support Phone
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Physical Office Address
            </label>
            <input
              type="text"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              placeholder="Lagos, Nigeria"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Bank Settlement & Payment Remittance Details */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Banknote size={20} color="#00A581" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                Bank Settlement &amp; Operating Currency
              </h3>
            </div>
            <p style={{ color: tokens.textSecondary, fontSize: '12.5px', margin: '4px 0 0' }}>
              Bank account details automatically embedded in invoice vouchers, payment links, and WhatsApp reminders.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyBankRemittance}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isLight ? '#F1F5F9' : '#001424',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Copy size={13} color="#00A581" />
              <span>Copy Remittance</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBank}
              disabled={isSavingBank}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                border: 'none',
                cursor: isSavingBank ? 'not-allowed' : 'pointer',
              }}
            >
              {isSavingBank ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save Bank Details</span>
            </button>
          </div>
        </div>

        {/* Operating Currency Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '8px' }}>
            Base Operating Currency
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {[
              { code: 'NGN', label: '₦ NGN (Naira)' },
              { code: 'KES', label: 'KSh KES (Shilling)' },
              { code: 'GHS', label: 'GH₵ GHS (Cedi)' },
              { code: 'USD', label: '$ USD (Dollar)' },
              { code: 'ZAR', label: 'R ZAR (Rand)' },
              { code: 'GBP', label: '£ GBP (Pound)' },
            ].map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: currency === c.code ? (isLight ? '#F0FDF4' : '#00A581') : (isLight ? '#F8FAFC' : '#001D31'),
                  border: `1px solid ${currency === c.code ? '#00A581' : tokens.surfaceBorder}`,
                  color: currency === c.code ? (isLight ? '#00A581' : '#FFFFFF') : tokens.textPrimary,
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bank Form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Settlement Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Guaranty Trust Bank"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Account Number (10 Digits)
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 0123456789"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
                fontWeight: '700',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Account Holder Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Acme Enterprise Ltd"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
              Payment Remittance Instructions
            </label>
            <input
              type="text"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="Please include invoice number as payment description"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                color: tokens.textPrimary,
                fontSize: '12.5px',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Team Delegation & Staff Privacy Shield */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#00A581" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                Team Members &amp; Delegation Control
              </h3>
            </div>
            <p style={{ color: tokens.textSecondary, fontSize: '12.5px', margin: '4px 0 0' }}>
              Assign roles and configure privacy shields for field collectors and junior staff.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 32, 53, 0.8)',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textPrimary,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} color="#00A581" />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* Staff Privacy Shield Toggle */}
        <div style={{
          backgroundColor: isLight ? '#F8FAFC' : '#001D31',
          borderRadius: '10px',
          padding: '16px',
          border: `1px solid ${tokens.surfaceBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '800', color: tokens.textPrimary }}>
              <EyeOff size={16} color="#00A581" />
              <span>Staff Revenue Privacy Shield</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: tokens.textSecondary }}>
              When enabled, frontline collection staff can see their assigned debtors but cannot view total organization revenue or exposure totals.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={delegationSettings.hideRevenueFromStaff}
              onChange={(e) => handleToggleRevenueShield(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#00A581', cursor: 'pointer' }}
            />
          </label>
        </div>

        {/* Member Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isLoadingMembers ? (
            <div style={{ padding: '20px', textAlign: 'center', color: tokens.textSecondary }}>
              <Loader2 size={24} className="animate-spin text-teal-500" />
            </div>
          ) : members.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: tokens.textSecondary, fontSize: '12.5px' }}>
              No additional team members yet. Invite team members to collaborate on debt recoveries.
            </div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: tokens.textPrimary }}>
                    {m.user?.firstName} {m.user?.lastName}
                  </div>
                  <div style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
                    {m.user?.email}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : '#001424',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: tokens.textPrimary,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="STAFF">STAFF</option>
                  </select>

                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: '800',
                    backgroundColor: m.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                    color: m.status === 'ACTIVE' ? '#16A34A' : '#D97706',
                  }}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. AI Copilot & Recovery Tone Defaults */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="#00A581" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                AI Follow-up &amp; Autonomy Configuration
              </h3>
            </div>
            <p style={{ color: tokens.textSecondary, fontSize: '12.5px', margin: '4px 0 0' }}>
              Configure the default communication tone and primary outreach channels for debtor reminders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAiDefaults}
            disabled={isSavingAi}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: isSavingAi ? 'not-allowed' : 'pointer',
            }}
          >
            {isSavingAi ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save AI Defaults</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '6px' }}>
              Default Follow-up Tone
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'PROFESSIONAL', label: 'Professional' },
                { key: 'FIRM', label: 'Firm / Assertive' },
                { key: 'FRIENDLY', label: 'Friendly / Polite' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setAiTone(t.key as any)}
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: aiTone === t.key ? '#00A581' : (isLight ? '#F8FAFC' : '#001D31'),
                    color: aiTone === t.key ? '#FFFFFF' : tokens.textSecondary,
                    border: `1px solid ${aiTone === t.key ? '#00A581' : tokens.surfaceBorder}`,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '6px' }}>
              Primary Dispatch Channel
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'WHATSAPP', label: '💬 WhatsApp' },
                { key: 'SMS', label: '📱 SMS' },
                { key: 'EMAIL', label: '📬 Email' },
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setAiDefaultChannel(c.key as any)}
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: aiDefaultChannel === c.key ? '#00A581' : (isLight ? '#F8FAFC' : '#001D31'),
                    color: aiDefaultChannel === c.key ? '#FFFFFF' : tokens.textSecondary,
                    border: `1px solid ${aiDefaultChannel === c.key ? '#00A581' : tokens.surfaceBorder}`,
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Notification Engine Card */}
      <NotificationPreferencesCard />

      {/* 6. Computer Biometrics & Camera Security */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={20} color="#00A581" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                Computer Biometrics &amp; Camera Security
              </h3>
            </div>
            <p style={{ color: tokens.textSecondary, fontSize: '12.5px', margin: '4px 0 0' }}>
              Fast, password-free login using your computer&apos;s built-in fingerprint sensor and webcam.
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: tokens.accentSoft,
            border: `1px solid ${tokens.accentBorder}`,
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            color: '#00A581',
            fontWeight: '700',
          }}>
            <ShieldCheck size={13} />
            <span>FIDO2 / WebAuthn Standards</span>
          </div>
        </div>

        {/* Hardware Capabilities Diagnostic Grid */}
        <div className="responsive-split-2">
          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: capabilities.hasPlatformAuthenticator ? tokens.accentSoft : (isLight ? '#F1F5F9' : 'rgba(15, 84, 112, 0.3)'),
              border: `1px solid ${capabilities.hasPlatformAuthenticator ? '#00A581' : tokens.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Fingerprint size={18} color={capabilities.hasPlatformAuthenticator ? '#00A581' : tokens.textMuted} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>Platform Fingerprint</div>
              <div style={{ fontSize: '11.5px', color: capabilities.hasPlatformAuthenticator ? '#00A581' : tokens.textMuted }}>
                {capabilities.hasPlatformAuthenticator ? 'Windows Hello / Touch ID Ready' : 'Hardware Standby'}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: capabilities.hasWebcam ? tokens.accentSoft : (isLight ? '#F1F5F9' : 'rgba(15, 84, 112, 0.3)'),
              border: `1px solid ${capabilities.hasWebcam ? '#00A581' : tokens.surfaceBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Camera size={18} color={capabilities.hasWebcam ? '#00A581' : tokens.textMuted} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>Computer Camera</div>
              <div style={{ fontSize: '11.5px', color: capabilities.hasWebcam ? '#00A581' : tokens.textMuted }}>
                {capabilities.hasWebcam ? 'Webcam Ready for Face ID' : 'Webcam Standby'}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Fingerprint Toggle */}
          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px 16px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: tokens.textPrimary }}>
                Windows Hello / Touch ID Fingerprint Sign-In
              </div>
              <div style={{ fontSize: '11.5px', color: tokens.textMuted, marginTop: '2px' }}>
                Authenticate with your computer&apos;s fingerprint scanner instead of typing passwords.
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={capabilities.isFingerprintEnabled}
                onChange={(e) => handleToggleFingerprint(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#00A581', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Camera Face ID Toggle */}
          <div style={{
            backgroundColor: isLight ? '#F8FAFC' : '#001D31',
            borderRadius: '10px',
            padding: '14px 16px',
            border: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: tokens.textPrimary }}>
                Camera Facial Recognition Sign-In
              </div>
              <div style={{ fontSize: '11.5px', color: tokens.textMuted, marginTop: '2px' }}>
                Scan your face using your webcam to securely unlock your workspace.
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={capabilities.isFaceEnabled}
                onChange={(e) => handleToggleFace(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#00A581', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {/* Clear Credentials Action */}
        {(capabilities.isFingerprintEnabled || capabilities.isFaceEnabled) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClearBiometrics}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'transparent',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} />
              <span>Clear Biometrics on This Computer</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. Appearance & Multi-Language Preferences */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} color="#00A581" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
              Appearance &amp; Multi-Language Preferences
            </h3>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '12.5px', margin: '4px 0 0' }}>
            Customize your visual theme and regional African language interface.
          </p>
        </div>

        {/* Theme Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '8px' }}>
            Color Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { key: 'system', label: 'System', icon: Monitor },
              { key: 'light', label: 'Light', icon: Sun },
              { key: 'dark', label: 'Dark', icon: Moon },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: theme === t.key ? '#00A581' : (isLight ? '#F8FAFC' : '#001D31'),
                    color: theme === t.key ? '#FFFFFF' : tokens.textPrimary,
                    border: `1px solid ${theme === t.key ? '#00A581' : tokens.surfaceBorder}`,
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Language Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary }}>
              Interface Language &amp; African Dialect
            </label>
            <button
              type="button"
              onClick={openLanguageModal}
              style={{ fontSize: '11.5px', color: '#00A581', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
            >
              Open Dialect Switcher →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: currentLanguage === lang.code ? '#00A581' : (isLight ? '#F8FAFC' : '#001D31'),
                  color: currentLanguage === lang.code ? '#FFFFFF' : tokens.textPrimary,
                  border: `1px solid ${currentLanguage === lang.code ? '#00A581' : tokens.surfaceBorder}`,
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{lang.nativeName}</span>
                {currentLanguage === lang.code && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            CONNECTED AI AGENTS & DELEGATED WEBMCP ACCESS
           ========================================================================= */}
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
          gridColumn: '1 / -1',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#10A37F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                  Connected AI Agents &amp; Delegated WebMCP Access
                </h3>
                <p style={{ fontSize: '12.5px', color: tokens.textSecondary, margin: '2px 0 0' }}>
                  External autonomous agents (ChatGPT, Claude, Gemini) authorized to access workspace tools via OAuth 2.0 PKCE.
                </p>
              </div>
            </div>

            <a
              href="/oauth/authorize?client_id=chatgpt-agent&redirect_uri=https://chatgpt.com/api/v1/auth/callback&response_type=code&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-lift tap-press"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0, 165, 129, 0.3)',
              }}
            >
              <Plus size={13} />
              <span>Authorize New Agent</span>
            </a>
          </div>

          {/* Connected Agents List */}
          {isLoadingGrants ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '8px' }}>
              <Loader2 size={18} className="animate-spin text-teal-500" />
              <span style={{ fontSize: '12.5px', color: tokens.textSecondary }}>Loading authorized agents...</span>
            </div>
          ) : agentGrants.length === 0 ? (
            <div style={{
              padding: '24px',
              borderRadius: '12px',
              border: `1px dashed ${tokens.surfaceBorder}`,
              textAlign: 'center',
              backgroundColor: isLight ? '#F8FAFC' : '#001524',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: tokens.textPrimary, fontWeight: '700' }}>
                No external AI agents currently connected
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: tokens.textSecondary }}>
                When an AI assistant (like ChatGPT Agent) requests access, you will be asked to review and approve scopes.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agentGrants.map((grant) => {
                const isActive = grant.status === 'ACTIVE';
                const isRevoking = revokingGrantId === grant.id;

                return (
                  <div
                    key={grant.id}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      backgroundColor: isLight ? '#FFFFFF' : '#001A2C',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '260px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: isActive
                          ? isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)'
                          : isLight ? '#F1F5F9' : '#00111E',
                        color: isActive ? '#10B981' : tokens.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Bot size={18} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: tokens.textPrimary }}>
                            {grant.clientName || grant.clientId}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: isActive
                              ? isLight ? '#DEF7EC' : 'rgba(16, 185, 129, 0.2)'
                              : isLight ? '#FDE8E8' : 'rgba(239, 68, 68, 0.2)',
                            color: isActive ? '#03543F' : '#9B1C1C',
                          }}>
                            {grant.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: tokens.textSecondary, marginTop: '3px', flexWrap: 'wrap' }}>
                          <span>Workspace: <strong style={{ color: tokens.textPrimary }}>{grant.tenantName || 'FuelOS'}</strong></span>
                          <span>•</span>
                          <span>Expires: {new Date(grant.expiresAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Authorized by: {grant.userName}</span>
                        </div>

                        {/* Scopes Badges */}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {(grant.scopes || []).map((scope: string) => {
                            const isWrite = scope.includes(':write');
                            return (
                              <span
                                key={scope}
                                style={{
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  backgroundColor: isWrite
                                    ? isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.18)'
                                    : isLight ? '#F1F5F9' : '#00111E',
                                  color: isWrite
                                    ? isLight ? '#B45309' : '#FCD34D'
                                    : tokens.textSecondary,
                                  border: `1px solid ${tokens.surfaceBorder}`,
                                }}
                              >
                                {scope}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Revoke Action Button */}
                    <div>
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeGrant(grant.id)}
                          disabled={isRevoking}
                          className="hover-lift tap-press"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
                            color: '#EF4444',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: isRevoking ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isRevoking ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          <span>{isRevoking ? 'Revoking...' : 'Revoke Access'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: tokens.textSecondary, fontStyle: 'italic' }}>
                          Revoked on {grant.revokedAt ? new Date(grant.revokedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Staff Invite Modal */}
      {isInviteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 14, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              borderRadius: '16px',
              border: `1px solid ${tokens.surfaceBorder}`,
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: tokens.textPrimary }}>
              Invite Team Member
            </h3>

            <form onSubmit={handleInviteStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '4px' }}>
                  Access Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#F8FAFC' : '#001424',
                    color: tokens.textPrimary,
                    fontSize: '13px',
                  }}
                >
                  <option value="STAFF">STAFF (Field Collector / Limited View)</option>
                  <option value="MANAGER">MANAGER (Operations Lead)</option>
                  <option value="ADMIN">ADMIN (Full Business Management)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: 'transparent',
                    color: tokens.textSecondary,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#00A581',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Enroll Modal */}
      {isFaceEnrollModalOpen && (
        <WebFaceRecognitionScanner
          isOpen={isFaceEnrollModalOpen}
          isEnrollment={true}
          onClose={() => setIsFaceEnrollModalOpen(false)}
          onSuccess={handleFaceEnrollSuccess}
          title="Enroll Computer Camera Face Recognition"
        />
      )}
    </div>
  );
}
