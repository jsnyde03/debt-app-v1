/**
 * v1.7 Payday Cushion Guardian — data-substrate PRODUCERS (2.4.D.3).
 *
 * Pure `DebtStore → DebtStore` (or field) helpers that RECORD what happened so the §2.0 confidence
 * layer has real signals to read. Kept pure + type-only-imported so they're node-unit-testable
 * (substrateProducers.test.ts) independently of the zustand store, then wired into the store actions
 * (store.ts edit mutations · payday.ts capture/rollover · completeOnboarding).
 *
 * The PREDICTION-stamp side (currentCyclePrediction + fold-into-snapshot) is 2.4.D.4, not here — this
 * file is the "record the actuals/inputs" half only.
 */

import type { DebtStore, IncomeActual, SurpriseOutflow } from '@/data/models';

/**
 * 3a — read-freshness. Stamp `inputsAsOf` on a GENUINE income/bill/balance edit (never a rollover),
 * so §2.0's staleness cutoff keys off real input recency rather than per-debt `lastVerifiedDate`.
 * Uses `paycheck.currentDate` as "now" (the app's canonical today, same as addDebt's stamp).
 */
export function stampInputsFresh(store: DebtStore): DebtStore {
  return { ...store, inputsAsOf: store.paycheck.currentDate };
}

/**
 * 3b — bill-completeness. A genuine lived cycle completed (a real rollover). Increments the counter
 * that gates the discovery holdback's decay. NOT `cycleHistory.length` (which demoSeed pre-loads /
 * import backfills) — only real rollovers call this, so seeded/imported cycles never inflate it.
 */
export function incrementGenuineCycle(store: DebtStore): DebtStore {
  return { ...store, genuineCycleCount: store.genuineCycleCount + 1 };
}

/**
 * 3f — income-arrival axis. A missed paycheck ($0 / "didn't get paid") is recorded here, NOT as a
 * low income-actual — it's a zero-arrival event, not a low-earning cycle, so lean-learning excludes
 * it and the Guardian pauses deploy (§2.3.1). Idempotent per cycle.
 */
export function recordMissedArrival(store: DebtStore, cycleEndDate: string): DebtStore {
  if (store.missedArrivals.includes(cycleEndDate)) return store;
  return { ...store, missedArrivals: [...store.missedArrivals, cycleEndDate] };
}

/**
 * 3c/3e — lean-verification. Record the cycle's actual income against what was PLANNED (the sole
 * producer of the lean-verification signal). Rules:
 *  - `missed` → routes to the arrival axis (3f), no income-actual written.
 *  - variable income with NO reported actual → skip (can't fabricate a variable actual; suggest-not-silent).
 *  - otherwise → actual defaults to the planned amount (fixed income is deterministic).
 *  - `store.windfall` is NEVER folded in (a one-off can't inflate lean).
 *  - planned = the stamped prediction's plannedIncome if present, else the current paycheck scalar.
 *  - re-capture for the same cycle REPLACES the entry (a correction, not a duplicate).
 */
export function recordCycleIncome(
  store: DebtStore,
  cycleEndDate: string,
  opts?: { actualIncome?: number; missed?: boolean },
): DebtStore {
  if (opts?.missed) return recordMissedArrival(store, cycleEndDate);

  if (store.paycheck.incomeVaries && opts?.actualIncome === undefined) return store;

  const planned = store.currentCyclePrediction?.plannedIncome ?? (Number(store.paycheck.amount) || 0);
  const actual = opts?.actualIncome ?? planned;
  const entry: IncomeActual = { cycleEndDate, plannedIncome: planned, actualIncome: actual };
  const withoutThisCycle = store.incomeActualsLog.filter((e) => e.cycleEndDate !== cycleEndDate);
  return { ...store, incomeActualsLog: [...withoutThisCycle, entry] };
}

/**
 * 3d — surprise-outflow. An un-modeled outflow surfaced at a payday reconcile — the second half of
 * bill-completeness (§2.0.a) and the walk-back trigger for an over-confident "bills complete"
 * attestation (§2.0.c). Non-positive amounts are ignored.
 */
export function recordSurpriseOutflow(store: DebtStore, outflow: SurpriseOutflow): DebtStore {
  if (!(outflow.amount > 0)) return store;
  const logged = { ...store, surpriseOutflowLog: [...store.surpriseOutflowLog, outflow] };
  // §2.0.c walk-back (2.4.11.4c): a surprise proves the bills weren't complete after all → un-attest,
  // restore the full hold, and flag a one-time notice. Only fires if the user had attested.
  if (store.billsAttested) return { ...logged, billsAttested: false, pendingReserveWalkback: true };
  return logged;
}

/**
 * onboardedAt — the bill-completeness baseline. Set ONCE at first onboarding completion; never
 * overwritten (so a later re-onboard doesn't reset the "how long have we known this user" clock).
 */
export function stampOnboardedAt(store: DebtStore): DebtStore {
  if (store.onboardedAt) return store;
  return { ...store, onboardedAt: store.paycheck.currentDate };
}
