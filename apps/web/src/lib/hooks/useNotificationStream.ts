'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { notificationApi, AppNotification } from '@/lib/api';
import { WebStorageService } from '@/lib/api/storage';

export interface StreamEventData {
  type: 'NOTIFICATION_CREATED' | 'NOTIFICATION_READ' | 'ALL_READ' | 'NOTIFICATION_DELETED' | 'BULK_ACTION';
  payload: any;
  timestamp: string;
}

interface UseNotificationStreamOptions {
  soundEnabled?: boolean;
  onNewNotification?: (notif: AppNotification) => void;
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play a soft, pleasant, enterprise-grade chime using Web Audio API
  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
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
      // Audio playback silently skipped if not permitted by user gesture
    }
  }, []);

  // Fetch initial unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const token = WebStorageService.getAccessToken();
    if (!token) return;

    // Refresh immediately when user returns to this tab
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshUnreadCount();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);
    }

    // Periodic heartbeat / smart polling fallback (every 25s) to guarantee count sync
    const interval = setInterval(refreshUnreadCount, 25000);

    // Setup SSE connection if supported
    let eventSource: EventSource | null = null;
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');
      const sseUrl = `${apiBase}/notifications/stream?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const data: StreamEventData = JSON.parse(event.data);
          if (data.type === 'NOTIFICATION_CREATED') {
            const notif: AppNotification = data.payload?.notification;
            if (data.payload?.unreadCount !== undefined) {
              setUnreadCount(data.payload.unreadCount);
            } else {
              setUnreadCount((prev) => prev + 1);
            }

            if (notif) {
              setLatestNotification(notif);
              if (options.soundEnabled !== false && notif.priority !== 'LOW') {
                playChime();
              }
              options.onNewNotification?.(notif);
            }
          } else if (data.type === 'NOTIFICATION_READ' || data.type === 'NOTIFICATION_DELETED' || data.type === 'BULK_ACTION') {
            if (data.payload?.unreadCount !== undefined) {
              setUnreadCount(data.payload.unreadCount);
            } else {
              refreshUnreadCount();
            }
          } else if (data.type === 'ALL_READ') {
            setUnreadCount(0);
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        // EventSource will automatically retry; fallback polling continues
      };
    } catch {
      // SSE not available, standard polling covers it
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [refreshUnreadCount, playChime, options]);

  return {
    unreadCount,
    setUnreadCount,
    latestNotification,
    refreshUnreadCount,
    playChime,
  };
}
