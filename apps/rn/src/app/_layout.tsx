import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppLockGate } from '@/components/AppLockGate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotificationSync } from '@/hooks/use-notification-sync';
import { useInitPremium } from '@/premium/premiumSync';
import { createStorageAdapter } from '@/storage/createAdapter';
import { bootstrapPersistence, flushPendingSave } from '@/store/persistence';
import { startWidgetSync } from '@/widget/widgetSync';
import { startLiveActivitySync } from '@/liveActivity/liveActivitySync';
import { drainPendingActions } from '@/appIntents/drainPendingActions';
import { addNotificationResponseListener, registerNotificationCategories } from '@/notifications/notifications';
import { initErrorReporting, wrapRoot } from '@/utils/sentry';
import { KeyCommandListener } from '@/keyCommands/KeyCommandListener';
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
// VIS-6 — init crash reporting at MODULE scope so an early crash (before mount) is still captured. No-op
// without EXPO_PUBLIC_SENTRY_DSN / on web; the real DSN + CI care land at Phase 6.
initErrorReporting();

function RootLayout() {
  const scheme = useColorScheme();
  const isHydrated = useAppStore((s) => s.isHydrated);
  const onboardingComplete = useAppStore((s) => s.store.prefs.onboardingComplete);
  useNotificationSync();
  useInitPremium();

  useEffect(() => {
    // Hydrate + autosave, THEN start mirroring the debt summary to the iOS widget's App-Group container
    // (3.5.1) — after hydrate so the first snapshot reflects real data. No-op on web/Android.
    void bootstrapPersistence(createStorageAdapter()).then(() => {
      startWidgetSync();
      // 3.5.3 — drive the premium Payday Countdown Live Activity off the same hydrated store. No-op on
      // web/Android and when the OS/user has Live Activities off.
      startLiveActivitySync();
      // 3.5.3.5 — apply anything a "Payday landed" AppIntent queued while the app was closed. No-op on web.
      drainPendingActions();
      // VIS-6 — register the interactive-notification action categories (no-op web/Android-less).
      void registerNotificationCategories();
    });

    // VIS-6 — a notification tap / action-button press routes the user to Today (where the payday
    // capture auto-opens + the Guardian read lives). No-op on web.
    const notifUnsub = addNotificationResponseListener(() => {
      try {
        router.navigate('/');
      } catch {
        /* navigation not ready — the default cold-start route already lands the user in-app */
      }
    });
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
      } else if (next === 'active') {
        // 3.5.3.5 — a "Payday landed" tap while backgrounded lands here on return-to-foreground.
        try {
          drainPendingActions();
        } catch {
          /* best-effort drain */
        }
      }
    });
    return () => {
      sub.remove();
      notifUnsub();
    };
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
            <Stack.Screen name="cushion-forecast" />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack.Protected>
          <Stack.Protected guard={!onboardingComplete}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Screen name="+not-found" />
          </Stack>
          {/* 3.6.6 — iPad hardware ⌘-shortcuts (inert on iPhone/touch + web). Only meaningful once past
              onboarding, since it routes to the tabs. */}
          {onboardingComplete ? <KeyCommandListener /> : null}
        </AppLockGate>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// VIS-6 — wrapped for Sentry auto-instrumentation (navigation/touch breadcrumbs → a crash trail).
// Passthrough on web / without a DSN. Expo Router uses this default export.
export default wrapRoot(RootLayout);
