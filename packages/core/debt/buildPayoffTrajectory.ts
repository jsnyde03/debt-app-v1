import { bnplMonthlyEquivalentMinimum, isOneTimeBnplLump } from "./bnplPayoffPace";
import { calculateMonthlyInterest } from "./calculateMonthlyInterest";
import { cannotAmortize } from "./cannotAmortize";

export type TrajectoryPoint = { month: number; balance: number };
/** The month a single debt's balance first reaches zero (for per-debt "Visa gone — Aug 2027" waypoints). */
export type DebtClearPoint = { id?: string; name?: string; month: number };

/**
 * The debt shape this simulation needs. **Exported so callers share it instead of re-declaring it** —
 * 3.7.A6a: `buildDriftBaseline` had its own narrower copy that omitted `recurrence`, then passed its
 * array straight into here. Correct at runtime (callers pass whole `Debt` objects), but the declared
 * type said the field was absent, so a `.map()` that dropped it would have type-checked clean and
 * silently un-rated every BNPL by cadence. Two functions in one directory disagreeing about what a
 * debt is; one exported type is what stops that recurring.
 *
 * `recurrence` is required to rate BNPL by cadence, matching projectDebtPayoff (R2.1). `id`/`name` are
 * used only for waypoints.
 */
export type PayoffSimDebt = { id?: string; name?: string; balance: number; minimumPayment: number; apr: number; type?: string; recurrence?: string };

type SimInput = {
    debts: PayoffSimDebt[];
    monthlyExtraPayment: number;
    strategy: "snowball" | "avalanche";
};

/**
 * The full payoff simulation: the total-balance curve AND the month each individual debt clears. The
 * pool already pays debts off one-by-one (snowball/avalanche) — this just records WHEN each hits zero,
 * which the old total-only return threw away. `buildPayoffTrajectory` stays a thin points-only wrapper
 * so every existing caller and test is untouched.
 */
