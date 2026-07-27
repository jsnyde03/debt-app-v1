import { bnplMonthlyEquivalentMinimum, isOneTimeBnplLump } from "./bnplPayoffPace";
import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

export type TrajectoryPoint = { month: number; balance: number };

export function buildPayoffTrajectory({
    debts,
    monthlyExtraPayment,
    strategy,
}: {
    // `recurrence` is required to rate BNPL by cadence, matching projectDebtPayoff (R2.1). Callers pass
    // full Debt objects, so it's present at runtime.
    debts: Array<{ balance: number; minimumPayment: number; apr: number; type?: string; recurrence?: string }>;
    monthlyExtraPayment: number;
    strategy: "snowball" | "avalanche";
}): TrajectoryPoint[] {
    type DebtState = { balance: number; minimumPayment: number; apr: number; oneTimeLump: boolean };

    const pool: DebtState[] = debts
        .filter((d) => d.balance > 0)
        .map((d) => ({
            balance: d.balance,
            // Rate BNPL by cadence (monthly-equivalent), the same as projectDebtPayoff, so the chart and
            // the debt-free date agree (R2.1). Non-BNPL minimums are unchanged.
            minimumPayment: d.type === "bnpl" ? bnplMonthlyEquivalentMinimum(d) : d.minimumPayment,
            apr: d.type === "bnpl" ? 0 : (d.apr ?? 0),
            oneTimeLump: isOneTimeBnplLump(d),
        }));

    if (pool.length === 0) return [{ month: 0, balance: 0 }];

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
        for (let i = 0; i < pool.length; i++) {
            if (pool[i].balance > 0) {
                pool[i] = {
                    ...pool[i],
                    balance: pool[i].balance + calculateMonthlyInterest(pool[i].balance, pool[i].apr),
                };
            }
        }

        // Negative-amortization guard, but ONLY when there's a recurring budget to compare against — a
        // $0 recurring budget (e.g. an all-one-time-BNPL plan with no extra) is not un-amortizable; the
        // lumps still clear via their month-1 minimum below. Without the `> 0` guard, `0 >= 0` broke the
        // curve pre-payment and it flatlined while the date said month 1 (round-3 Finding 1).
        const totalInterest = pool.reduce((s, d) => s + calculateMonthlyInterest(d.balance, d.apr), 0);
        if (monthlyBudget > 0 && totalInterest >= monthlyBudget) break;

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
        if (totalBalance <= 0.01) break;
    }

    return points;
}
