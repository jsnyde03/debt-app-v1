import type {
    CompletedRecommendedAction,
    Debt,
    PayCycleSnapshot,
} from "@core/storage/debtPlannerStorage";
import { effectiveMinimumInWindow } from "@core/debt/bnplInstallment";

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

// Pure builder for a pay-cycle snapshot. Called from handleRolloverPayCycle
// with PRE-rollover state (before debts mutate or completed actions clear),
// so the snapshot reflects where the user actually was when the cycle ended.
//
// totalDebtBalance = sum of every debt's current balance.
// totalPaidThisCycle = money put toward DEBT this cycle = required minimums paid
//   + snowball extras (excludes non-debt savings; includes the minimums that the
//   old recommended-only total wrongly omitted).
// allRequiredMet = did the user complete every required action they could
//   afford this cycle (the Streak's "on plan" signal, computed by the caller).
export function buildCycleSnapshot(input: {
    cycleEndDate: string;
    debts: Debt[];
    completedRecommendedActions: CompletedRecommendedAction[];
    payoffStrategy: "snowball" | "avalanche";
    allRequiredMet: boolean;
    /**
     * The pay-cycle window this snapshot closes. ⛔ REQUIRED to report a cross-cadence BNPL correctly
     * (S1P3-A2) — omitting it falls back to one installment, which is what the defect did. The caller
     * (`payday.ts`) already has both dates in scope and passes them to `applyRolloverPayment`.
     */
    windowStartISO?: string;
    windowEndISO?: string;
}): PayCycleSnapshot {
    const {
        cycleEndDate,
        debts,
        completedRecommendedActions,
        payoffStrategy,
        allRequiredMet,
        windowStartISO,
        windowEndISO,
    } = input;

    // ⛔ THE SAME IN-WINDOW MINIMUM THE ROLLOVER DEDUCTS (S1P3-A2). This summed the raw
    // `minimumPayment` — the stored PER-INSTALLMENT amount — while every other seam in the cycle
    // (allocator, forecast, recovery plan, rollover) used the window-scaled one. A biweekly BNPL under
    // a monthly paycheck charges twice in one window, so a user whose plan asked for $200, and whose
    // balance fell by exactly $200, was told on History that they paid $100.
    // ⚠️ `Math.min(..., balance)` is kept for the NON-BNPL path, which the helper does not cap.
    const paidMinimums = debts
        .filter((debt) => debt.minimumPaidThisCycle ?? debt.isPaidThisCycle)
        .reduce(
            (sum, debt) =>
                sum +
                Math.min(
                    effectiveMinimumInWindow(debt, windowStartISO, windowEndISO),
                    debt.balance
                ),
            0
        );

    const snowballExtras = completedRecommendedActions
        .filter((action) => action.category === "snowball")
        .reduce((sum, action) => sum + action.actualAmount, 0);

    return {
        cycleEndDate,
        totalDebtBalance: roundMoney(
            debts.reduce((sum, debt) => sum + debt.balance, 0)
        ),
        totalPaidThisCycle: roundMoney(paidMinimums + snowballExtras),
        allRequiredMet,
        completedRecommendedActions,
        payoffStrategy,
    };
}
