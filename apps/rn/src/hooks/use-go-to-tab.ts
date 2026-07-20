import { useNavigation } from 'expo-router';
import { useCallback } from 'react';

/** The four tab route names (file names under `app/(tabs)/`). */
export type TabName = 'index' | 'bills' | 'payoff' | 'goals';

/**
 * Switch between the four tabs via the TAB navigator's own `navigate` (a `jumpTo`), NOT
 * `router.push('/bills')`. From a screen already inside `(tabs)`, an absolute-path push/navigate
 * resolves UP through the root `Stack` (which wraps `(tabs)` in `Stack.Protected`) and nests back
 * down — on native this intermittently lands as a detached/duplicate tab group with no focused child
 * = a BLANK screen (Freedom RN lesson #7). `useNavigation()` on a tab screen returns the tab
 * navigator, so `.navigate(name)` jumps directly and can't duplicate the group. Native-only — verify
 * on device.
 */
export function useGoToTab(): (tab: TabName) => void {
  const navigation = useNavigation();
  return useCallback(
    (tab: TabName) => {
      (navigation as unknown as { navigate: (name: TabName) => void }).navigate(tab);
    },
    [navigation],
  );
}
