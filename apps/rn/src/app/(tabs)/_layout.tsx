import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

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
        // The tab bar leaves the ACCESSIBILITY tree while a session runs. `holdTabs` and the scrim only
        // stop fingers: a VoiceOver double-tap dispatches straight to the focused element and never goes
        // through hit-testing, so the bar stayed both reachable and — before this — silently inert. A
        // screen-reader user could swipe to "Progress, tab", double-tap, and get nothing at all, with no
        // announced reason; on the interactive beats they could leave the walkthrough outright. Removing
        // it from the tree is the honest version of what the scrim says visually. Found by BOTH round-2
        // a11y reviewers independently, which is usually the sign of something structural.
        //
        // Spreading react-navigation's own props keeps the role, the selected state and the press
        // handling it already computed — this adds the two a11y flags and changes nothing else. A bare
        // hand-rolled button here would silently drop "selected", and this file has history: wrapping
        // `<Tabs>` to make room for a sibling once broke tab presses outright.
        tabBarButton: (props) => (
          <Pressable
            // Cast only for the `ref` type: react-navigation types it as a legacy ref while RN's new
            // architecture narrowed `Pressable`'s. A typing artefact, not a runtime difference — and the
            // ref is passed through rather than dropped, so react-navigation keeps its handle.
            {...(props as React.ComponentProps<typeof Pressable>)}
            // The default button is `PlatformPressable`, which adds the platform press affordances on
            // top of a plain Pressable. It lives inside expo-router's BUNDLED react-navigation, with no
            // public export path — deep-importing `expo-router/build/...` to get it would break on any
            // expo-router upgrade, which is a worse trade than restoring the one affordance that
            // actually shows. Android's borderless ripple is that affordance ([[first-class per
            // platform]] — Android doesn't get the lesser bar because the fix was written on iOS).
            // ⏳ iOS press-opacity parity is device-owed with the rest of the Phase-6 pass.
            android_ripple={{ borderless: true, radius: 40 }}
            accessibilityElementsHidden={inTutorial}
            importantForAccessibility={inTutorial ? 'no-hide-descendants' : 'auto'}
          />
        ),
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
