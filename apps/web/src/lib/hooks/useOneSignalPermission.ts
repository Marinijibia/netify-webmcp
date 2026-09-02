'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getPushPermissionState,
  promptForPushPermission,
} from '@/lib/push/onesignal';

export type PushPermission = 'granted' | 'denied' | 'default' | 'loading';

export function useOneSignalPermission() {
  const [permission, setPermission] = useState<PushPermission>('loading');
  const [isRequesting, setIsRequesting] = useState(false);

  const refresh = useCallback(async () => {
    const state = await getPushPermissionState();
    setPermission(state);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const granted = await promptForPushPermission();
      setPermission(granted ? 'granted' : 'denied');
      return granted;
    } catch {
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return {
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    isLoading: permission === 'loading',
    isRequesting,
    requestPermission,
    refresh,
  };
}
