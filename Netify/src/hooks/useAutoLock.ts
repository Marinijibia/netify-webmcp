import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/auth-store';

/**
 * Monitors app state transitions (active <-> background/inactive)
 * and automatically engages the AppLockOverlay when the configured
 * background inactivity timeout has elapsed.
 */
export function useAutoLock() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLocked = useAuthStore((state) => state.isLocked);
  const autoLockTimeoutMs = useAuthStore((state) => state.autoLockTimeoutMs);
  const lastActiveTimestamp = useAuthStore((state) => state.lastActiveTimestamp);
  const setLocked = useAuthStore((state) => state.setLocked);
  const recordActiveTimestamp = useAuthStore((state) => state.recordActiveTimestamp);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // 1. Transitioning away from foreground (app minimized or phone locked)
      if (
        appState.current === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        recordActiveTimestamp();
      }

      // 2. Returning to foreground
      if (
        (appState.current === 'inactive' || appState.current === 'background') &&
        nextAppState === 'active'
      ) {
        if (isAuthenticated && !isLocked) {
          const elapsed = Date.now() - lastActiveTimestamp;
          if (elapsed >= autoLockTimeoutMs) {
            setLocked(true);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [
    isAuthenticated,
    isLocked,
    autoLockTimeoutMs,
    lastActiveTimestamp,
    setLocked,
    recordActiveTimestamp,
  ]);
}
