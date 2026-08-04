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
 * through it. `useNoRealWritesGuard` (3.5.3.0.5), below, is the backstop that makes a miss fail loudly.
 * (It was named `assertNoRealWrites` in the plan and never in the code — a dangling symbol 32 lines
 * above its own definition.)
 */

const StoreContext = createContext<DebtStoreInstance>(appStore);

/**
 * The ONLY real-store prefs a walkthrough may write: its resume position, and the record that the run
 * was seen. Both must outlive the sandbox, which is why they're written to the real store at all.
 * Anything else changing while a sandbox is mounted is a bug — see `useNoRealWritesGuard`.
 */
const TUTORIAL_WRITABLE_PREFS = ['tutorialStep', 'tutorialSeen'];

/**
 * Some real-store writes during a session are legitimate and have nothing to do with the sandbox: the
 * app's own background work landing on return-to-foreground. `drainPendingActions()` is the concrete
 * one — a user who taps the Live Activity's "Payday landed" while backgrounded mid-walkthrough has
 * their real plan rolled the instant they come back, and that write is correct.
 *
 * Without a way to say so, the backstop reports it. Today that's dev noise; at Phase 6 with Sentry it
 * would poison the ONE signal built to prove "the real plan provably untouched" — and a genuine sandbox
 * leak becomes indistinguishable inside a stream of false alarms. That is exactly how [B3] went wrong,
 * arriving from the other direction, so it gets an explicit answer rather than a wider exclusion.
 *
 * Synchronous by design: zustand notifies subscribers during `set`, so the flag covers the write and is
 * down again before anything else can hide behind it.
 */
let realWriteAllowed = false;
export function allowRealStoreWrite<T>(fn: () => T): T {
  const prev = realWriteAllowed;
  realWriteAllowed = true;
  try {
    return fn();
  } finally {
    realWriteAllowed = prev;
  }
}

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
      // A declared-legitimate write (see `allowRealStoreWrite`). Advance the baseline so the NEXT
      // comparison doesn't re-report this change as though the sandbox had made it.
      if (realWriteAllowed) {
        before = state.store;
        return;
      }
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
      const { prefs: prevPrefs, ...prevPlan } = before;
      const { prefs: nextPrefs, ...nextPlan } = state.store;
      before = state.store;
      const changed = (Object.keys(nextPlan) as (keyof typeof nextPlan)[]).filter((k) => nextPlan[k] !== prevPlan[k]);
      // Prefs are diffed FIELD BY FIELD against a two-key allowlist rather than excluded wholesale.
      // Dropping the entire `prefs` object was too generous by a wide margin: the walkthrough is
      // entitled to `tutorialStep` and `tutorialSeen` and nothing else, but the blanket exclusion also
      // blinded the backstop to a sandboxed component writing `isDemoMode` (which silently kills real
      // payday capture) or `onboardingComplete: false` (which re-onboards the user) through the
      // singleton. Those are exactly the silent corruptions this guard exists to catch, and the fix for
      // its false-positive noise had quietly opened a hole underneath it.
      // The UNION of both key sets — iterating `nextPrefs` alone was blind to a REMOVED key, and a
      // dropped pref is a real-store change like any other (writing prefs without `onboardingComplete`
      // would re-onboard the user, silently, past a backstop looking the other way).
      const prefKeys = new Set([...Object.keys(prevPrefs), ...Object.keys(nextPrefs)]);
      const prefsChanged = ([...prefKeys] as (keyof typeof nextPrefs)[]).filter(
        (k) => nextPrefs[k] !== prevPrefs[k] && !TUTORIAL_WRITABLE_PREFS.includes(k as string),
      );
      changed.push(...(prefsChanged.map((k) => `prefs.${String(k)}`) as (keyof typeof nextPlan)[]));
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
