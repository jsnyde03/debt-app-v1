import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';

import { createDebtStore, type DebtAppState, type DebtStoreInstance } from './store';

/**
 * 3.5.0.1 — the SANDBOX STORE factory: the ephemeral, scriptable Guardian substrate that the Phase-3.5
 * interactive tutorial, the bounded demo, and the marketing-site demo all run on.
 *
 * ⚠️ **THIS IS NOT `prefs.isDemoMode`, AND NOT the legacy `demoSeed` (3.5.0.6 hard-declaration).** The
 * three are easy to confuse and only one of them is safe for teaching:
 *   - `demoStore()` (`data/demoSeed.ts`) is **`importStore`d into the REAL store** from onboarding's
 *     "try sample data". It overwrites the user's plan, and it seeds a MATURED Guardian
 *     (`genuineCycleCount: 6`) — the opposite of the day-one bound a demo must keep. 3.5.4 replaces it.
 *   - `prefs.isDemoMode` is a flag ON THE REAL STORE, read by real code (`use-payday-capture` disables
 *     payday capture when it's set). It changes real behaviour; it does not isolate anything.
 *   - A **sandbox** is a second store instance bound to nothing. Nothing here touches the real store,
 *     and no sandbox scenario sets `isDemoMode` — the isolation is structural, not a flag.
 *
 * A sandbox is a SECOND store instance that is bound to NOTHING:
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
 * REAL engine, so what it teaches is what the user's own Guardian will do.
 *
 * Read it in React with zustand's own `useStore(sandbox, selector)`. There was a `useSandboxStore`
 * wrapper here; [E2] retired it. It had no production consumer, its stated reason for existing
 * ("`useAppStore` is hardwired to the singleton") stopped being true at 3.5.3.0 when `StoreContext`
 * made the store injectable, and — worst — its usage example demonstrated a fresh-object selector,
 * the exact pattern this repo has recorded as an infinite re-render that took the whole screen down.
 * A dead example that teaches a known crash is worse than no example.
 *
 * ⚠️ Select the store BLOB and derive with `useMemo`; never return a fresh object from the selector:
 *   const store = useStore(sandbox, (s) => s.store);
 *   const guardian = useMemo(() => selectPaydayGuardian(store), [store]);
 *
 * Ephemeral: nothing subscribes to a sandbox except React, which unsubscribes on unmount, so the
 * instance is garbage-collected with the screen. There is no dispose step.
 */

/** A sandbox instance is structurally a normal store — the brand is tracked out-of-band (see below). */
export type SandboxStoreInstance = DebtStoreInstance;

/**
 * 3.5.0.2 — the COLD-START HONESTY CEILING.
 *
 * The demo and tutorial must never depict a Guardian a day-one user could not have. That is not one
 * number: the before-scan found THREE independent maturity channels, and the original spec named only
 * the first.
 *
 *  1. `genuineCycleCount` ≥ `DISCOVERY_CYCLES` (3) retires the discovery holdback — the safety net stops
 *     being held. Capped at 1, so the net is ALWAYS held and the release moment stays a scripted beat
 *     rather than something the tutorial can stumble into.
 *  2. `cycleHistory` feeds `selectGuardianProofOfWork` and `selectCalibrationScore` DIRECTLY (not via
 *     `genuineCycleCount`). Uncapped, three scripted rollovers would have the proof strip announcing
 *     "Held your line · 3 paychecks" on a day-one demo. Capped to the most recent entry.
 *  3. `incomeActualsLog` drives `leanConfirms`; at `COLDSTART_CONFIRMATIONS` (4) the variable-income
 *     cold-start holdback clears. Capped so it cannot be reached.
 *
 * Plus two "day one" pins: reads never age into a staleness hedge mid-tutorial (`inputsAsOf` tracks the
 * scripted today, which is honest — the script's numbers ARE current), and `onboardedAt` never drifts
 * off the frozen base date.
 *
 * Applied by `createDebtStore({ bound })` on EVERY mutation and by `seedSandbox` on the way in, so it
 * holds by construction: a scenario cannot seed past it, and no sequence of scripted actions — however
 * many rollover beats 3.5.0.4 adds — can climb over it.
 */
