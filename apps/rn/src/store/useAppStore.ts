import { useStore } from 'zustand';

import { useActiveStore } from './StoreContext';
import type { DebtAppState } from './store';

/**
 * React binding for the app store. Screens/hooks select the slice they need:
 *   const debts = useAppStore((s) => s.store.debts);
 *
 * 3.5.3.0 — this now reads through `StoreContext` rather than the `appStore` singleton directly. With
 * no provider above it the context yields that same singleton, so every existing call site behaves
 * identically; inside a `StoreProvider` (the Phase-3.5 tutorial) the same components read the sandbox
 * instead. That's what lets the tutorial run over the REAL Today screen.
 *
 * ⚠️ If you read with this hook, WRITE with `useActiveStore()` — never `appStore.getState()`. Mixing the
 * two makes a component read scripted money and mutate the user's real plan.
 */
export function useAppStore<T>(selector: (state: DebtAppState) => T): T {
  return useStore(useActiveStore(), selector);
}
