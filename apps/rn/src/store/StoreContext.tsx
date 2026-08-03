import { createContext, useContext, useEffect, type ReactNode } from 'react';

import { reportError } from '@/utils/reportError';

import { appStore } from './appStore';
import type { DebtStoreInstance } from './store';

/**
 * 3.5.3.0 — which store a subtree reads and writes.
 *
 * Until now every component reached the `appStore` singleton directly, which meant a component could
 * not be reused against anything else — the reason the Phase-3.5 tutorial couldn't run over the real
 * Today screen. This makes the store an injected dependency for a subtree while leaving the singleton as
 * the default, so the ~39 existing `useAppStore` call sites behave exactly as before.
 *
 * **The rule this exists to enforce: reads and writes must resolve to the SAME store.** The dangerous
 * shape is a component that reads through the context but writes through the singleton — inside the
 * tutorial it would read scripted money and mutate the user's real plan, silently. `useActiveStore()`
 * is the write-side counterpart of `useAppStore`, and every write inside a providered subtree must go
 * through it. `assertNoRealWrites` (3.5.3.0.5) is the backstop that makes a miss fail loudly.
 */

const StoreContext = createContext<DebtStoreInstance>(appStore);

/**
 * Point a subtree at a different store. React context flows through `Modal`, so sheets rendered by the
 * subtree inherit it too — which is required, since the tutorial's sheets must not write real data.
 */
export function StoreProvider({ store, children }: { store: DebtStoreInstance; children: ReactNode }) {
  useNoRealWritesGuard(store);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/**
 * 3.5.3.0.5 — the backstop. While a SANDBOX subtree is mounted, the user's real plan must not change.
 *
 * The dangerous miss is a component inside the subtree that still writes through the `appStore`
 * singleton: it would mutate real money from scripted input, with no error and nothing on screen to
 * show it. Rather than trusting that every call site was converted, this watches the real store for the
 * duration and reports any mutation — so a missed site becomes a loud failure instead of silent
 * corruption. Same move as the 3.5.0.6 sync-seam guards.
 *
 * Deliberately watches the `store` blob only: `isSaving`/`isHydrated` churn is lifecycle, not user data.
 */
function useNoRealWritesGuard(store: DebtStoreInstance) {
  useEffect(() => {
    if (store === appStore) return; // the real app: nothing to guard against
    let before = appStore.getState().store;
    const unsubscribe = appStore.subscribe((state) => {
      if (state.store === before) return;
      // [B3] Compare FIELD BY FIELD, ignoring the walkthrough's own resume bookkeeping.
      //
      // The guard used to fire on any change to the store blob, against a `before` captured once at
      // mount. But the walkthrough legitimately persists its position to the REAL store on every step
      // (`prefs.tutorialStep`, and `tutorialSeen` on finish) — that is resume state, and it has to
      // outlive the sandbox. So the guard reported on the first Next tap and, because `before` never
      // advanced, on every emission afterwards. It was 100% noise: dev-only console spam today, and
      // production error spam the moment Sentry is wired at Phase 6 — with a real sandbox-write bug
      // indistinguishable inside it. A backstop that always fires guards nothing, and it hollowed out
      // the plan's own "the real plan provably untouched".
      //
      // What is actually forbidden is the user's PLAN moving: money, debts, bills, the cushion line.
      // Prefs are the one channel the tutorial is entitled to write, so they're excluded and the
      // baseline advances — leaving a single, meaningful signal.
      const { prefs: _prevPrefs, ...prevPlan } = before;
      const { prefs: _nextPrefs, ...nextPlan } = state.store;
      before = state.store;
      const changed = (Object.keys(nextPlan) as (keyof typeof nextPlan)[]).filter((k) => nextPlan[k] !== prevPlan[k]);
      if (changed.length === 0) return;
      reportError(new Error('Real store mutated while a sandbox subtree was mounted'), {
        seam: 'StoreProvider',
        hint: 'a component inside the subtree is still writing via appStore instead of useActiveStore()',
        fields: changed.join(','),
      });
    });
    return unsubscribe;
  }, [store]);
}

/** Test seam: did the real store change while sandboxed? Returns the live real-store blob identity. */
export function realStoreSnapshot() {
  return appStore.getState().store;
}

/**
 * The store this subtree acts on — for WRITES (`useActiveStore().getState().addDebt(...)`) and for
 * passing to helpers that take a store. Returns the real singleton unless a provider says otherwise.
 */
export function useActiveStore(): DebtStoreInstance {
  return useContext(StoreContext);
}
