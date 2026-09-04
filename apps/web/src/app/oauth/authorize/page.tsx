'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { 
  Bot, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Check, 
  Building, 
  User, 
  Calendar, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  REGISTERED_CLIENTS, 
  SUPPORTED_SCOPES, 
  ScopeDefinition 
} from '@/lib/oauth/store';

function AuthorizeConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, organization, isAuthenticated, login } = useAuth();
  const { tokens, isLight } = useTheme();

  // Extract OAuth 2.0 query parameters
  const clientId = searchParams.get('client_id') || 'chatgpt-agent';
  const redirectUri = searchParams.get('redirect_uri') || 'https://chatgpt.com/api/v1/auth/callback';
  const responseType = searchParams.get('response_type') || 'code';
  const requestedScopeStr = searchParams.get('scope') || 'receivables:read customers:read customer_evidence:read business_memory:read collection_messages:draft';
  const state = searchParams.get('state') || '';
  const codeChallenge = searchParams.get('code_challenge') || 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  const codeChallengeMethod = (searchParams.get('code_challenge_method') || 'S256') as 'S256' | 'plain';

  // Client Details
  const client = REGISTERED_CLIENTS[clientId] || {
    id: 'unknown',
    clientId,
    name: clientId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: 'External autonomous agent requesting delegated WebMCP access',
    isTrusted: false,
    status: 'ACTIVE',
  };

  // State
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(organization?.id || 'demo-org-fuelos');
  const [workspaceName, setWorkspaceName] = useState<string>(organization?.name || 'FuelOS');
  const [selectedDuration, setSelectedDuration] = useState<string>('24 hours');
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // In-place login state for unauthenticated users / judges
  const [loginEmail, setLoginEmail] = useState('merchant@netify.ng');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Scopes selection state
  const requestedScopesList = requestedScopeStr.split(/[,\s]+/).filter(Boolean);
  const [selectedScopes, setSelectedScopes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(SUPPORTED_SCOPES).forEach((s) => {
      // Default to true if requested by agent, but exclude write scopes unless explicitly asked
      const isRequested = requestedScopesList.includes(s);
      const isWrite = SUPPORTED_SCOPES[s].category === 'WRITE';
      initial[s] = isRequested && !isWrite ? true : isRequested;
    });
    return initial;
  });

  useEffect(() => {
    if (organization?.name) {
      setWorkspaceName(organization.name);
      setSelectedWorkspace(organization.id);
    }
  }, [organization]);

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) => ({
      ...prev,
      [scopeId]: !prev[scopeId],
    }));
  };

  // Handle Login
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    try {
      const url = new URL(redirectUri);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('error_description', 'The user denied the delegated authorization request');
      if (state) url.searchParams.set('state', state);
      window.location.href = url.toString();
    } catch {
      router.push('/');
    }
  };

  // Handle Authorize
  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setErrorMsg(null);

    const approvedScopes = Object.entries(selectedScopes)
      .filter(([_, approved]) => approved)
      .map(([scope]) => scope);

    if (approvedScopes.length === 0) {
      setErrorMsg('Please select at least one permission to grant.');
      setIsAuthorizing(false);
      return;
    }

    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          userId: user?.id || 'demo-user-umar',
          tenantId: selectedWorkspace,
          redirectUri,
          scopes: approvedScopes,
          duration: selectedDuration,
          codeChallenge,
          codeChallengeMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.code) {
        throw new Error(data.error_description || 'Authorization failed');
      }

      // Redirect back to agent callback with code and state
      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set('code', data.code);
      if (state) callbackUrl.searchParams.set('state', state);

      window.location.href = callbackUrl.toString();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete authorization');
      setIsAuthorizing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: isLight ? '#F8FAFC' : '#00111E',
      color: tokens.textPrimary,
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.surfaceBorder}`,
        borderRadius: '24px',
        boxShadow: isLight ? '0 12px 36px rgba(0,0,0,0.08)' : '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Top Branding Banner */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: `1px solid ${tokens.surfaceBorder}`,
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 37, 27, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#00A581',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '900',
              fontSize: '18px',
            }}>
              N
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: tokens.textPrimary, letterSpacing: '-0.3px' }}>
                Netify Connect
              </div>
              <div style={{ fontSize: '11.5px', color: tokens.textSecondary }}>
                Delegated WebMCP Agent Authorization
              </div>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '11px',
            fontWeight: '700',
            color: '#10B981',
          }}>
            <Lock size={11} />
            <span>OAuth 2.0 PKCE</span>
          </div>
        </div>

        {/* Unauthenticated View: In-place login */}
        {!isAuthenticated && (
          <div style={{ padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: isLight ? '#EFF6FF' : 'rgba(59, 130, 246, 0.15)',
                color: '#3B82F6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}>
                <User size={24} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px', color: tokens.textPrimary }}>
                Sign in to authorize {client.name}
              </h2>
              <p style={{ fontSize: '12.5px', color: tokens.textSecondary, margin: 0 }}>
                Please authenticate with your Netify merchant account to delegate workspace access.
              </p>
            </div>

            {loginError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '12.5px',
                marginBottom: '16px',
              }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleInlineLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Merchant Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#FFFFFF' : '#001A2C',
                    color: tokens.textPrimary,
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: tokens.textSecondary, marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    backgroundColor: isLight ? '#FFFFFF' : '#001A2C',
                    color: tokens.textPrimary,
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                color: isLight ? '#B45309' : '#FCD34D',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <span>💡 Demo Judge Account: merchant@netify.ng / Password123!</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('merchant@netify.ng');
                    setLoginPassword('Password123!');
                  }}
                  style={{
                    backgroundColor: '#00A581',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Fill Demo Credentials
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="hover-lift tap-press"
                style={{
                  width: '100%',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  padding: '11px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
                }}
              >
                {isLoggingIn ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{isLoggingIn ? 'Signing In...' : 'Sign In & Review Consent'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Authenticated Consent View */}
        {isAuthenticated && (
          <div style={{ padding: '24px 28px' }}>
            {/* Requesting Agent Hero */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.6)',
              border: '1px solid rgba(0, 165, 129, 0.3)',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#10A37F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
              }}>
                <Bot size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 2px', color: tokens.textPrimary }}>
                  {client.name}
                </h3>
                <p style={{ fontSize: '12px', color: tokens.textSecondary, margin: 0 }}>
                  wants to access your Netify workspace via WebMCP.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '12.5px',
                marginBottom: '16px',
              }}>
                {errorMsg}
              </div>
            )}

            {/* Account & Workspace Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {/* Account Card */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#FFFFFF' : '#001A2C',
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textSecondary, textTransform: 'uppercase' }}>
                  Account
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <User size={15} color="#00A581" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: tokens.textPrimary }}>
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Umar Abdullahi'}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: tokens.textSecondary, display: 'block', marginTop: '2px' }}>
                  {user?.email || 'merchant@netify.ng'}
                </span>
              </div>

              {/* Workspace Picker */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: `1px solid ${tokens.surfaceBorder}`,
                backgroundColor: isLight ? '#FFFFFF' : '#001A2C',
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: tokens.textSecondary, textTransform: 'uppercase' }}>
                  Workspace (Tenant)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Building size={15} color="#00A581" />
                  <select
                    value={selectedWorkspace}
                    onChange={(e) => {
                      setSelectedWorkspace(e.target.value);
                      setWorkspaceName(e.target.options[e.target.selectedIndex].text);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: tokens.textPrimary,
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <option value={organization?.id || 'demo-org-fuelos'} style={{ backgroundColor: isLight ? '#FFF' : '#001A2C' }}>
                      {organization?.name || 'FuelOS'}
                    </option>
                    <option value="org-kano-distribution" style={{ backgroundColor: isLight ? '#FFF' : '#001A2C' }}>
                      Kano Distribution Hub
                    </option>
                  </select>
                </div>
                <span style={{ fontSize: '11px', color: '#10B981', display: 'block', marginTop: '2px' }}>
                  🔒 Strict Tenant Isolation Active
                </span>
              </div>
            </div>

            {/* Granular Scopes Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: tokens.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Requested Permissions
                </span>
                <span style={{ fontSize: '11px', color: tokens.textSecondary }}>
                  Select allowed capabilities
                </span>
              </div>

              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '12px',
                padding: '8px 12px',
                backgroundColor: isLight ? '#FFFFFF' : '#001524',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {Object.values(SUPPORTED_SCOPES).map((scope) => {
                  const isChecked = !!selectedScopes[scope.id];
                  const isWrite = scope.category === 'WRITE';

                  return (
                    <label
                      key={scope.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: isChecked
                          ? isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.4)'
                          : 'transparent',
                        border: isChecked
                          ? '1px solid rgba(0, 165, 129, 0.3)'
                          : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleScope(scope.id)}
                        style={{ marginTop: '3px', accentColor: '#00A581', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: tokens.textPrimary }}>
                            {scope.name}
                          </span>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: '700',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: isWrite
                              ? isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)'
                              : isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.15)',
                            color: isWrite
                              ? isLight ? '#B45309' : '#FCD34D'
                              : isLight ? '#0284C7' : '#38BDF8',
                          }}>
                            {scope.category}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.textSecondary }}>
                          {scope.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: tokens.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Access Duration
                </span>
                <span style={{ fontSize: '11px', color: tokens.textSecondary }}>
                  Expires automatically
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '6px',
              }}>
                {['This session', '1 hour', '24 hours', '7 days', '30 days'].map((dur) => {
                  const isSelected = selectedDuration === dur;
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setSelectedDuration(dur)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: isSelected ? '800' : '600',
                        border: isSelected ? '1.5px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                        backgroundColor: isSelected
                          ? isLight ? '#ECFDF5' : 'rgba(0, 165, 129, 0.2)'
                          : isLight ? '#FFFFFF' : '#001A2C',
                        color: isSelected ? '#00A581' : tokens.textSecondary,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {dur}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security Guarantee Tag */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#EFF6FF' : 'rgba(30, 58, 138, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '24px',
              fontSize: '11.5px',
              color: isLight ? '#1E40AF' : '#93C5FD',
            }}>
              <ShieldCheck size={16} color="#3B82F6" />
              <span>Netify passwords are never shared. Scopes are enforced server-side.</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isAuthorizing}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backgroundColor: 'transparent',
                  color: tokens.textSecondary,
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: isAuthorizing ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                className="hover-lift tap-press"
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#00A581',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  cursor: isAuthorizing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 165, 129, 0.4)',
                }}
              >
                {isAuthorizing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>{isAuthorizing ? 'Authorizing Agent...' : `Authorize ${client.name}`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthorizeConsentPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '8px' }}>
        <Loader2 size={24} className="animate-spin text-teal-500" />
        <span>Loading authorization consent...</span>
      </div>
    }>
      <AuthorizeConsentContent />
    </Suspense>
  );
}
