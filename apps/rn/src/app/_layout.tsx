import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { createStorageAdapter } from '@/storage/createAdapter';
import { bootstrapPersistence } from '@/store/persistence';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/colors';

/** React-Navigation theme mapped to Debt's palette so route transitions never flash white. */
function navTheme(scheme: 'light' | 'dark') {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background.primary[scheme],
      card: colors.background.secondary[scheme],
      text: colors.text.primary[scheme],
      border: colors.border.subtle[scheme],
      primary: colors.accent.primary[scheme],
    },
  };
}

/**
 * Root layout — providers + the guarded Stack.
 *
 * The route-guard (B.3) routes on the PERSISTED `onboardingComplete` flag: onboarding until it's set,
 * the tabs after. Deferred: the full bootstrap — splash gate, storage-locked/retry, native lifecycle
 * — lands at B.9. (`bootstrapPersistence` hydrates + starts autosave now.)
 */
export default function RootLayout() {
  const scheme = useColorScheme();
  const isHydrated = useAppStore((s) => s.isHydrated);
  const onboardingComplete = useAppStore((s) => s.store.prefs.onboardingComplete);

  useEffect(() => {
    void bootstrapPersistence(createStorageAdapter());
  }, []);

  // Render nothing until hydrate resolves, so a returning user never flashes onboarding. (On native
  // the splash still covers this; a themed splash/retry surface lands at B.9.)
  if (!isHydrated) return null;

  return (
    <ThemeProvider value={navTheme(scheme)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={onboardingComplete}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="more" />
          <Stack.Screen name="history" />
          <Stack.Screen name="living-expenses" />
        </Stack.Protected>
        <Stack.Protected guard={!onboardingComplete}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
