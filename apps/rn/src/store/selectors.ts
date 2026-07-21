import { allocatePaycheck } from '@core/engine/allocatePaycheck';

import type { DebtStore } from '@/data/models';

/** The shared payday-allocation engine's output (kept in `@core`, identical to the Capacitor app). */
export type Allocation = ReturnType<typeof allocatePaycheck>;

/**
 * Run the shared `@core` engine over the store's current state — the single wiring point from
 * persisted data → the payday plan. `null` until a positive paycheck + a next-payday date are set
 * (pre-onboarding). Storage `RequiredExpense`/`Debt`/`Goal` are structural supersets of the engine's
 * params, so the store's arrays feed it directly.
 */
export function selectAllocation(store: DebtStore): Allocation | null {
  const amount = Number(store.paycheck.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !store.paycheck.nextPaycheckDate) return null;
  return allocatePaycheck({
    paycheckAmount: amount + (store.windfall ?? 0),
    currentDate: store.paycheck.currentDate,
    nextPaycheckDate: store.paycheck.nextPaycheckDate,
    strategy: store.payoffStrategy,
    expenses: store.requiredExpenses,
    livingExpenses: store.livingExpenses,
    debts: store.debts,
    goals: store.goals,
  });
}
