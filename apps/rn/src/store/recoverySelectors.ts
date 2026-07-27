import { scaleBnplMinimumForWindow } from '@core/debt/bnplInstallment';
import { classifyDeferability } from '@core/obligations/classifyDeferability';
import { resolveTrialAmounts } from '@core/obligations/effectiveObligationAmount';
import { buildRecoveryPlan, type RecoveryCandidate, type RecoveryPlan } from '@core/recovery/buildRecoveryPlan';

import type { DebtStore } from '@/data/models';

import { selectAllocation } from './selectors';

export type { RecoveryPlan };

/** A cycle runs [payday, next payday): a bill due strictly BEFORE the next payday belongs to this cycle
 *  (same boundary the allocation engine uses). */
function dueThisCycle(dueDate: string, nextPaycheckDate: string): boolean {
  return new Date(`${dueDate}T00:00:00`) < new Date(`${nextPaycheckDate}T00:00:00`);
}

/**
 * §2.6 Recovery Plan — the deficit read for THIS cycle, or null when there's no shortfall (recovery only
 * exists when the Guardian is short). The gap IS the allocation's shortfall (same number the Guardian
 * card shows). Splits this cycle's UNPAID obligations into essential ("cover now") and deferrable via
 * `classifyDeferability`; debt minimums are essential by rule (credit impact). Trials are priced with the
 * resolver so the amounts match the plan. Pure derivation off the store — the engine does the ranking.
 */
export function selectRecoveryPlan(store: DebtStore): RecoveryPlan | null {
  const allocation = selectAllocation(store);
  if (!allocation) return null;
  const gap = allocation.shortfall ?? 0;
  if (gap <= 0) return null;

  const nextPayday = store.paycheck.nextPaycheckDate;
  const windowStart = store.paycheck.currentDate;
  const essential: RecoveryCandidate[] = [];
  const deferrable: RecoveryCandidate[] = [];

  for (const e of resolveTrialAmounts(store.requiredExpenses)) {
    if (e.isPaidThisCycle || e.amount <= 0 || !dueThisCycle(e.dueDate, nextPayday)) continue;
    const item: RecoveryCandidate = { id: e.id, name: e.name, amount: e.amount };
    // MF.1 (audit #1): an autopay bill CANNOT be deferred (the charge fires regardless), so it's
    // cover-now, never "safe to defer" — deferring it in-app would be a false promise of coverage.
    const canDefer = !e.isAutopay && classifyDeferability(e) === 'deferrable';
    (canDefer ? deferrable : essential).push(item);
  }

  for (const d of store.debts) {
    const minPaid = d.minimumPaidThisCycle ?? d.isPaidThisCycle ?? false;
    if (minPaid || d.balance <= 0 || !dueThisCycle(d.dueDate, nextPayday)) continue;
    // Debt minimums are always essential (missing one hits credit) — cover-now, never deferred. Window-scale
    // a cross-cadence BNPL so the essential amount matches the (window-scaled) gap it's covering (AS.4).
    const scaled = scaleBnplMinimumForWindow(d, windowStart, nextPayday);
    essential.push({ id: d.id, name: d.name, amount: Math.min(scaled.minimumPayment, scaled.balance) });
  }

  return buildRecoveryPlan({ gap, deferrable, essential });
}
