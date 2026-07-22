import {
  projectCurrentBalance,
  computeEstimateConfidence,
  type EstimateConfidence,
} from '@core/debt/projectCurrentBalance';

import type { Debt, DebtStore } from '@/data/models';

/**
 * The read side of Projection auto-maintenance (2.3). `debt.balance` is the last-VERIFIED anchor;
 * this derives the number a screen should show as "current" plus the estimate metadata the label
 * needs. Premium projects the anchor forward to today (the "always-current" estimate); free shows the
 * anchor as-is, honestly labelled ("updated {date}"). Pure — takes the store + tier, no hooks.
 */
export interface DebtBalanceView {
  debt: Debt;
  /** The number to show as "current": premium = projected to today; free = the anchor. */
  currentBalance: number;
  /** The last confirmed value (what `balance` holds). */
  anchorBalance: number;
  lastVerifiedDate?: string;
  /** True when we're showing a projected estimate (premium + time has elapsed since verification). */
  isEstimate: boolean;
  confidence: EstimateConfidence;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function selectDebtBalanceView(store: DebtStore, debt: Debt, isPremium: boolean): DebtBalanceView {
  const asOf = store.paycheck.currentDate;
  const anchorBalance = roundMoney(Math.max(0, debt.balance));
  const confidence = computeEstimateConfidence(debt, asOf);
  return {
    debt,
    currentBalance: isPremium ? projectCurrentBalance(debt, asOf) : anchorBalance,
    anchorBalance,
    lastVerifiedDate: debt.lastVerifiedDate,
    // Only premium projects; verified-today (0 elapsed days) reads as verified, not "estimated".
    isEstimate: isPremium && confidence.daysSinceVerified > 0,
    confidence,
  };
}

export function selectDebtBalanceViews(store: DebtStore, isPremium: boolean): DebtBalanceView[] {
  return store.debts.map((debt) => selectDebtBalanceView(store, debt, isPremium));
}

/**
 * Active debts whose estimate has gone stale — the gate for the Payday Autopilot re-verify prompt
 * (2.3.5). Tier-agnostic here (free debts never go stale in practice since their number is the
 * anchor); the caller applies the premium gate.
 */
export function selectStaleDebtIds(store: DebtStore): string[] {
  const asOf = store.paycheck.currentDate;
  return store.debts
    .filter((debt) => debt.balance > 0 && computeEstimateConfidence(debt, asOf).staleness === 'stale')
    .map((debt) => debt.id);
}
