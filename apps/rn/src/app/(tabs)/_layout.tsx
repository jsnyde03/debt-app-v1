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
  // 3.5.3.3.1 — the walkthrough's scrim lives INSIDE the Today screen, so it can't cover the tab bar:
  // a user could tap straight through to Money's real data mid-beat and lose the thread (and, on the
  // interactive beats, do it without even a scrim in the way). Holding the tabs for the duration is the
  // honest read of "the scrim blocks stray taps" — and Skip is always right there if they want out.
  const inTutorial = useTutorialSession((s) => s.active);
  const holdTabs = { tabPress: (e: { preventDefault(): void }) => { if (inTutorial) e.preventDefault(); } };

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
