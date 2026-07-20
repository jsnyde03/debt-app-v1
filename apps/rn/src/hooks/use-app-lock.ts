import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { authenticate } from '@/lib/app-lock';
import { useAppStore } from '@/store/useAppStore';

/**
 * Biometric App Lock state (B.9). Locks at launch and re-locks whenever the app leaves the
 * foreground (so a peek in the app switcher stays covered); prompts to unlock when it becomes locked.
 * Fail-open: `authenticate` returns true on devices/web without biometrics, so the gate never traps
 * the user out. Exposes `isLocked` (only true while the pref is on) + a manual `tryUnlock` retry.
 */
export function useAppLock(): { isLocked: boolean; tryUnlock: () => void; authing: boolean } {
  const enabled = useAppStore((s) => s.store.prefs.appLockEnabled);
  const [isLocked, setIsLocked] = useState(enabled);
  const [authing, setAuthing] = useState(false);

  const tryUnlock = useCallback(() => {
    setAuthing((busy) => {
      if (busy) return busy;
      void authenticate()
        .then((ok) => {
          if (ok) setIsLocked(false);
        })
        .finally(() => setAuthing(false));
      return true;
    });
  }, []);

  // Disabling the pref unlocks immediately.
  useEffect(() => {
    if (!enabled) setIsLocked(false);
  }, [enabled]);

  // Re-lock when the app backgrounds (guarded — a lifecycle-handler throw must never crash the app).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      try {
        if (enabled && (next === 'background' || next === 'inactive')) setIsLocked(true);
      } catch {
        /* never crash on a lifecycle event */
      }
    });
    return () => sub.remove();
  }, [enabled]);

  // Auto-prompt whenever we become locked (launch / return-to-foreground).
  useEffect(() => {
    if (enabled && isLocked) tryUnlock();
    // tryUnlock is stable but excluded to avoid re-prompting on its identity; we want to fire only
    // on the locked-transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isLocked]);

  return { isLocked: enabled && isLocked, tryUnlock, authing };
}
