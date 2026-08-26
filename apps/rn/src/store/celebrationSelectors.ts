import type { Debt, DebtStore, PendingPayoff } from '@/data/models';

import { mayClaim, rowFieldUnread } from '@/store/trustSelectors';

/**
 * Debt-paid-off celebration (3.3.1) — the pure read layer for the "paid off" archive + the grand-finale
 * stats. All derivations are HONEST facts off data that already persists: paid-off debts stay in the store
 * (`balance: 0`) carrying their `originalBalance` + the `lastVerifiedDate` they were confirmed cleared.
 *
 * Deliberately NO per-debt "interest saved" and NO finale "interest saved" — at debt-free time every balance
 * is 0 and there's no tracked cumulative interest / historical per-cycle extra to reconstruct it from, so any
 * figure would be fabricated. The moat is honest numbers (never false-precise), so the finale reports what we
 * can stand behind: total paid off · debts cleared · months to freedom.
 */

/** One cleared debt in the "Debts Paid Off" archive. */
export interface PaidOffDebt {
  id: string;
  name: string;
  /** Amount paid off = the original balance; `null` when it was never captured (don't fabricate). */
  amount: number | null;
  /** Date confirmed cleared (`lastVerifiedDate`, else the projection anchor); `null` if unknown. */
  clearedDate: string | null;
  isBnpl: boolean;
}

/** The archive: every debt confirmed to $0, most-recently-cleared first. */
export function selectPaidOffDebts(store: DebtStore): PaidOffDebt[] {
  return store.debts
    .filter((d) => d.balance <= 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      amount: d.originalBalance ?? null,
      clearedDate: d.lastVerifiedDate ?? d.balanceAsOfDate ?? null,
      isBnpl: d.type === 'bnpl',
    }))
    .sort((a, b) => (b.clearedDate ?? '').localeCompare(a.clearedDate ?? ''));
}

/**
 * True when `id` is the LAST live debt — confirming it to $0 makes the user debt-free. Called at confirm
 * time (BEFORE the store mutates, while `id` still has a balance) to choose the per-debt beat vs the finale.
 */
export function isLastLiveDebt(debts: Debt[], id: string): boolean {
  const live = debts.filter((d) => d.balance > 0);
  return live.length === 1 && live[0].id === id;
}

/** The grand-finale count-up trio — concrete, honest figures only. */
export interface CelebrationStats {
  /** Total originally owed across all debts (the sum paid off). Unknown originals contribute 0, never overclaim. */
  totalPaid: number;
  debtsCleared: number;
  /** onboarding → the last debt cleared, in whole months; `null` when no onboarding anchor exists (legacy). */
  monthsToFreedom: number | null;
}

export function selectCelebrationStats(store: DebtStore): CelebrationStats {
  const { debts } = store;
  const totalPaid = round2(debts.reduce((sum, d) => sum + (d.originalBalance ?? Math.max(0, d.balance)), 0));
  const cleared = debts.filter((d) => d.balance <= 0);

  const latestClear = cleared.reduce<string | null>((max, d) => {
    const dt = d.lastVerifiedDate ?? d.balanceAsOfDate ?? null;
    return dt && (max === null || dt > max) ? dt : max;
  }, null) ?? store.paycheck.currentDate;

  return {
    totalPaid,
    debtsCleared: cleared.length,
    monthsToFreedom: store.onboardedAt ? monthsBetween(store.onboardedAt, latestClear) : null,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Whole months between two `YYYY-MM-DD` dates (clamped at 0). Calendar-month granularity is all the finale needs. */
function monthsBetween(fromISO: string, toISO: string): number {
  const [fy, fm] = fromISO.split('-').map(Number);
  const [ty, tm] = toISO.split('-').map(Number);
  return Math.max(0, (ty - fy) * 12 + (tm - fm));
}

/**
 * ⛔ **THE CELEBRATION IS A CLAIM ABOUT MONEY, AND IT WAS THE CLAIM SITE NOBODY WIRED.**
 * [S1.9.2 · pass-2 C3]
 *
 * Measured on ONE store at ONE instant: `selectPlanState` returned `debt-free-unverified` — Today's calm
 * banner correctly refusing *"every balance is cleared"* — while three lines away the full-screen finale
 * printed **"$12,400 paid off · 2 debts"** over a $12,000 card the app could not read. B1's owner had been
 * wired to `selectPlanState`, both `money.tsx` sites and `progress.tsx`; the loudest surface in the
 * product was the fourth.
 *
 * ⛔ **The gate is on the READ, never on `detectPayoff`.** `withPayoffCelebration`'s docblock already
 * spells out why: detection is TRANSITION-based, so a crossing not stamped is a crossing that can never be
 * detected again, and the once-ever finale would be gone for the life of the install. The record is
 * stamped and this withholds the *render* — so the moment is still there when the user re-enters the
 * number and [C1]'s reset path clears the repair.
 *
 * ⚠️ **The two kinds ask DIFFERENT questions, deliberately.** The finale asserts something about the whole
 * portfolio, so it asks the portfolio-wide guard. A beat names one debt and states that debt's own
 * figures, so it asks about that row — withholding it over an unrelated debt's repair would be the
 * over-match A1 was raised for, on the moment the product is built toward.
 *
 * ⚠️ **Called for the VARIABLE, not at the render site**, and that is load-bearing: `activeAck` ranks
 * `data-repairs` above a celebration and returns `null` while one is pending, so gating the JSX alone
 * would have left an invisible celebration suppressing the repairs card that tells the user what to fix.
 */
export function selectCelebration(store: DebtStore): PendingPayoff | null {
  const pending = store.pendingPayoff;
  if (!pending) return null;
  if (pending.kind === 'finale') return mayClaim(store, 'debt-balances') ? pending : null;
  // A beat with no `debtId` was stamped by an earlier build; the portfolio-wide question is the safe
  // fallback — see the field's own note.
  const unread = pending.debtId
    ? rowFieldUnread(store, 'debt', pending.debtId, 'balance', 'originalBalance', 'minimumPayment')
    : !mayClaim(store, 'debt-balances');
  return unread ? null : pending;
}
