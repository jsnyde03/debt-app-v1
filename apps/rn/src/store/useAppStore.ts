import { useStore } from 'zustand';

import { appStore } from './appStore';
import type { DebtAppState } from './store';

/**
 * React binding for the vanilla app store. Screens/hooks select the slice they need:
 *   const debts = useAppStore((s) => s.store.debts);
 */
export function useAppStore<T>(selector: (state: DebtAppState) => T): T {
  return useStore(appStore, selector);
}
