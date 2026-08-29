import type { DebtStore, PendingPayoff } from '@/data/models';

import { clearedDebts, liveDebts, mayClaim, rowFieldUnread } from '@/store/trustSelectors';

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

/**
 * The archive: every debt confirmed to $0, most-recently-cleared first.
 *
 * ⛔ **AN UNREADABLE `originalBalance` IS EXACTLY THE `null` THIS CONTRACT ALREADY MEANS.**
 * [S1.10.6.2 · pass-3 C-4] A repaired one is `0`, not absent, so `?? null` never fired and the shelf filed
 * a $12,000 card as **"Chase · $0 paid off"** — on the permanent trophy shelf, and in a Share string
 * reading *"I paid off 2 debts ($400) on my way to debt-free 🎉"*. ⚡ **The pass-2 fix had already routed
 * `originalBalance` to `'debt-balances'` and written down why** — *"the finale states '$12,400 paid off',
 * which `selectCelebrationStats` sums from exactly that field"* — while `progress.tsx:173` gated the shelf
 * on `hasUnreadDebtBalances`, which asks only about `balance`. Two owners for one claim, disagreeing on
 * precisely the field the fix added.
 *
 * ⚠️ **Fixed HERE rather than by widening `hasUnreadDebtBalances`**, and the direction matters: that guard
 * is correctly narrow for its other two consumers — the graduation banner and `money.tsx:371`'s "Every
 * balance cleared" are claims purely about balances, and widening it would gag them over a store whose
 * balances were all read perfectly. That is a true statement withheld, the failure `progress.tsx:186-196`
 * records having made once already. ⛔ **And it fixes BOTH mount points**: `progress.tsx:346` renders this
 * same shelf on the ordinary payoff screen with no trust check of any kind, so a user who has cleared one
 * card and still owes another was reading "$0 paid off" without needing to be debt-free at all.
 */
export function selectPaidOffDebts(store: DebtStore): PaidOffDebt[] {
  // ⛔ S1.11.4.2 [pass-4 blocker `C4-2`] — MEMBERSHIP, not just the amount. `C-4` guarded the FIGURE
  // (`originalBalance`) at both mount points and the docblock above claims it "fixes BOTH mount points";
  // measured, it fixes the figure at both and the membership at neither. `d.balance <= 0` is the one test
  // a repaired balance passes, so a $12,000 card the user owes in full walked onto the permanent trophy
  // shelf reading "Chase — $12,000 paid off", with a Share button composing it into a sentence.
  return clearedDebts(store)
    .map((d) => ({
      id: d.id,
      name: d.name,
      amount: rowFieldUnread(store, 'debt-balances', 'debt', d.id, 'originalBalance')
        ? null
        : (d.originalBalance ?? null),
      clearedDate: d.lastVerifiedDate ?? d.balanceAsOfDate ?? null,
      isBnpl: d.type === 'bnpl',
    }))
    .sort((a, b) => (b.clearedDate ?? '').localeCompare(a.clearedDate ?? ''));
}

/**
 * True when `id` is the LAST live debt — confirming it to $0 makes the user debt-free. Called at confirm
 * time (BEFORE the store mutates, while `id` still has a balance) to choose the per-debt beat vs the finale.
 */
export function isLastLiveDebt(store: DebtStore, id: string): boolean {
  // ⛔ S1.11.4.2 [pass-4 `C4-2`, sibling] — took a `Debt[]` and re-spelled `balance > 0`, so a balance the
  // reader lost left the live list and this answered TRUE on a portfolio still owing $12,000. Measured on
  // `C4-2`'s own store. ⚠️ Latent rather than shipped — grep finds no production consumer today — but a
  // helper that is wrong when someone finally calls it is worse than one that does not exist.
  //
  // ⛔ **ROUTING IT THROUGH `liveDebts` WAS NOT THE FIX, AND THE TEST SAID SO BY FAILING.** `liveDebts` is
  // the owner of the EXPRESSION and is deliberately silent about the unread case — its own docblock:
  // *"a portfolio that is entirely unread returns `[]` here exactly as a paid-off one does… branch copy
  // from `debtLiveness`."* This function branches, so it owes the claim question, not the array.
  //
  // ⚠️ `mayClaim('debt-balances')` and not `hasUnreadDebtBalances`, because this decides the FINALE and
  // `selectCelebration` gates the finale on exactly that claim — one producer for one question. It is the
  // wider of the two (it carries `originalBalance`), which is right here and wrong for liveness: `F-B4`
  // measured that distinction in the other direction, on the other question.
  if (!mayClaim(store, 'debt-balances')) return false;
  const live = liveDebts(store);
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
  // ⛔ S1.11.4.2 [pass-4 `C4-2`, sibling in the same file] — `debtsCleared` read **1** against a true **0**
  // on `C4-2`'s store. Gated at the render by `selectCelebration`, so it is latent rather than shipped;
  // the count is still wrong at the source, and "the fix reached the instance reported and left a sibling
  // asserting on the same store" is the class this whole round is about.
  const cleared = clearedDebts(store);

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
    ? rowFieldUnread(store, 'row-figures', 'debt', pending.debtId, 'balance', 'originalBalance', 'minimumPayment')
    : !mayClaim(store, 'debt-balances');
  return unread ? null : pending;
}
