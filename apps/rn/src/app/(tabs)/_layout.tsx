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
        // ⚠️ NO `tabBarButton` override here, deliberately — REVERTED 2026-08-04. A plain `Pressable`
        // drops the `href` preventDefault the framework's button does, so every tab press on web became a
        // full page reload. `holdTabs` below is the guarantee that actually matters. Full post-mortem →
        // audit doc §N.
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