export const SANDBOX_MAX_GENUINE_CYCLES = 1;
export const SANDBOX_MAX_HISTORY = 1;
/** One spare slot beyond history so an absorb/walk-back beat has room without unbounded growth. */
export const SANDBOX_MAX_SURPRISES = 2;

/**
 * Build the honesty ceiling for a scenario's frozen base date. Pure; idempotent.
 *
 * `maxGenuineCycles` is per-scenario (3.5.0.4.1) — the demo's day-one bound vs the tutorial's need to
 * cross the discovery gate. Only THIS channel is scenario-tunable; the track-record channels below stay
 * fixed, so a raised cycle count still can't buy a proof-of-work streak or a cleared cold start.
 */
export function boundSandboxStore(baseDate: string, maxGenuineCycles = SANDBOX_MAX_GENUINE_CYCLES): (store: DebtStore) => DebtStore {
  return (store) => {
    const genuineCycleCount = Math.min(store.genuineCycleCount, maxGenuineCycles);
    const cycleHistory =
      store.cycleHistory.length > SANDBOX_MAX_HISTORY ? store.cycleHistory.slice(-SANDBOX_MAX_HISTORY) : store.cycleHistory;
    const incomeActualsLog =
      store.incomeActualsLog.length > SANDBOX_MAX_HISTORY ? store.incomeActualsLog.slice(-SANDBOX_MAX_HISTORY) : store.incomeActualsLog;
    const surpriseOutflowLog =
      store.surpriseOutflowLog.length > SANDBOX_MAX_SURPRISES ? store.surpriseOutflowLog.slice(-SANDBOX_MAX_SURPRISES) : store.surpriseOutflowLog;
    // Reads stay fresh: `inputsAsOf` follows the scripted today rather than aging away from it.
    const inputsAsOf = store.paycheck.currentDate;
    // Day one never moves, however many cycles are scripted.
    const onboardedAt = store.onboardedAt === null ? null : baseDate;
    // [B2] A sandbox never raises a MILESTONE. The scripted paydays pay real minimums, and the persona
    // seeds at 24.67% paid — so the first roll crosses the 25% mark and `applyRollover` queues a
    // milestone. Today's ack slot ranks milestone ABOVE reserve-release, so the celebration would evict
    // the beat's own payoff: the ack the spotlight is aiming at never mounts, the target measures null,
    // and on an interactive beat that also means no scrim renders at all — payoff missing AND screen
    // unguarded. Suppressed here rather than by re-ranking the ack slot, because the honest statement is
    // "scripted example money did not achieve a real milestone", which is the same class of claim as the
    // cycle-count and history ceilings this function already enforces.
    const pendingMilestone = null;

    // Identity-preserving when nothing was out of bounds — avoids pointless re-renders on every set.
    if (
      genuineCycleCount === store.genuineCycleCount &&
      cycleHistory === store.cycleHistory &&
      incomeActualsLog === store.incomeActualsLog &&
      surpriseOutflowLog === store.surpriseOutflowLog &&
      inputsAsOf === store.inputsAsOf &&
      onboardedAt === store.onboardedAt &&
      pendingMilestone === store.pendingMilestone
    ) {
      return store;
    }
    return { ...store, genuineCycleCount, cycleHistory, incomeActualsLog, surpriseOutflowLog, inputsAsOf, onboardedAt, pendingMilestone };
  };
}

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
  /**
   * 3.5.0.4.1 — how many genuine cycles this scenario may reach, i.e. its honesty ceiling.
   *
   * Defaults to `SANDBOX_MAX_GENUINE_CYCLES` (1) — day-one bounded, which is what the pre-purchase
   * DEMO must stay at: it must never pose as a matured, proven Guardian. The TUTORIAL declares
   * `DISCOVERY_CYCLES` instead, because its whole subject is what happens across your first few
   * paydays — and under a flat ceiling of 1 the safety net could never release, so the arc's payoff
   * moment was structurally unreachable (found by 3.5.0.4's before-scan).
   *
   * Raising it does NOT loosen the other channels: `cycleHistory` and `incomeActualsLog` stay capped,
   * so no scenario can manufacture a multi-cycle track record or clear the variable-income cold start.
   */
  maxGenuineCycles?: number;
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
const sandboxClocks = new WeakMap<object, { date: string; maxCycles: number }>();

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
/**
 * 3.5.0.3.4 — dev-only purity guard. `SandboxScenario.build` is documented pure, but a scenario that
 * quietly reaches for a clock or `Math.random()` would break replay determinism in a way that only
 * shows up as "the tutorial looked different that time" — the hardest kind of bug to be told about.
 * Building twice and comparing catches it at the moment the scenario is used.
 *
 * `__DEV__` is read through a `typeof` guard because the tsx test runner leaves it undefined (the same
 * pattern as `reportError`), so this is inert in tests and stripped in release.
 */
