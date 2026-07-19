import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DEV_SEED, isEmptyStore, seededStore } from '@/data/devSeed';
import { appStore } from '@/store/appStore';
import { bootstrapPersistence } from '@/store/persistence';
import { createStorageAdapter } from '@/storage/createAdapter';
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
 * Root layout — B.1 shell: providers + Stack only.
 *
 * Deferred: the onboarding route-guard (`Stack.Protected` on `isComplete`) → B.2; the Sentry wrap
 * + MMKV-persistence / iCloud-restore / notifications bootstrap → B.8 native re-glue.
 */
export default function RootLayout() {
  const scheme = useColorScheme();

  // B.2: hydrate the store from durable storage + start auto-save. (Full bootstrap — splash gate,
  // storage-locked/retry, native lifecycle — lands at B.9; the onboarding route-guard at B.3.)
  useEffect(() => {
    void bootstrapPersistence(createStorageAdapter()).then(() => {
      // DEV seed for the store→engine→UI proof until onboarding (B.3) exists. Remove when DEV_SEED off.
      if (DEV_SEED && isEmptyStore(appStore.getState().store)) {
        appStore.getState().importStore(seededStore());
      }
    });
  }, []);

  return (
    <ThemeProvider value={navTheme(scheme)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="more" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
