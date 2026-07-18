import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web effective color scheme. Same contract as native `use-color-scheme`, plus a hydration guard
 * (return 'light' until the client hydrates) so a static/SSR render re-computes the scheme on the
 * client without a mismatch. The in-app `themeMode` override joins at B.8.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const system = useRNColorScheme();
  if (!hasHydrated) return 'light';
  return system === 'dark' ? 'dark' : 'light';
}
