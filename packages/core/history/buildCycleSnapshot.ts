import type {
    CompletedRecommendedAction,
    Debt,
    PayCycleSnapshot,
} from "@core/storage/debtPlannerStorage";

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
}): PayCycleSnapshot {
    const {
        cycleEndDate,
        debts,
        completedRecommendedActions,
        payoffStrategy,
        allRequiredMet,
    } = input;

    const paidMinimums = debts
        .filter((debt) => debt.minimumPaidThisCycle ?? debt.isPaidThisCycle)
        .reduce((sum, debt) => sum + Math.min(debt.minimumPayment, debt.balance), 0);

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
