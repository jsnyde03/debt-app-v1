import { createContext, useContext, useEffect, type ReactNode } from 'react';

import { reportError } from '@/utils/reportError';

import { appStore } from './appStore';
import { enterSandboxScope, forbiddenRealStoreChanges, isRealWriteAllowed } from './realWriteGuard';
import type { DebtStoreInstance } from './store';

// [R4] `allowRealStoreWrite` moved to `realWriteGuard` and is imported from THERE by every declaring
// call site — `appStore` itself now needs it, and this module imports `appStore`. One home, one grep.

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
 * ⛔ **[R4] THE ENFORCEMENT MOVED; THIS IS NOW THE SECOND LINE.** Declaring the scope (`enterSandboxScope`)
 * is what arms the real veto — `appStore` consults `refuseRealStoreWrite` inside its own actions and
 * DROPS a forbidden write, so nothing lands to be reported. This subscription used to be the only
 * mechanism, and that was the defect: `subscribe` fires *after* the write, so it described the corruption
 * of a user's real plan rather than preventing it. It is kept because it covers the one seam the veto
 * cannot — `api.setState`, which the actions deliberately bypass — and because a report on a channel the
 * veto misses is exactly how the next miss gets found.
 *
 * Deliberately watches the `store` blob only: `isSaving`/`isHydrated` churn is lifecycle, not user data.
 *
 * ⚠️ SCOPE — this reports on the premise that a bounded run fences navigation. It fires on the provider
 * (`store !== appStore`), not on the session, so it watches any sandbox subtree; "a real-store write while
 * a sandbox is mounted" only means LEAK because the run holds the tabs and withholds More, so nothing
 * reachable can legitimately write.
 *
 * ⛔ **[S1.13.7.11 · pass-6 `B2-1`] — WHAT HOLDS THAT LINE FOR `/paywall` IS [D9], NOT [D18].** The
 * sentence here used to say the demo's exits are TERMINAL, so `/paywall` is never reached with a demo
 * provider above it. **That is false for the explore demo:** `useNavigationHeld()` is
 * `inTutorial || (inDemo && demoMode === 'scripted')`, `exitDemo(` has 2 call sites against 6 for
 * `'/paywall'`, and 4 of those are ordinary pushes. What actually keeps a purchase from landing under a
 * sandbox is **[D9]: the sandbox runs PREMIUM for every audience** (`demoRun.ts:149`,
 * `tutorialSession.ts:144-146`), so no paywall entry point renders inside a bounded run at all.
 *
 * ⚠️ **The coupling is the point of writing it down.** Narrow or revert [D9] and a purchase made from
 * inside a demo is silently dropped, reported to Sentry as the plan corruption the guard exists to catch —
 * a real-plan-corruption alert for a working checkout. `/more` is still fenced by the tab hold.
 *
 * ⚠️ What would break it: mounting this provider around a subtree that can navigate to a real-store
 * writer. If a future run is ever admitted without the fence, the answer is a report scope on the
 * provider — never a per-call-site allowlist over an open route graph.
 */
function useNoRealWritesGuard(store: DebtStoreInstance) {
  useEffect(() => {
    if (store === appStore) return; // the real app: nothing to guard against
    // [R4] ARM THE VETO FIRST. This is the line that actually protects the user's plan; everything below
    // it is reporting. Released on unmount / on a store change, so the real store is writable again the
    // moment the sandbox subtree goes away.
    const leaveScope = enterSandboxScope();
    let before = appStore.getState().store;
    const unsubscribe = appStore.subscribe((state) => {
      if (state.store === before) return;
      // [B3] Compare FIELD BY FIELD, ignoring the bounded run's own resume bookkeeping — the walkthrough
      // legitimately persists `prefs.tutorialStep`/`tutorialSeen` to the REAL store on every step, and a
      // backstop that fires on every Next tap guards nothing. `forbiddenRealStoreChanges` owns that diff,
      // shared with the veto so the two can never disagree about what "the user's plan moved" means.
      //
      // ⚠️ The baseline advances unconditionally, including on a declared-legitimate write
      // (`allowRealStoreWrite`), so one accepted change is not re-reported on every emission afterwards.
      const declared = isRealWriteAllowed();
      const changed = forbiddenRealStoreChanges(before, state.store);
      before = state.store;
      // A declared-legitimate write (`allowRealStoreWrite`) is the app's own background work landing —
      // the veto passed it deliberately, so reporting it here would re-create the [B3] noise the field
      // diff exists to kill, and bury a real leak inside it.
      if (declared || changed.length === 0) return;
      // Reaching HERE now means something bypassed the veto — in practice `api.setState`, the one seam
      // the actions do not route through. That is a narrower and more informative signal than before.
      reportError(new Error('Real store mutated while a sandbox subtree was mounted'), {
        seam: 'StoreProvider',
        hint: 'a write bypassed the appStore action veto (api.setState?) while a sandbox was mounted',
        fields: changed.join(','),
      });
    });
    return () => {
      unsubscribe();
      leaveScope();
    };
  }, [store]);
}

/**
 * The store this subtree acts on — for WRITES (`useActiveStore().getState().addDebt(...)`) and for
 * passing to helpers that take a store. Returns the real singleton unless a provider says otherwise.
 */
export function useActiveStore(): DebtStoreInstance {
  return useContext(StoreContext);
}
