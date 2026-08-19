import type { Debt } from '@core/storage/debtPlannerStorage';

/**
 * 5.2 — v1.5's `originalBalance` backfill, ported into the bridge.
 *
 * ⚠️ **This is a deliberate copy of `lib/storage/migrateState.ts`'s `withBackfilledOriginalBalance`, and
 * the copy is the point.** That file is the LEGACY tree, which 5.5.1 deletes — so importing it would give
 * the bridge a dependency with a scheduled execution date. The rule this repo keeps is "one owner per
 * rule"; after 5.5.1 there is exactly one owner, and it is this file. Until then there are two, and only
 * one of them is reachable from the app.
 *
 * **What it does, from the original's own reasoning:** a debt with no positive `originalBalance` is
 * excluded from milestone tracking AND (historically) from the "all debts paid off" check — which could
 * fire a false "Debt free!" celebration while a legacy debt was still owed. The balance is anchored to the
 * current balance, the best starting point recoverable for a debt that predates the field.
 */
export function withBackfilledOriginalBalance(debts: Debt[]): Debt[] {
  return debts.map((debt) => {
    const hasValidOriginal =
      typeof debt.originalBalance === 'number' && Number.isFinite(debt.originalBalance) && debt.originalBalance > 0;
    return hasValidOriginal ? debt : { ...debt, originalBalance: debt.balance };
  });
}
