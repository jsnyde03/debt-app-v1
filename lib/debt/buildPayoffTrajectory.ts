import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

export type TrajectoryPoint = { month: number; balance: number };

export function buildPayoffTrajectory({
    debts,
    monthlyExtraPayment,
    strategy,
}: {
    debts: Array<{ balance: number; minimumPayment: number; apr: number; type?: string }>;
    monthlyExtraPayment: number;
    strategy: "snowball" | "avalanche";
}): TrajectoryPoint[] {
    type DebtState = { balance: number; minimumPayment: number; apr: number };

    const pool: DebtState[] = debts
        .filter((d) => d.balance > 0)
        .map((d) => ({
            balance: d.balance,
            minimumPayment: d.minimumPayment,
            apr: d.type === "bnpl" ? 0 : (d.apr ?? 0),
        }));

    if (pool.length === 0) return [{ month: 0, balance: 0 }];

    const startingBalance = pool.reduce((s, d) => s + d.balance, 0);
    const points: TrajectoryPoint[] = [{ month: 0, balance: startingBalance }];

    for (let month = 1; month <= 120; month++) {
        for (let i = 0; i < pool.length; i++) {
            if (pool[i].balance > 0) {
                pool[i] = {
                    ...pool[i],
                    balance: pool[i].balance + calculateMonthlyInterest(pool[i].balance, pool[i].apr),
                };
            }
        }

        const totalInterest = pool.reduce((s, d) => s + calculateMonthlyInterest(d.balance, d.apr), 0);
        const totalPayments = pool.reduce((s, d) => s + d.minimumPayment, 0) + monthlyExtraPayment;
        if (totalInterest >= totalPayments) break;

        for (let i = 0; i < pool.length; i++) {
            if (pool[i].balance > 0) {
                const payment = Math.min(pool[i].minimumPayment, pool[i].balance);
                pool[i] = { ...pool[i], balance: Math.max(0, pool[i].balance - payment) };
            }
        }

        let extra = Math.max(0, monthlyExtraPayment);
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
