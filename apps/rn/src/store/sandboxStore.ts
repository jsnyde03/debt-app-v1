import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';

import { createDebtStore, type DebtStoreInstance } from './store';

/**
 * 3.5.0.1 — the SANDBOX STORE factory: the ephemeral, scriptable Guardian substrate that the Phase-3.5
 * interactive tutorial, the bounded demo, and the marketing-site demo all run on.
 *
 * ⚠️ This is NOT `prefs.isDemoMode` and NOT the legacy `demoSeed` (3.5.0.6 hard-declares that seam).
 * Those mutate the user's REAL store. A sandbox is a SECOND store instance that is bound to NOTHING:
 * never persisted, never mirrored to the widget App Group, never driving a Live Activity, never
 * scheduling a notification. The tutorial can therefore drag the cushion floor, absorb a surprise, and
 * roll a payday forward without touching a single byte the user owns.
 *
 * **Isolation is by CONSTRUCTION, not by convention** — three independent guarantees:
 *  1. Every sync entry point (`bootstrapPersistence` · `startWidgetSync` · `startLiveActivitySync`)
 *     takes `store: DebtStoreInstance = appStore`. A sandbox is simply never handed to them.
 *  2. The factory NEUTERS `hydrate`/`save` on the instance, so even a mis-wired call cannot read or
 *     write durable storage — the adapter is accepted and ignored.
 *  3. Instances are branded in a `WeakSet` so `isSandboxStore()` can assert the above at the seams
 *     (wired in 3.5.0.6) and in tests.
 *
 * Because a sandbox IS a `DebtStoreInstance`, every existing pure selector (`selectPaydayGuardian`,
 * `selectRecoveryPlan`, …) and every store action works against it verbatim — the tutorial drives the
 * REAL engine, so what it teaches is what the user's own Guardian will do. Read it in React via
 * `useSandboxStore` (the sandbox-bound peer of `useAppStore`).
 *
 * Ephemeral: nothing subscribes to a sandbox except React, which unsubscribes on unmount, so the
 * instance is garbage-collected with the screen. There is no dispose step.
 */

/** A sandbox instance is structurally a normal store — the brand is tracked out-of-band (see below). */
export type SandboxStoreInstance = DebtStoreInstance;

/**
 * A scripted starting state for the sandbox. `build` receives a base store whose clock is already
 * pinned to `baseDate` (see `createSandboxBase`), so a scenario only describes the MONEY — it never has
 * to think about "today". The named scenarios (clear / tight / at-risk / personal-scaled) land in
 * 3.5.0.3; this file defines only the shape they fill.
 */
export interface SandboxScenario {
  /** Stable id for e2e targeting + replay (`'tutorial-clear'`, `'demo-at-risk'`, …). */
  id: string;
  /** Human label for a debug/replay picker. Never user-facing copy without a wording pass. */
  label: string;
  /** The frozen "today" the whole scenario is told from (YYYY-MM-DD) — determinism starts here. */
  baseDate: string;
  /** Shape the pinned base into the scripted state. Must stay PURE (no clock, no randomness). */
  build(base: DebtStore): DebtStore;
}

/** Brands sandbox instances so the sync seams + tests can prove what they were handed (3.5.0.6). */
const sandboxes = new WeakSet<object>();

/**
 * The frozen wall clock backing each sandbox, held in a mutable box so `seedSandbox` can re-point it
 * when a sandbox is re-seeded to a scenario with a different `baseDate` (the store's injected clock
 * closes over the box, not the value). This is what stops `recordDriftBaseline` — which fires on
 * rollover, add/remove debt, and onboarding — from stamping the REAL today onto a scenario dated months
 * away, which would both break replay determinism and make the tutorial's drift read nonsense.
 */
const sandboxClocks = new WeakMap<object, { date: string }>();

/** True when `store` came from `createSandboxStore` — i.e. it must never reach a persistence/sync path. */
export function isSandboxStore(store: object): boolean {
  return sandboxes.has(store);
}

/**
 * A default store with its clock frozen to `baseDate`. `createDefaultStore()` reads the live wall
 * clock (`todayLocalISO`), which would make every scenario drift by the day it was run — so the three
 * date fields that anchor the engine are re-pinned deterministically. The remaining cold-start honesty
 * bounds (`genuineCycleCount` ≤ 1, `onboardedAt`, the unreachable-matured-Guardian guarantee) are
 * 3.5.0.2 and layer on top of this.
 */
export function createSandboxBase(baseDate: string): DebtStore {
  const base = createDefaultStore();
  return {
    ...base,
    paycheck: {
      ...base.paycheck,
      currentDate: baseDate,
      nextPaycheckDate: getNextPaycheckDate({ payCycle: base.paycheck.payCycle, currentDate: baseDate }),
    },
    inputsAsOf: baseDate,
  };
}

/**
 * Seed (or RE-seed) a sandbox to its scenario's opening state. Re-seeding is how the tutorial's
 * "start over" and the demo's loop restart: same scenario in → byte-identical state out, because
 * `build` is pure and the clock is frozen.
 */
export function seedSandbox(store: SandboxStoreInstance, scenario: SandboxScenario): void {
  // Re-point the frozen clock first, so any action driven after this seed anchors to THIS scenario's date.
  const box = sandboxClocks.get(store);
  if (box) box.date = scenario.baseDate;

  store.setState({
    store: scenario.build(createSandboxBase(scenario.baseDate)),
    // A sandbox has nothing to hydrate FROM; declaring it hydrated keeps every `isHydrated` gate in the
    // shared UI satisfied so the tutorial renders the real screens rather than a loading state.
    isHydrated: true,
    isSaving: false,
    premiumIsLifetime: false,
    intentRollback: null,
  });
}

/**
 * Build an ephemeral, isolated, scripted store for the scenario. The ONLY way to make a sandbox.
 */
export function createSandboxStore(scenario: SandboxScenario): SandboxStoreInstance {
  // The clock box is created BEFORE the store so the injected `now` can close over it.
  const box = { date: scenario.baseDate };
  const store = createDebtStore({ now: () => box.date });
  sandboxes.add(store);
  sandboxClocks.set(store, box);

  // Guarantee 2 — sever the durable-storage lifecycle at the instance level. `bootstrapPersistence`
  // calls exactly these two; neutering them means a mis-wire degrades to a no-op instead of writing
  // the tutorial's fake money over the user's real plan.
  store.setState({
    hydrate: async () => {},
    save: async () => {},
  });

  seedSandbox(store, scenario);
  return store;
}
