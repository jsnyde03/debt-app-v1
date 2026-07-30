import { useStore } from 'zustand';

import type { SandboxStoreInstance } from './sandboxStore';
import type { DebtAppState } from './store';

/**
 * 3.5.0.1 — React binding for a SANDBOX store instance: the sandbox-bound peer of `useAppStore`.
 *
 * `useAppStore` is hardwired to the `appStore` singleton, so a tutorial screen built on it would read
 * (and its controls would write) the user's REAL plan. This hook takes the instance explicitly, which
 * is what lets the Phase-3.5 tutorial render the genuine Guardian surfaces against scripted money:
 *
 *   const sandbox = useMemo(() => createSandboxStore(scenario), [scenario]);
 *   const guardian = useSandboxStore(sandbox, (s) => selectPaydayGuardian(s.store));
 *
 * The selector signature is identical to `useAppStore`'s, so a presentational card written against one
 * works unchanged against the other — the tutorial teaches on the same components the app ships.
 */
export function useSandboxStore<T>(store: SandboxStoreInstance, selector: (state: DebtAppState) => T): T {
  return useStore(store, selector);
}
