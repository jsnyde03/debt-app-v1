import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

/**
 * Web effective color scheme. Same contract as native, plus a hydration guard (return 'light' until
 * the client hydrates) so a static/SSR render re-computes on the client without a mismatch.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const system = useRNColorScheme();
  const mode = useAppStore((s) => s.store.prefs.themeMode);

  if (!hasHydrated) return 'light';
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}