export function simulatePayoff({ debts, monthlyExtraPayment, strategy }: SimInput): { points: TrajectoryPoint[]; clears: DebtClearPoint[] } {
    type DebtState = { balance: number; minimumPayment: number; apr: number; oneTimeLump: boolean };

    // `meta` stays index-aligned to `pool` so a cleared pool slot maps back to its debt's id/name.
    const meta: { id?: string; name?: string }[] = [];
    const pool: DebtState[] = debts
        .filter((d) => d.balance > 0)
        .map((d) => {
            meta.push({ id: d.id, name: d.name });
            return {
                balance: d.balance,
                // Rate BNPL by cadence (monthly-equivalent), the same as projectDebtPayoff, so the chart and
                // the debt-free date agree (R2.1). Non-BNPL minimums are unchanged.
                minimumPayment: d.type === "bnpl" ? bnplMonthlyEquivalentMinimum(d) : d.minimumPayment,
                apr: d.type === "bnpl" ? 0 : (d.apr ?? 0),
                oneTimeLump: isOneTimeBnplLump(d),
            };
        });

    if (pool.length === 0) return { points: [{ month: 0, balance: 0 }], clears: [] };

    // First month each pool debt hits zero (null = never clears within the horizon).
    const clearedMonth: Array<number | null> = pool.map(() => null);
    const recordClears = (month: number) => {
        for (let i = 0; i < pool.length; i++) {
            if (clearedMonth[i] === null && pool[i].balance <= 0.01) clearedMonth[i] = month;
        }
    };

    const startingBalance = pool.reduce((s, d) => s + d.balance, 0);
    const points: TrajectoryPoint[] = [{ month: 0, balance: startingBalance }];

    // Constant monthly outflow so a paid-off debt's freed minimum rolls onto the
    // next target (the defining snowball/avalanche behavior). pool length is
    // fixed and minimums never change, so this stays constant.
    // One-time BNPL lumps clear in month 1 but stay OUT of the recurring budget (no phantom freed cash — R2.2).
    const totalMinimums = pool.reduce((s, d) => s + (d.oneTimeLump ? 0 : d.minimumPayment), 0);
    const monthlyBudget = totalMinimums + Math.max(0, monthlyExtraPayment);

    // Match projectDebtPayoff's 600-month horizon so the chart reaches zero for any
    // plan that reports an estimable debt-free date. The old 120 cap left long
    // payoffs (>10yr) flattening above zero, contradicting the date shown (#4). The
    // loop still breaks early the moment the balance clears, so short plans are unaffected.
    for (let month = 1; month <= 600; month++) {
        /**
         * ⛔ **S1.11.4.5 [pass-4 blocker `A-F4`] — THE SAME GUARD, AT THE SAME POINT IN THE MONTH, FROM
         * THE SAME OWNER.** This ran AFTER the accrual below while `projectDebtPayoff` ran it BEFORE.
         * Accrual only raises the balance, so this test was strictly the harsher one and the chart bailed
         * on a band of plans the date engine amortizes — `budget/(1 + apr/1200) ≤ interest < budget`,
         * which for a 25% card is a **2% window**, and a minimum set at ~2% of balance is the ordinary
         * credit-card shape. Measured over 4,000 pseudo-random plans: 6 disagreements, **all in the same
         * direction**. A $6,379.24 Visa at 25.22% paying its $136 minimum read *"September 2043"* over a
         * curve that is a single point at the full balance and never descends.
         *
         * ⚠️ `A1` corrected this pair's EXPRESSION and left them two producers; the half it did not align
         * was WHEN. There is one producer now — moving the call is only half the fix, and importing it is
         * the other half.
         */
        if (cannotAmortize(pool, monthlyBudget)) break;

        for (let i = 0; i < pool.length; i++) {
            if (pool[i].balance > 0) {
                pool[i] = {
                    ...pool[i],
                    balance: pool[i].balance + calculateMonthlyInterest(pool[i].balance, pool[i].apr),
                };
            }
        }

        let minimumsPaidThisMonth = 0;
        for (let i = 0; i < pool.length; i++) {
            if (pool[i].balance > 0) {
                const payment = Math.min(pool[i].minimumPayment, pool[i].balance);
                // One-time lump: clear it, but don't debit the extra pool (match projectDebtPayoff — R2.2).
                if (!pool[i].oneTimeLump) minimumsPaidThisMonth += payment;
                pool[i] = { ...pool[i], balance: Math.max(0, pool[i].balance - payment) };
            }
        }

        // Freed minimums (from paid-off debts) + the extra all roll onto the target.
        let extra = Math.max(0, monthlyBudget - minimumsPaidThisMonth);
        while (extra > 0.01) {
            let targetIdx = -1;
            for (let i = 0; i < pool.length; i++) {
                if (pool[i].balance <= 0) continue;
                if (targetIdx === -1) { targetIdx = i; continue; }
                const cur = pool[targetIdx];
                const cand = pool[i];
                if (strategy === "avalanche") {
                    if (cand.apr > cur.apr || (cand.apr === cur.apr && cand.balance < cur.balance)) {
                        targetIdx = i;
                    }
                } else {
                    if (cand.balance < cur.balance) targetIdx = i;
                }
            }
            if (targetIdx === -1) break;
            const payment = Math.min(extra, pool[targetIdx].balance);
            pool[targetIdx] = { ...pool[targetIdx], balance: Math.max(0, pool[targetIdx].balance - payment) };
            extra -= payment;
        }

        const totalBalance = pool.reduce((s, d) => s + d.balance, 0);
        points.push({ month, balance: Math.max(0, totalBalance) });
        recordClears(month);
        if (totalBalance <= 0.01) break;
    }

    const clears: DebtClearPoint[] = [];
    for (let i = 0; i < pool.length; i++) {
        if (clearedMonth[i] !== null) clears.push({ ...meta[i], month: clearedMonth[i]! });
    }
    return { points, clears };
}

/** Points-only view of the simulation — the long-standing signature every caller/test already uses. */
export function buildPayoffTrajectory(args: SimInput): TrajectoryPoint[] {
    return simulatePayoff(args).points;
}
