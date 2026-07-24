import { suggestLean } from '@core/income/suggestLean';

import type { DebtStore } from '@/data/models';

/** Below this many confirmed actuals we don't nudge at all — a couple of paychecks isn't a pattern. */
const MIN_NUDGE_N = 3;

export interface LeanNudge {
  suggestedLean: number;
  currentLean: number;
  direction: 'up' | 'down';
  n: number;
}

/**
 * §2.3 income learning (2.4.7.8) — the suggest-and-confirm nudge, or null. Premium + variable income only
 * (fixed income has nothing to learn), and only when the suggested lean differs MATERIALLY from the
 * current one AND that suggestion isn't one the user already dismissed. NEVER applied silently — the
 * caller renders it as a confirm-required card; applying it re-anchors drift via the `'learning'` source
 * (a measurement change, not a plan change) so the "days ahead/behind" doesn't reset.
 */
export function selectLeanSuggestion(store: DebtStore): LeanNudge | null {
  if (store.subscriptionPlan !== 'premium' || !store.paycheck.incomeVaries) return null;

  const actuals = store.incomeActualsLog.map((a) => a.actualIncome);
  if (actuals.length < MIN_NUDGE_N) return null;

  const currentLean = Number(store.paycheck.leanAmount) || 0;
  const { suggestedLean, n } = suggestLean(actuals, Number(store.paycheck.typicalAmount) || 0, currentLean);

  const delta = suggestedLean - currentLean;
  const material = Math.abs(delta) >= Math.max(25, currentLean * 0.05);
  if (!material) return null;

  // Don't re-surface a suggestion the user dismissed, until it moves materially from what they dismissed.
  const dismissed = store.dismissedLeanSuggestion;
  if (dismissed != null && Math.abs(suggestedLean - dismissed) < 25) return null;

  return { suggestedLean, currentLean, direction: delta > 0 ? 'up' : 'down', n };
}
