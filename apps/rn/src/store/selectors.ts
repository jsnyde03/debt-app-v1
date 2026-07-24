import { allocatePaycheck } from '@core/engine/allocatePaycheck';
import { waterFill, type WaterFillResult } from '@core/cashflow/waterFill';
import { COLDSTART_HOLDBACK_FRACTION, DISCOVERY_HOLDBACK_FRACTION } from '@core/guardian/holdbackComposition';

import type { DebtStore } from '@/data/models';

import { buildForecastCycles } from './forecastCycles';
import { deriveConfidenceContext } from './guardianPredictionCore';

/** The shared payday-allocation engine's output (kept in `@core`, identical to the Capacitor app). */
export type Allocation = ReturnType<typeof allocatePaycheck>;

/** The base cushion the engine keeps before any extra payoff, for free users (unchanged behavior). */
export const BASE_PAYCHECK_BUFFER = 50;

/**
 * The cushion the plan protects before deploying extra payoff (2.4 auto-protect). Premium reserves the
 * user's cushion floor so tight cycles keep cash instead of over-paying debt (the Guardian's action);
 * free keeps the base buffer. Derived from `store.subscriptionPlan`, so it applies to display AND
 * payday capture without threading a flag through every caller.
 */
export function effectivePaycheckBuffer(store: DebtStore): number {
  return store.subscriptionPlan === 'premium' ? (store.cushionFloor ?? 200) : BASE_PAYCHECK_BUFFER;
}

/** How far the §2.5 water-fill looks ahead for a crunch to pre-fund (biweekly ⇒ ~4 months; catches a
 *  quarterly bill). [BUILD]-tunable, Phase 6. */
const PREFUND_HORIZON = 8;

/** §2.3.1 (2.4.7.7): the current cycle's scheduled paycheck was reported missed ($0 arrival). Keyed by
 *  the current cycle's end (`nextPaycheckDate`), so a rollover (which advances the date) auto-resumes. */
export function selectPaycheckMissed(store: DebtStore): boolean {
  return !!store.paycheck.nextPaycheckDate && store.missedArrivals.includes(store.paycheck.nextPaycheckDate);
}

/** Run the `@core` engine at a given prefunded-reserve level. `prefundedReserve` is injected as an
 *  INPUT from the §2.5 smoothing layer (spec §2.5) — never a rung inside single-cycle `allocatePaycheck`. */
function buildAllocation(store: DebtStore, prefundedReserve: number): Allocation | null {
  const amount = Number(store.paycheck.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !store.paycheck.nextPaycheckDate) return null;
  // §2.3.1 paused-deploy: a missed paycheck means $0 income THIS cycle — plan on that, never on phantom
  // income (only the windfall, if any, is real). Projected future cycles resume on the recurring income.
  const income = selectPaycheckMissed(store) ? 0 : amount;
  // §2.0.b action gate (2.4.6.1.3): the uncertainty holdback is part of the premium ACTING (like the
  // floor buffer), so it's premium-gated — free deploys undampened. The fractions are the §2.0.b tunables.
  const isPremium = store.subscriptionPlan === 'premium';
  const confidence = isPremium ? deriveConfidenceContext(store) : null;
  return allocatePaycheck({
    paycheckAmount: income + (store.windfall ?? 0),
    currentDate: store.paycheck.currentDate,
    nextPaycheckDate: store.paycheck.nextPaycheckDate,
    strategy: store.payoffStrategy,
    expenses: store.requiredExpenses,
    livingExpenses: store.livingExpenses,
    debts: store.debts,
    goals: store.goals,
    paycheckBuffer: effectivePaycheckBuffer(store),
    discoveryHoldbackFraction: confidence?.discoveryHoldbackActive ? DISCOVERY_HOLDBACK_FRACTION : 0,
    coldStartHoldbackFraction: confidence?.coldStartHoldbackActive ? COLDSTART_HOLDBACK_FRACTION : 0,
    prefundedReserve,
    // §2.5 D5.3 gate (2.4.7.6): savings elsewhere → skip the pre-debt starter EF, deploy to debt first.
    skipStarterEmergency: store.prefs.hasSavingsElsewhere,
  });
}

/** The prefunded-FREE allocation — the forecast's cycle-0 input. The carry track (`net`/`carriedBalance`)
 *  is prefunded-independent, so basing the water-fill's forecast on this breaks the would-be recursion
 *  (selectAllocation → prefunded → forecast → selectAllocation). */
export function selectBaseAllocation(store: DebtStore): Allocation | null {
  return buildAllocation(store, 0);
}

// The store is immutable (a new object on every change), so the water-fill — which builds a whole
// forecast — is computed at most ONCE per store version and reused across the many `selectAllocation`
// calls a render makes (the WeakMap auto-drops old versions). [Phase-4: a real memo-selector layer.]
const waterFillCache = new WeakMap<object, WaterFillResult | null>();

/**
 * §2.5 the full water-fill PLAN (2.4.7.4 / 2.4.9.6) — the Guardian's multi-cycle reasoning: the crunch
 * `segments` it detected in the raw trajectory, the `reserveByCycle` it holds to smooth them, the total
 * `structuralDeficit` no reserve can cover, and cycle 0's actionable `prefundedReserve`. Premium-only
 * (it's the acting), `null` otherwise / pre-plan. Cached per immutable store version. The drill-down
 * (2.4.9.6) narrates this — the premium reasoning free never sees; `selectAllocation` consumes the
 * cycle-0 number via `selectPrefundedReserve`.
 */
export function selectWaterFillPlan(store: DebtStore): WaterFillResult | null {
  if (store.subscriptionPlan !== 'premium') return null;
  const cached = waterFillCache.get(store);
  if (cached !== undefined) return cached;

  const base = selectBaseAllocation(store);
  const floor = effectivePaycheckBuffer(store);
  const result = base
    ? waterFill(buildForecastCycles(store, base, floor, PREFUND_HORIZON).map((c) => c.carriedBalance), floor)
    : null;
  waterFillCache.set(store, result);
  return result;
}

/**
 * §2.5 pre-funded reserve (2.4.7.5) — cash cycle 0 holds back THIS paycheck to cover a future crunch the
 * forecast predicts. The cycle-0 share of the water-fill plan; injected into `selectAllocation` as the
 * §2.5 smoothing input. Premium-only, 0 otherwise.
 */
export function selectPrefundedReserve(store: DebtStore): number {
  return selectWaterFillPlan(store)?.prefundedReserve ?? 0;
}

/**
 * Run the shared `@core` engine over the store's current state — the single wiring point from persisted
 * data → the payday plan. `null` until a positive paycheck + next-payday date are set (pre-onboarding).
 * Includes the §2.5 pre-funded reserve so the plan the user acts on already holds back for a looming crunch.
 */
export function selectAllocation(store: DebtStore): Allocation | null {
  return buildAllocation(store, selectPrefundedReserve(store));
}
