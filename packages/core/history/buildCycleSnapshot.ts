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
     * The pay-cycle window this snapshot closes.
     *
     * ⛔ **S1.11.5.4 [pass-4 `A-F1`] — REQUIRED, AND THE TYPE IS WHAT MAKES IT SO.** These two were
     * optional until now, so omitting them fell back to one installment — which is what blocker `A2` did.
     * Measured: delete both arguments from the only shipping call (`payday.ts`) and **all three suites
     * stay green** —
     * `test:regression`, `test:app`, `test:scenarios` — re-introducing blocker `A2`, History telling a
     * user who paid $200 that they paid $100.
     *
     * ⚡ **The registered guard `S1P3-A2-INWINDOW` is structurally incapable of seeing it**: it calls this
     * function *with* the window, so it is pinned to the HELPER's behaviour. Un-fixing the helper reds it;
     * un-fixing the CALL does not. `D3-3`'s shape — right about the line that computes, blind to the line
     * that uses.
     *
     * ⛔ **So the guard is the type.** A required field turns the deletion into a compile error, which is
     * the one guard that cannot be routed around by an edit that looks reasonable. Both live callers had
     * the dates in scope already — the legacy tree's simply never passed them, which is that tree's own
     * copy of `A2`, fixed here on the way past.
     *
     * ⚠️ REQUIRED to report a cross-cadence BNPL correctly (S1P3-A2).
     */
    windowStartISO: string;
    windowEndISO: string;
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
