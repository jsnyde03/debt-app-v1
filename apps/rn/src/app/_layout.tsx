import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from 'zustand';

import { AppLockGate } from '@/components/AppLockGate';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotificationSync } from '@/hooks/use-notification-sync';
import { useInitPremium } from '@/premium/premiumSync';
import { createStorageAdapter } from '@/storage/createAdapter';
import { bootstrapPersistence, flushPendingSave } from '@/store/persistence';
import { allowRealStoreWrite, StoreProvider } from '@/store/StoreContext';
import { appStore } from '@/store/appStore';
import { demoSession } from '@/store/demoSession';
import { startWidgetSync } from '@/widget/widgetSync';
import { startLiveActivitySync } from '@/liveActivity/liveActivitySync';
import { drainPendingActions } from '@/appIntents/drainPendingActions';
import { addNotificationResponseListener, registerNotificationCategories } from '@/notifications/notifications';
import { initErrorReporting, wrapRoot } from '@/utils/sentry';
import { KeyCommandListener } from '@/keyCommands/KeyCommandListener';
import { DemoDirector } from '@/components/plan/DemoDirector';
import { CaptureAutoStart } from '@/components/plan/CaptureAutoStart';
import { DemoCaption } from '@/components/plan/DemoCaption';
import { DemoDock } from '@/components/plan/DemoDock';
import { CoachMarkLayer } from '@/components/plan/CoachMarkLayer';
import { TutorialCoach } from '@/components/plan/TutorialCoach';
import { suspendStoryOnBackground } from '@/store/tutorialSession';
import { TutorialShellProvider } from '@/store/tutorialShell';
import { TutorialTargetsProvider } from '@/store/tutorialTargets';
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
  // 3.5.4.1 — read BOTH halves of the demo session here. `sandbox` supplies the store to the provider
  // below and `active` opens the route guard; `demoSession.end()` clears them in one `set`, so they
  // cannot disagree for a frame.
  const demoSandbox = useStore(demoSession, (s) => s.sandbox);
  const inDemo = useStore(demoSession, (s) => s.active);
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
          // The walkthrough's scripted story is timer-driven; suspended timers all fire at once on
          // resume. See `suspendStoryOnBackground`.
          suspendStoryOnBackground();
        } catch {
          /* best-effort flush */
        }
      } else if (next === 'active') {
        // 3.5.3.5 — a "Payday landed" tap while backgrounded lands here on return-to-foreground.
        // Declared to the sandbox backstop: this writes the REAL store, correctly, and can land while a
        // walkthrough is on screen. Undeclared it reads as a sandbox leak — see `allowRealStoreWrite`.
        try {
          allowRealStoreWrite(() => drainPendingActions());
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
          {/* 3.5.3.5.7 — the walkthrough's coaching layer mounts HERE, above everything.
              It began inside the Today screen, where its scrim could only cover what that screen owns —
              so on iPad the sidebar rail, which belongs to the navigator, sat fully lit beside a dimmed
              screen. Mounting it in the tabs layout was the obvious next step and turned out to be the
              wrong one: wrapping `<Tabs>` in a container View to make room for a sibling broke tab
              presses entirely. This container already exists and needs no such wrapper.
              ⚠️ Today itself did NOT move — 3.5.3.1 put the walkthrough inside the tabs because hosting a
              COPY of Today in a Stack route lands a detached tab group (a blank screen on device,
              Freedom RN lesson #7). Only the overlay VIEW is hoisted; the session still renders over the
              real Today tab. */}
          <TutorialShellProvider>
          {/* 3.5.5.1 — the coached-subject registry, app-wide. It used to mount inside a running
              walkthrough on Today, which is the only place it needed to be when the walkthrough was its
              only consumer; coach-marks point at controls on Money, Progress and More, so a Today-scoped
              registry could never see them. Inert on an ordinary launch: registration is a ref write and
              its one piece of state stays null unless something is actively coaching. */}
          <TutorialTargetsProvider>
          {/* 3.5.4.1 — the demo's store sits ABOVE the navigator, so every screen it can reach resolves to
              the same sandbox. `useAppStore` reads through this context, so with no demo running the value
              is the singleton and all ~39 call sites behave exactly as they did — and `useNoRealWritesGuard`
              early-returns on `store === appStore`, so this wrapper is inert outside a demo.
              ⚠️ Here, NOT around `<Tabs>`: wrapping that in a container broke tab presses outright
              (see the tabs layout). The walkthrough keeps its own provider inside Today, which is correct —
              it is Today-scoped by design and this one is not above it in that case. */}
          <StoreProvider store={demoSandbox ?? appStore}>
          <Stack screenOptions={{ headerShown: false }}>
          {/* [D18] — a demo is admitted for a NOT-YET-ONBOARDED user. That audience is the whole point of
              the pre-purchase entry, and it is exactly who this guard blocked: the legacy `demoSeed` got
              past it by writing `onboardingComplete: true` to the REAL store, which is the sin the sandbox
              exists to retire. A sandbox demo writes nothing real, so it needs the guard to admit it
              instead. */}
          <Stack.Protected guard={onboardingComplete || inDemo}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="more" />
            <Stack.Screen name="history" />
            <Stack.Screen name="living-expenses" />
            <Stack.Screen name="cushion-forecast" />
            {/* 3.7.A0 — the payoff schedule as a pushed route (was a sheet-from-a-sheet, dead on device). */}
            <Stack.Screen name="schedule/[id]" />
            {/* 3.5.1 — the Guardian tutorial (scaffold; beats land at 3.5.3). Runs on a sandbox. */}
            <Stack.Screen name="tutorial" />
          </Stack.Protected>
          <Stack.Protected guard={!onboardingComplete}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          {/* 3.5.4.7 — the paywall is OUTSIDE the onboarding guard, and that is a fix rather than a
              relaxation. Buying does not require having entered your data, and the demo's whole audience is
              pre-purchase: with it inside the guard, a not-yet-onboarded viewer who tapped "Unlock Premium"
              had the demo torn down (which closed the guard) and landed in ONBOARDING instead of the
              paywall — the conversion path broken for exactly the people it exists for. Found by the exit
              e2e, which is the only thing that walks that sequence. Nothing else links here pre-onboarding,
              so this opens no new surface; it only stops closing one. */}
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          {/* 3.5.4.2 — the demo entry. QA-gated inside the route itself, so it disappears with the
              Phase-6 `QA_TOOLS` flip without a second switch here. */}
          <Stack.Screen name="demo" />
          <Stack.Screen name="+not-found" />
          </Stack>
          {/* 3.5.4.7 — the demo's chrome, mounted beside the Stack for the same reason the walkthrough's
              overlay is: it must sit above the navigator (so it covers the iPad rail too) and cannot live
              inside a tab screen. Renders nothing unless a demo is running. */}
          {/* 3.5.8.3 — a capture build enters the demo on its own; inert everywhere else. */}
          <CaptureAutoStart />
          <DemoDirector />
          <DemoDock />
          {/* 3.5.8.2 — the closing caption. Beside the dock rather than inside it because it renders on
              the OPPOSITE condition: the dock is withheld for the capture, and the capture is the run that
              owes the subscription disclosure. */}
          <DemoCaption />
          </StoreProvider>
          <TutorialCoach />
          {/* 3.5.5.1 — beside the walkthrough's coaching layer, for the same reason: above the navigator
              and outside the screens' gesture handlers. Renders nothing unless a mark is active. */}
          <CoachMarkLayer />
          </TutorialTargetsProvider>
          </TutorialShellProvider>
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
