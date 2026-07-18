import type { allocatePaycheck, AllocationItem } from "@core/engine/allocatePaycheck";
import type {
    Debt,
    Goal,
    RecommendationOverride,
    CompletedRecommendedAction,
} from "@core/storage/debtPlannerStorage";
import {
    buildActiveRecommendedActions,
    computeCompletedRecommendedTotal,
    computeCompletedSnowballByDebt,
    computeFlexibleCash,
    type ActiveRecommendedAction,
} from "@core/engine/recommendedActions";
import { roundMoney } from "@core/utils/money";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

/**
 * THE single source of truth for the cycle's ACTIVE recommended actions — the
 * extra-payoff / emergency allocation the Plan tab renders AND Payday Autopilot
 * captures. Computed once in page.tsx and fed to both, so the sheet and the Plan
 * tab can never drift.
 *
 * Mirrors the derivation that used to live inline in ResultsSection, but built
 * from the engine's canonical, tested functions (computeCompletedSnowballByDebt /
 * computeFlexibleCash / buildActiveRecommendedActions) instead of duplicating
 * their money-math. Optional-goal actions are a SEPARATE Plan-tab section and are
 * intentionally excluded here (matching prior behavior).
 */
export function selectActiveRecommendedActions({
    result,
    debts,
    goals,
    payoffStrategy,
    recommendationOverrides,
    completedRecommendedActions,
}: {
    result: AllocationResult;
    debts: Debt[];
    goals: Goal[];
    payoffStrategy: "snowball" | "avalanche";
    recommendationOverrides: RecommendationOverride[];
    completedRecommendedActions: CompletedRecommendedAction[];
}): ActiveRecommendedAction[] {
    // Active debts by remaining balance (after this cycle's completed snowball
    // payments), ordered by the active payoff strategy — the snowball targets.
    const completedSnowballByDebt = computeCompletedSnowballByDebt(completedRecommendedActions);
    const adjustedActiveDebts = debts
        .map((debt) => ({
            ...debt,
            balance: roundMoney(Math.max(0, debt.balance - (completedSnowballByDebt[debt.id] ?? 0))),
        }))
        .filter((debt) => debt.balance > 0)
        .sort((a, b) => {
            if (payoffStrategy === "avalanche") {
                if (b.apr !== a.apr) return b.apr - a.apr;
                return a.balance - b.balance;
            }
            return a.balance - b.balance;
        });

    const recommendedActions: AllocationItem[] = [
        ...result.allocations.filter((item) => item.category === "emergency"),
        ...adjustedActiveDebts.map((debt) => ({
            category: "snowball" as const,
            targetId: debt.id,
            debtId: debt.id,
            label: `Extra payment to ${debt.name}`,
            amount: debt.balance,
        })),
    ];

    const bufferTotal = result.allocations
        .filter((item) => item.category === "leftover" && item.label === "Keep cash buffer")
        .reduce((sum, item) => sum + item.amount, 0);

    const flexibleCashAvailable = computeFlexibleCash({
        paycheckAmount: result.paycheckAmount,
        totalRequired: result.totalRequired,
        livingExpenseReserve: result.livingExpenseReserve,
        bufferTotal,
        completedRecommendedTotal: computeCompletedRecommendedTotal(completedRecommendedActions),
    });

    return buildActiveRecommendedActions({
        recommendedActions,
        flexibleCashAvailable,
        goals,
        recommendationOverrides,
    });
}
