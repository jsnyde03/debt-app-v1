import type { Debt } from '@/data/models';
import { formatWhole } from '@/utils/format';

/**
 * 3.3.6b — the Progress hero's journey figures, and **the sentence that reads them, in one owner.**
 *
 * ⛔ **[P6.8.9.7.11.12.10 · C-D] THE FIGURES AND THE SENTENCE USED TO LIVE APART, AND THE SENTENCE PICKED
 * THE WRONG ONE.** `progress.tsx` derived `totalOriginal`, the confirmed total and `totalPaid` seventy
 * lines above the line that printed them, and the "to go" branch printed **`totalOriginal`** — the
 * portfolio's ORIGINAL size — under a label that means *remaining*. They are equal in the case the branch
 * was written for (a new user who has paid nothing) and diverge in exactly one direction, because
 * `originalBalance` is stamped once at creation and **no edit path updates it**: a user who revises a
 * balance upward (interest, new spending — the ordinary life of revolving debt) is told they owe LESS than
 * they do.
 *
 * ⚡ **`totalPaid` clamps at `0`, which is what routes a grown portfolio into that branch** — so the
 * understatement and the branch that commits it have the same cause.
 *
 * ⚠️ **TWO BALANCE SETS, AND WHICH ONE IS NOT A STYLE CHOICE.** `progress.tsx` carries the rule (2.4):
 * *forward-looking computations read projected-current balances for premium; backward-looking "% paid"
 * stays on the raw/confirmed balances, because progress is what you have actually paid, not a projection.*
 * That rule **decides this line by its branch**:
 *
 * | branch | claim | reads |
 * |---|---|---|
 * | *"$X of $Y paid"* | how far have I come | **confirmed** balances, against the original |
 * | *"$X to go"* | what do I still owe | **projected** — the same figure Money's hero states |
 *
 * ⛔ A first cut moved BOTH onto the projection, which would have made "% paid" fall as interest accrued
 * while the user did nothing — the exact outcome 2.4's note exists to prevent. **The finding's remedy and a
 * standing decision collided, and the resolution was to split the figures by direction rather than pick a
 * side.**
 */
export interface JourneyTotals {
  /** Σ of what each debt was when it was first entered — the denominator of "how far have I come". */
  totalOriginal: number;
  /** Σ of the last CONFIRMED balances. Backward-looking: this is what progress is measured against. */
  totalConfirmed: number;
  /** Σ of what is owed now, projected for premium. **This is what "remaining" means.** */
  totalCurrent: number;
  /** Progress made, clamped at 0: a portfolio that has grown has not made negative progress. */
  totalPaid: number;
  /** Whole-percent paid, for the ring. */
  pct: number;
  /** The subhead under the ring. */
  line: string;
}

/**
 * @param debts the store's own debts — the confirmed anchors, and the only carrier of `originalBalance`.
 * @param projected the same debts with premium's projection applied (`withProjectedBalances`). Defaults to
 *   `debts`, which is exactly what a free user gets, so the single-argument call is not a shortcut.
 */
export function selectJourneyTotals(
  debts: Pick<Debt, 'balance' | 'originalBalance'>[],
  projected: Pick<Debt, 'balance'>[] = debts,
): JourneyTotals {
  const totalOriginal = debts.reduce((sum, d) => sum + (d.originalBalance ?? d.balance), 0);
  const totalConfirmed = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalCurrent = projected.reduce((sum, d) => sum + d.balance, 0);
  const totalPaid = Math.max(0, totalOriginal - totalConfirmed);
  const pct = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;
  /**
   * Early on, lead FORWARD (the remaining as a goal) instead of a deflating "$0 paid" — 3.3.6b.
   *
   * ⚠️ **The branch is chosen backward and answered forward, and that is deliberate.** Whether the user has
   * made progress is a fact about confirmed payments; what they still owe is a fact about today. One figure
   * cannot serve both, which is precisely the substitution C-D found.
   *
   * HON-1: whole dollars on the headline journey figure — matches every other Phase-3 surface.
   */
  const line = totalPaid > 0 ? `${formatWhole(totalPaid)} of ${formatWhole(totalOriginal)} paid` : `${formatWhole(totalCurrent)} to go`;
  return { totalOriginal, totalConfirmed, totalCurrent, totalPaid, pct, line };
}