function assertScenarioPurity(scenario: SandboxScenario, built: DebtStore): void {
  const dev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (!dev) return;
  const again = scenario.build(createSandboxBase(scenario.baseDate));
  if (JSON.stringify(again) !== JSON.stringify(built)) {
    console.warn(
      `[sandbox] scenario "${scenario.id}" is not pure — two builds differed. ` +
        'Replay and the tutorial e2e depend on it being deterministic; check for a clock or random read.',
    );
  }
}

export function seedSandbox(store: SandboxStoreInstance, scenario: SandboxScenario): void {
  // Re-point the frozen clock AND the ceiling first, so anything driven after this seed uses THIS
  // scenario's date and its own honesty bound (a re-seed can swap demo ↔ tutorial).
  const box = sandboxClocks.get(store);
  if (box) {
    box.date = scenario.baseDate;
    box.maxCycles = scenario.maxGenuineCycles ?? SANDBOX_MAX_GENUINE_CYCLES;
  }

  const built = scenario.build(createSandboxBase(scenario.baseDate));
  assertScenarioPurity(scenario, built);

  // The seed is bounded by the wrapped `setState` installed in `createSandboxStore` — a scenario cannot
  // hand-seed a matured Guardian (6 cycles of history) straight past the ceiling.
  store.setState({
    store: built,
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
  // The clock box is created BEFORE the store so the injected `now` and the bound can close over it —
  // the ceiling's `onboardedAt` pin has to follow a re-seed to a different base date too.
  const box = { date: scenario.baseDate, maxCycles: scenario.maxGenuineCycles ?? SANDBOX_MAX_GENUINE_CYCLES };
  const store = createDebtStore({
    now: () => box.date,
    bound: (s) => boundSandboxStore(box.date, box.maxCycles)(s),
  });
  sandboxes.add(store);
  sandboxClocks.set(store, box);

  // Guarantee 2 — sever the durable-storage lifecycle at the instance level. `bootstrapPersistence`
  // calls exactly these two; neutering them means a mis-wire degrades to a no-op instead of writing
  // the tutorial's fake money over the user's real plan.
  store.setState({
    hydrate: async () => {},
    save: async () => {},
  });

  // Close the last gap in the honesty ceiling (3.5.0.2 after-scan): the `bound` passed to
  // `createDebtStore` wraps the ACTIONS' `set`, but `api.setState` is a separate door — direct
  // `sandbox.setState({ store })` from a caller would land unbounded. Wrap it so every write to a
  // sandbox goes through the ceiling, whichever door it uses. The bound is idempotent, so re-applying
  // it to already-bounded state is free.
  const rawSetState = store.setState;
  store.setState = ((partial: unknown, replace?: boolean) =>
    (rawSetState as (p: unknown, r?: boolean) => void)((state: DebtAppState) => {
      const next = typeof partial === 'function' ? (partial as (s: DebtAppState) => unknown)(state) : partial;
      const patch = next as Partial<DebtAppState> | null;
      return patch && patch.store ? { ...patch, store: boundSandboxStore(box.date, box.maxCycles)(patch.store) } : patch;
    }, replace)) as typeof store.setState;

  seedSandbox(store, scenario);
  return store;
}
