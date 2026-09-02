'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Mail, 
  Smartphone, 
  Moon, 
  Clock, 
  ShieldAlert, 
  DollarSign, 
  Handshake, 
  Sparkles, 
  Check, 
  Loader2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { notificationApi, NotificationPreferences } from '@/lib/api';
import { useOneSignalPermission } from '@/lib/hooks/useOneSignalPermission';

export function NotificationPreferencesCard() {
  const { tokens, isLight } = useTheme();
  const { permission, isGranted, isRequesting, requestPermission } = useOneSignalPermission();

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    soundEnabled: true,
    emailAlertsEnabled: true,
    pushAlertsEnabled: true,
    urgentRiskAlerts: true,
    paymentConfirmations: true,
    commitmentReminders: true,
    aiCopilotBriefings: true,
    quietHoursEnabled: false,
    quietHoursStart: '20:00',
    quietHoursEnd: '08:00',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play test chime
  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(587.33, now, 0.35);        // D5
      playTone(880.00, now + 0.08, 0.45); // A5
    } catch {
      // ignore
    }
  };

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getPreferences();
      if (data) {
        setPrefs((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Failed to load notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleToggle = async (key: keyof NotificationPreferences, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setIsSaving(true);

    try {
      await notificationApi.updatePreferences({ [key]: value });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    } catch (err) {
      console.warn('Failed to save notification preference:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    const granted = await requestPermission();
    if (granted) {
      handleToggle('pushAlertsEnabled', true);
    }
  };

  const sectionCardStyle = {
    backgroundColor: tokens.surface,
    borderRadius: '12px',
    border: `1px solid ${tokens.surfaceBorder}`,
    boxShadow: isLight ? tokens.shadowCard : 'none',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    transition: 'all 0.2s ease',
  };

  const itemBoxStyle = {
    padding: '14px 16px',
    borderRadius: '10px',
    backgroundColor: isLight ? '#F8FAFC' : '#001D31',
    border: `1px solid ${tokens.surfaceBorder}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  };

  return (
    <div id="notifications" style={sectionCardStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="#00A581" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
              Notification & Alert Channels
            </h3>
          </div>
          <p style={{ color: tokens.textMuted, fontSize: '12.5px', margin: '4px 0 0' }}>
            Configure how and when Netify alerts you about debtor risks, payments, and collection promises.
          </p>
        </div>

        {saveToast && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isLight ? '#ECFDF5' : 'rgba(0, 165, 129, 0.2)',
            border: '1px solid #00A581',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            color: '#00A581',
            fontWeight: '700',
          }}>
            <Check size={12} />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
          <Loader2 size={24} className="animate-spin text-teal-500" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Primary Channels Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            
            {/* 1. Browser Web Push (OneSignal) */}
            <div style={{
              ...itemBoxStyle,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={17} color="#00A581" />
                  <span style={{ fontWeight: '700', fontSize: '13px', color: tokens.textPrimary }}>
                    Browser Web Push
                  </span>
                </div>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: isGranted
                    ? (isLight ? '#ECFDF5' : 'rgba(0, 165, 129, 0.2)')
                    : (isLight ? '#F1F5F9' : '#003051'),
                  color: isGranted ? '#00A581' : tokens.textMuted,
                  border: isGranted ? '1px solid rgba(0, 165, 129, 0.4)' : 'none',
                }}>
                  {isGranted ? 'Enabled' : permission === 'denied' ? 'Blocked in Browser' : 'Not Prompted'}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: tokens.textMuted, margin: 0, lineHeight: 1.4 }}>
                Instant desktop alerts via OneSignal when browser or tab is closed.
              </p>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                {!isGranted ? (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={isRequesting || permission === 'denied'}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#00A581',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: isRequesting || permission === 'denied' ? 'not-allowed' : 'pointer',
                      opacity: permission === 'denied' ? 0.6 : 1,
                    }}
                  >
                    {isRequesting ? 'Prompting...' : 'Allow Browser Push'}
                  </button>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: tokens.textPrimary }}>
                    <input
                      type="checkbox"
                      checked={prefs.pushAlertsEnabled !== false}
                      onChange={(e) => handleToggle('pushAlertsEnabled', e.target.checked)}
                      style={{ accentColor: '#00A581', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>Active for this device</span>
                  </label>
                )}
              </div>
            </div>

            {/* 2. Audio Chime */}
            <div style={{
              ...itemBoxStyle,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {prefs.soundEnabled ? <Volume2 size={17} color="#00A581" /> : <VolumeX size={17} color={tokens.textMuted} />}
                  <span style={{ fontWeight: '700', fontSize: '13px', color: tokens.textPrimary }}>
                    Audio Chime
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.soundEnabled !== false}
                    onChange={(e) => handleToggle('soundEnabled', e.target.checked)}
                    style={{ accentColor: '#00A581', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '11.5px', color: tokens.textMuted, margin: 0, lineHeight: 1.4 }}>
                Plays a pleasant dual-tone harmonic chime on high & medium priority business signals.
              </p>
              <button
                type="button"
                onClick={playTestChime}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: isLight ? '#F1F5F9' : '#003051',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textSecondary,
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                <Play size={10} />
                <span>Test Sound</span>
              </button>
            </div>

            {/* 3. Transactional Email Alerts */}
            <div style={{
              ...itemBoxStyle,
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={17} color="#00A581" />
                  <span style={{ fontWeight: '700', fontSize: '13px', color: tokens.textPrimary }}>
                    Email Alerts (Resend)
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.emailAlertsEnabled !== false}
                    onChange={(e) => handleToggle('emailAlertsEnabled', e.target.checked)}
                    style={{ accentColor: '#00A581', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '11.5px', color: tokens.textMuted, margin: 0, lineHeight: 1.4 }}>
                Branded email summaries for critical collections escalations and payment receipts.
              </p>
            </div>
          </div>

          {/* Category Granular Matrix */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: tokens.textPrimary, margin: '12px 0 8px' }}>
              Subscribed Event Categories
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
              {[
                { key: 'urgentRiskAlerts', label: 'Overdue & Missed Promises', icon: ShieldAlert, color: '#EF4444' },
                { key: 'paymentConfirmations', label: 'Payment Confirmations', icon: DollarSign, color: '#10B981' },
                { key: 'commitmentReminders', label: 'Promise Due Reminders', icon: Handshake, color: '#F59E0B' },
                { key: 'aiCopilotBriefings', label: 'AI Copilot Signal Briefings', icon: Sparkles, color: '#8B5CF6' },
              ].map((cat) => {
                const Icon = cat.icon;
                const isChecked = (prefs as any)[cat.key] !== false;

                return (
                  <label
                    key={cat.key}
                    style={{
                      ...itemBoxStyle,
                      padding: '10px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={15} color={cat.color} />
                      <span style={{ fontSize: '12.5px', fontWeight: '600', color: tokens.textPrimary }}>
                        {cat.label}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleToggle(cat.key as any, e.target.checked)}
                      style={{ accentColor: '#00A581', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours Configuration */}
          <div style={{
            ...itemBoxStyle,
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '12px',
            marginTop: '4px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Moon size={17} color="#F59E0B" />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: tokens.textPrimary }}>
                    Quiet Hours (Do Not Disturb)
                  </div>
                  <div style={{ fontSize: '11.5px', color: tokens.textMuted }}>
                    Silences external push & email alerts during selected hours (in-app notifications are still saved).
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.quietHoursEnabled === true}
                  onChange={(e) => handleToggle('quietHoursEnabled', e.target.checked)}
                  style={{ accentColor: '#00A581', width: '15px', height: '15px', cursor: 'pointer' }}
                />
              </label>
            </div>

            {prefs.quietHoursEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color={tokens.textMuted} />
                  <span style={{ fontSize: '12px', color: tokens.textSecondary }}>From:</span>
                  <input
                    type="time"
                    value={prefs.quietHoursStart || '20:00'}
                    onChange={(e) => handleToggle('quietHoursStart', e.target.value)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      backgroundColor: isLight ? '#FFFFFF' : '#00192B',
                      color: tokens.textPrimary,
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: tokens.textSecondary }}>To:</span>
                  <input
                    type="time"
                    value={prefs.quietHoursEnd || '08:00'}
                    onChange={(e) => handleToggle('quietHoursEnd', e.target.value)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      backgroundColor: isLight ? '#FFFFFF' : '#00192B',
                      color: tokens.textPrimary,
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
