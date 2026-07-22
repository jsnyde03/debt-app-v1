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
 * anchor as-is, honestly labelled ("updated {date}"). Pure — no hooks.
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

export function selectDebtBalanceView(debt: Debt, currentDate: string, isPremium: boolean): DebtBalanceView {
  const anchorBalance = roundMoney(Math.max(0, debt.balance));
  const confidence = computeEstimateConfidence(debt, currentDate);
  return {
    debt,
    currentBalance: isPremium ? projectCurrentBalance(debt, currentDate) : anchorBalance,
    anchorBalance,
    lastVerifiedDate: debt.lastVerifiedDate,
    // Only premium projects; verified-today (0 elapsed days) reads as verified, not "estimated".
    isEstimate: isPremium && confidence.daysSinceVerified > 0,
    confidence,
  };
}

export function selectDebtBalanceViews(store: DebtStore, isPremium: boolean): DebtBalanceView[] {
  return store.debts.map((debt) => selectDebtBalanceView(debt, store.paycheck.currentDate, isPremium));
}

/**
 * The quiet caption line under a debt's balance — the honest "estimated · verified {date}" (premium)
 * vs "updated {date}" (free). `attention` = the calm stale-tone shift (amber), NOT an alarm — the real
 * re-verify moment is the Payday Autopilot step (2.3.5). `fmtDate` keeps date formatting at the call site.
 */
export function buildEstimateCaption(
  view: DebtBalanceView,
  isPremium: boolean,
  fmtDate: (iso: string) => string
): { text: string; attention: boolean } {
  const { lastVerifiedDate, isEstimate, confidence } = view;
  if (!isPremium) {
    return { text: lastVerifiedDate ? `updated ${fmtDate(lastVerifiedDate)}` : '', attention: false };
  }
  if (!isEstimate) {
    return { text: 'verified', attention: false }; // premium, no elapsed drift → verified as of today
  }
  if (confidence.staleness === 'stale') {
    return { text: 'estimated · verify soon', attention: true };
  }
  return { text: lastVerifiedDate ? `estimated · verified ${fmtDate(lastVerifiedDate)}` : 'estimated', attention: false };
}

/**
 * Active debts whose estimate has gone stale — the gate for the Payday Autopilot re-verify prompt
 * (2.3.5). Tier-agnostic here; the caller applies the premium gate.
 */
export function selectStaleDebtIds(store: DebtStore): string[] {
  const asOf = store.paycheck.currentDate;
  return store.debts
    .filter((debt) => debt.balance > 0 && computeEstimateConfidence(debt, asOf).staleness === 'stale')
    .map((debt) => debt.id);
}

/** Views for the stale-estimate debts — the Payday Autopilot re-verify batch (2.3.5). Premium-only ([]  for free). */
export function selectStaleBalanceViews(store: DebtStore, isPremium: boolean): DebtBalanceView[] {
  if (!isPremium) return [];
  const asOf = store.paycheck.currentDate;
  return store.debts
    .filter((debt) => debt.balance > 0 && computeEstimateConfidence(debt, asOf).staleness === 'stale')
    .map((debt) => selectDebtBalanceView(debt, asOf, true));
}
