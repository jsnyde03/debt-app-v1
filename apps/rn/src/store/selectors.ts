import { allocatePaycheck } from '@core/engine/allocatePaycheck';
import { waterFill } from '@core/cashflow/waterFill';
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

/** Run the `@core` engine at a given prefunded-reserve level. `prefundedReserve` is injected as an
 *  INPUT from the §2.5 smoothing layer (spec §2.5) — never a rung inside single-cycle `allocatePaycheck`. */
function buildAllocation(store: DebtStore, prefundedReserve: number): Allocation | null {
  const amount = Number(store.paycheck.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !store.paycheck.nextPaycheckDate) return null;
  // §2.0.b action gate (2.4.6.1.3): the uncertainty holdback is part of the premium ACTING (like the
  // floor buffer), so it's premium-gated — free deploys undampened. The fractions are the §2.0.b tunables.
  const isPremium = store.subscriptionPlan === 'premium';
  const confidence = isPremium ? deriveConfidenceContext(store) : null;
  return allocatePaycheck({
    paycheckAmount: amount + (store.windfall ?? 0),
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
const prefundedCache = new WeakMap<object, number>();

/**
 * §2.5 pre-funded reserve (2.4.7.5) — cash cycle 0 holds back THIS paycheck to cover a future crunch the
 * forecast predicts, from the backward water-fill over the (prefunded-free) carry track. Premium-only
 * (it's part of the acting), 0 otherwise. Injected into `selectAllocation` as the §2.5 smoothing input.
 */
export function selectPrefundedReserve(store: DebtStore): number {
  if (store.subscriptionPlan !== 'premium') return 0;
  const cached = prefundedCache.get(store);
  if (cached !== undefined) return cached;

  const base = selectBaseAllocation(store);
  const floor = effectivePaycheckBuffer(store);
  const reserve = base
    ? waterFill(
        buildForecastCycles(store, base, floor, PREFUND_HORIZON).map((c) => c.carriedBalance),
        floor,
      ).prefundedReserve
    : 0;
  prefundedCache.set(store, reserve);
  return reserve;
}

/**
 * Run the shared `@core` engine over the store's current state — the single wiring point from persisted
 * data → the payday plan. `null` until a positive paycheck + next-payday date are set (pre-onboarding).
 * Includes the §2.5 pre-funded reserve so the plan the user acts on already holds back for a looming crunch.
 */
export function selectAllocation(store: DebtStore): Allocation | null {
  return buildAllocation(store, selectPrefundedReserve(store));
}
