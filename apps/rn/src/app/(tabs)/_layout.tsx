import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/tab-bar-icon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useLayout } from '@/hooks/use-layout';

/**
 * The 4-destination shell (ratified IA EVOLVE) — Plan · Bills · Payoff · Goals, Plan-first
 * (index). Settings is NOT a tab; it's the "•••" More hub (a pushed route from each header).
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
        options={{ title: 'Plan', tabBarIcon: ({ color }) => <TabBarIcon name="plan" color={color} /> }}
      />
      <Tabs.Screen
        name="bills"
        options={{ title: 'Bills', tabBarIcon: ({ color }) => <TabBarIcon name="bills" color={color} /> }}
      />
      <Tabs.Screen
        name="payoff"
        options={{ title: 'Payoff', tabBarIcon: ({ color }) => <TabBarIcon name="payoff" color={color} /> }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Goals', tabBarIcon: ({ color }) => <TabBarIcon name="goals" color={color} /> }}
      />
    </Tabs>
  );
}
