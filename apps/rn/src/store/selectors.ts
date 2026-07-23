import { allocatePaycheck } from '@core/engine/allocatePaycheck';
import { COLDSTART_HOLDBACK_FRACTION, DISCOVERY_HOLDBACK_FRACTION } from '@core/guardian/holdbackComposition';

import type { DebtStore } from '@/data/models';

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

/**
 * Run the shared `@core` engine over the store's current state — the single wiring point from
 * persisted data → the payday plan. `null` until a positive paycheck + a next-payday date are set
 * (pre-onboarding). Storage `RequiredExpense`/`Debt`/`Goal` are structural supersets of the engine's
 * params, so the store's arrays feed it directly.
 */
export function selectAllocation(store: DebtStore): Allocation | null {
  const amount = Number(store.paycheck.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !store.paycheck.nextPaycheckDate) return null;
  // §2.0.b action gate (2.4.6.1.3): the uncertainty holdback is part of the premium ACTING (like the
  // floor buffer), so it's premium-gated — free deploys undampened. Which holdbacks are live comes from
  // the substrate signals via `deriveConfidenceContext`; the fractions are the §2.0.b tunables.
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
  });
}
