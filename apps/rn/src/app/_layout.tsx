import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppLockGate } from '@/components/AppLockGate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotificationSync } from '@/hooks/use-notification-sync';
import { createStorageAdapter } from '@/storage/createAdapter';
import { bootstrapPersistence, flushPendingSave } from '@/store/persistence';
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
  useNotificationSync();

  useEffect(() => {
    void bootstrapPersistence(createStorageAdapter());
    // Persist any pending debounced write when the app leaves the foreground, so a
    // background/terminate never drops the last change. Wrapped defensively — a listener throw must
    // never crash the app (the platform-split lifecycle-handler lesson).
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        try {
          flushPendingSave();
        } catch {
          /* best-effort flush */
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Render nothing until hydrate resolves, so a returning user never flashes onboarding. (On native
  // the splash still covers this; a themed splash/retry surface lands at B.9.)
  if (!isHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme(scheme)}>
        <AppLockGate>
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
        </AppLockGate>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
