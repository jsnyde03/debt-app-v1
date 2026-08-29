import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

/**
 * ⛔ **THE NEGATIVE-AMORTIZATION GUARD — ONE PRODUCER, FOR THE DATE AND THE CHART BOTH.**
 * [S1.11.4.5 · pass-4 blocker `A-F4`]
 *
 * ⚡ **Pass 3's `A1` corrected the losing copy and left two producers, which is reading rule 13 measured.**
 * `A1` aligned the two guards' EXPRESSION — compare the interest against the constant budget, not the
 * shrinking minimum sum — and its own comment says so: *"this is the second producer of one fact being
 * brought into line with the first."* ⛔ **What it did not align is WHEN the expression is evaluated.**
 * `projectDebtPayoff` tested the interest on the balance it was **about to** accrue;
 * `buildPayoffTrajectory` tested the interest on the balance it **had already** accrued. Accrual only
 * raises the balance, so the chart's test is strictly the harsher one and it bailed on a band of plans the
 * date engine amortizes.
 *
 * ⚡ **The band is `budget/(1 + apr/1200) ≤ monthlyInterest < budget`** — for a 25% card, a **2% window**,
 * and a minimum set at ~2% of balance is the ordinary credit-card shape. Measured over 4,000 pseudo-random
 * plans: 6 disagreements, **every one in the same direction — the date clears and the chart never does**:
 *
 * ```
 * $6,379.24 Visa @ 25.22% APR, $136 minimum, no extra
 *   interest on the CURRENT balance  = 134.07  -> the date engine amortizes
 *   balance after this month accrues = 6513.31
 *   interest on the ACCRUED balance  = 136.89  -> the chart breaks
 *   DATE  "September 2043" (205 months)   CHART  [{month: 0, balance: 6379.24}]
 * ```
 *
 * A user reads a debt-free date and, directly beneath it, a curve that never descends — the app telling
 * them in a picture that this plan will never pay the card off, with the "Visa gone" waypoint and the
 * vs-minimums gap gone with it.
 *
 * ⛔ **So it is one function called at ONE point in the month body — before the accrual — and not a third
 * corrected copy.** Every fix in this round has collapsed a pair to a single producer rather than
 * correcting the loser, because correcting the loser is what buys the next round's recurrence.
 *
 * ⚠️ **The `monthlyBudget > 0` half is load-bearing and must not be dropped.** A $0 recurring budget (an
 * all-one-time-BNPL plan with no extra) is not un-amortizable — the lumps clear via their month-1 minimum
 * — and `0 >= 0` would call it unpayable. Both call sites carried this half already; it moves here whole.
 *
 * ⚠️ Structurally typed on purpose: the two engines carry different row shapes (`ProjectedDebt` vs the
 * trajectory's pool, which also tracks `oneTimeLump`), and this reads only the two fields the question is
 * actually about.
 */
/**
 * ⛔ **THE HISTORY THIS GUARD CARRIES, MOVED WITH IT RATHER THAN DELETED.** [S1.10.6.x · pass-3 `A1`]
 *
 * COMPARE AGAINST THE BUDGET THE LOOP ACTUALLY SPENDS, NOT THE SHRINKING MINIMUM SUM (S1P3-A1).
 * This guard used to re-sum the minimums of the debts still LIVE at that month and add the extra. But
 * the loop below does not spend that number — it spends `monthlyBudget`, a CONSTANT that deliberately
 * keeps a paid-off debt's freed minimum in the pool (the defining snowball/avalanche mechanic, see the
 * comment above `totalMinimums`). So the instant the first debt cleared, this compared the remaining
 * interest against a payment total that no longer included the money actually being paid, and bailed
 * out of a plan that amortizes fine: a $2,000 car loan at 5% (min $500) plus a $10,000 Visa at 25%
 * (min $50) returned "Unable to estimate" at month 5 while `buildPayoffTrajectory` — same inputs, same
 * directory — drew that plan clearing at month 30. The Progress hero printed `—` over its own chart.
 * ⚠️ The `monthlyBudget > 0` half is NOT incidental and must not be dropped: a $0 recurring budget
 * (an all-one-time-BNPL plan with no extra) is not un-amortizable — the lumps clear via their month-1
 * minimum — and `0 >= 0` would call it unpayable. `buildPayoffTrajectory.ts:91` already had both halves;
 * this is the second producer of one fact being brought into line with the first, not a new rule.
 */
export function cannotAmortize(
	debts: readonly { balance: number; apr: number }[],
	monthlyBudget: number,
): boolean {
	if (monthlyBudget <= 0) return false;
	const monthlyInterestTotal = debts
		.filter((debt) => debt.balance > 0)
		.reduce((sum, debt) => sum + calculateMonthlyInterest(debt.balance, debt.apr), 0);
	return monthlyInterestTotal >= monthlyBudget;
}
