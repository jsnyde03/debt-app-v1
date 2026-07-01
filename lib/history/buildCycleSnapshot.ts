import type {
    CompletedRecommendedAction,
    Debt,
    PayCycleSnapshot,
} from "@/lib/storage/debtPlannerStorage";

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

// Pure builder for a pay-cycle snapshot. Called from handleRolloverPayCycle
// with PRE-rollover state (before debts mutate or completed actions clear),
// so the snapshot reflects where the user actually was when the cycle ended.
//
// totalDebtBalance = sum of every debt's current balance.
// totalPaidThisCycle = sum of every completed recommended action's actual
//   amount - the app's existing "what you put toward the plan this cycle".
// recommendedThisCycle = what the plan asked for (snowball + emergency +
//   optional-goal); the Streak counts cycles where paid >= recommended.
export function buildCycleSnapshot(input: {
    cycleEndDate: string;
    debts: Debt[];
    completedRecommendedActions: CompletedRecommendedAction[];
    payoffStrategy: "snowball" | "avalanche";
    recommendedThisCycle: number;
}): PayCycleSnapshot {
    const {
        cycleEndDate,
        debts,
        completedRecommendedActions,
        payoffStrategy,
        recommendedThisCycle,
    } = input;

    return {
        cycleEndDate,
        totalDebtBalance: roundMoney(
            debts.reduce((sum, debt) => sum + debt.balance, 0)
        ),
        totalPaidThisCycle: roundMoney(
            completedRecommendedActions.reduce(
                (sum, action) => sum + action.actualAmount,
                0
            )
        ),
        recommendedThisCycle: roundMoney(Math.max(0, recommendedThisCycle)),
        completedRecommendedActions,
        payoffStrategy,
    };
}
