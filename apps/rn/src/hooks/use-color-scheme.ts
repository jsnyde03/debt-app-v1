import { useColorScheme as useRNColorScheme } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

/**
 * The app's effective color scheme. Respects the in-app appearance override
 * (`prefs.themeMode`: 'light'/'dark' force it, 'system' follows the OS). Single source for the whole
 * app — screens via `useAppColors`, and the root `_layout` nav theme.
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme();
  const mode = useAppStore((s) => s.store.prefs.themeMode);
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}
