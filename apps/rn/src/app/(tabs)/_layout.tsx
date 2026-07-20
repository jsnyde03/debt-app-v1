import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/tab-bar-icon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useLayout } from '@/hooks/use-layout';

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
  const { isRegular } = useLayout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isRegular ? 'left' : 'bottom',
        tabBarVariant: isRegular ? 'material' : 'uikit',
        tabBarActiveTintColor: c.accent.primary,
        tabBarInactiveTintColor: c.text.tertiary,
        tabBarStyle: isRegular
          ? { backgroundColor: c.background.secondary, borderRightColor: c.border.subtle }
          : { backgroundColor: c.background.secondary, borderTopColor: c.border.subtle },
        tabBarLabelStyle: { fontSize: isRegular ? 15 : 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: ({ color }) => <TabBarIcon name="today" color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: ({ color }) => <TabBarIcon name="progress" color={color} /> }}
      />
      <Tabs.Screen
        name="money"
        options={{ title: 'Money', tabBarIcon: ({ color }) => <TabBarIcon name="money" color={color} /> }}
      />
    </Tabs>
  );
}
