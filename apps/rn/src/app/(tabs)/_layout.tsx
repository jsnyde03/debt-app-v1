import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { TabBarIcon } from '@/components/tab-bar-icon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLayout } from '@/hooks/use-layout';
import { useTutorialSession } from '@/store/tutorialSession';

/**
 * The 3-tab shell (Elevation IA) — Today · Progress · Money, Today-first (index). Management
 * (Debts/Bills/Goals) is consolidated into Money; the "•••" More hub is a pushed route from each
 * header, not a tab.
 *
 * Adaptive: a left sidebar rail on the roomy iPad (regular) layout, the bottom tab bar on compact
 * (iPhone / narrow Split View), reactive to window resize via `useLayout`.
 *
 * NO tab transition animation (per Freedom's finding): bottom-tabs v7 `animation: 'fade'` can strand
 * the incoming screen at opacity 0 on the New Architecture (full-black on rapid switching). Don't
 * re-add until verified on a device build.
 */
export default function TabsLayout() {
  const c = useAppColors();
  const scheme = useColorScheme();
  const { isRegular } = useLayout();
  // 3.5.3.3.1 — a walkthrough must not lose the user to another tab. The overlay's scrim now covers the
  // whole canvas (3.5.3.5.7) on every beat including the interactive ones (3.5.3.5.9), so this is
  // defence in depth rather than the only guard. It still earns its place: the scrim renders nothing at
  // all on an interactive beat whose subject never measured, and that is precisely the degraded state in
  // which a stray tab tap would strand the user mid-beat. Skip is always right there.
  const inTutorial = useTutorialSession((s) => s.active);
  const holdTabs = { tabPress: (e: { preventDefault(): void }) => { if (inTutorial) e.preventDefault(); } };

  // 3.5.3.5.7 — the coaching overlay is deliberately NOT mounted here. Wrapping `<Tabs>` in a container
  // View to make room for a sibling broke tab presses outright (the BNPL specs' "Money" click timed
  // out), so it lives in the ROOT layout instead: that already provides a flex container, needs no new
  // wrapper around the navigator, and sits above everything — including the iPad sidebar rail, which was
  // the whole point.
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isRegular ? 'left' : 'bottom',
        tabBarVariant: isRegular ? 'material' : 'uikit',
        tabBarActiveTintColor: c.accent.primary,
        tabBarInactiveTintColor: c.text.tertiary,
        // 3.4.3 — the compact (iPhone) bottom bar is frosted glass: a translucent bar over a BlurView, so
        // content scrolls under it (the Screen scaffold already pads `insets.bottom + 64` to clear it). The
        // iPad rail stays solid (iPhone-first through v1.1). Device-QA the native material @ Phase 6.
        tabBarBackground: isRegular
          ? undefined
          : () => <BlurView tint={scheme === 'dark' ? 'dark' : 'light'} intensity={70} style={StyleSheet.absoluteFill} />,
        tabBarStyle: isRegular
          ? { backgroundColor: c.background.secondary, borderRightColor: c.border.subtle }
          : { position: 'absolute', backgroundColor: 'transparent', borderTopColor: c.border.subtle },
        tabBarLabelStyle: { fontSize: isRegular ? 15 : 11, fontWeight: '600' },
        // ⚠️ NO `tabBarButton` override here, deliberately — REVERTED 2026-08-04 (round 5).
        //
        // Rounds 2–4 replaced the default button with a plain `Pressable` so the tab bar could leave the
        // a11y tree during a walkthrough. The premise was that a VoiceOver double-tap "dispatches to the
        // element and bypasses hit-testing", so `holdTabs` couldn't stop it. **That premise was wrong.**
        // `holdTabs` hooks the `tabPress` EVENT, which the button emits from its own `onPress` — the same
        // path VoiceOver activation takes. Navigation was blocked for screen-reader users all along. The
        // real defect was only that the tab was focusable and inert with no announced reason: a polish
        // issue, and one that can only honestly be judged on a device with VO actually running.
        //
        // What the override cost, meanwhile, was paid by EVERY user of the app, tutorial or not. The
        // framework passes `href` to this button and react-native-web renders any View with `href` as a
        // real `<a>`; `PlatformPressable` exists partly to `preventDefault()` that (letting modifier- and
        // middle-clicks through). A plain Pressable does none of it, so on web every tab press fired SPA
        // navigation AND the anchor's document navigation — a full page reload, dropping in-memory state.
        // It also dropped `role="link"` on web, the pointer cursor, the iPad rail's hover effect, and the
        // theme-derived ripple colour.
        //
        // Re-implementing all of that to keep a cosmetic a11y win is the wrong trade, and deep-importing
        // `PlatformPressable` out of expo-router's bundle would break on any upgrade. So: keep the
        // framework's button, keep `holdTabs` (which is the guarantee that actually matters), and let the
        // Phase-6 VO pass judge the focusable-inert-tab nit with a real screen reader.
        //
        // The lesson worth keeping: this was a whole-app regression introduced to fix a tutorial-only
        // polish issue, and the web e2e stayed green through it because a reload lands on the right URL.
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarButtonTestID: 'tab-today', tabBarIcon: ({ color }) => <TabBarIcon name="today" color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        listeners={holdTabs}
        options={{ title: 'Progress', tabBarButtonTestID: 'tab-progress', tabBarIcon: ({ color }) => <TabBarIcon name="progress" color={color} /> }}
      />
      <Tabs.Screen
        name="money"
        listeners={holdTabs}
        options={{ title: 'Money', tabBarButtonTestID: 'tab-money', tabBarIcon: ({ color }) => <TabBarIcon name="money" color={color} /> }}
      />
    </Tabs>
  );
}
