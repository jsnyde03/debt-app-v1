import { roundMoney } from "@core/utils/money";
import type { Debt } from "@/lib/storage/debtPlannerStorage";

export type DebtWithDisplayBalance = Debt & { displayBalance: number };

// Only the fields this derivation reads from a completed recommended action.
// Kept structural on purpose so it accepts any of the (currently several)
// CompletedRecommendedAction shapes in the codebase without coupling to one.
type CompletedSnowballAction = {
    category: string;
    targetId: string;
    actualAmount: number;
};

export function getCompletedSnowballAmount(
    debtId: string,
    completedRecommendedActions: readonly CompletedSnowballAction[]
): number {
    return completedRecommendedActions
        .filter((action) => action.category === "snowball" && action.targetId === debtId)
        .reduce((sum, action) => sum + action.actualAmount, 0);
}

function getDebtDisplayBalance(debt: Debt, completedSnowballAmount: number): number {
    const paidMinimumAmount =
        debt.minimumPaidThisCycle || debt.isPaidThisCycle
            ? Math.min(debt.minimumPayment, debt.balance)
            : 0;

    return roundMoney(Math.max(0, debt.balance - paidMinimumAmount - completedSnowballAmount));
}

/**
 * Derives each debt's display balance (original balance minus this cycle's paid
 * minimum and any completed snowball payments) and splits the list into active
 * vs. paid-off. Pure — extracted verbatim from `page.tsx` (2.18 Phase 1); no
 * behaviour change.
 */
export function getDebtsWithDisplayBalances(
    debts: Debt[],
    completedRecommendedActions: readonly CompletedSnowballAction[]
): {
    debtsWithDisplayBalances: DebtWithDisplayBalance[];
    activeDebts: DebtWithDisplayBalance[];
    paidOffDebts: DebtWithDisplayBalance[];
} {
    const debtsWithDisplayBalances: DebtWithDisplayBalance[] = debts.map((debt) => ({
        ...debt,
        displayBalance: getDebtDisplayBalance(
            debt,
            getCompletedSnowballAmount(debt.id, completedRecommendedActions)
        ),
    }));

    return {
        debtsWithDisplayBalances,
        activeDebts: debtsWithDisplayBalances.filter((debt) => debt.displayBalance > 0),
        paidOffDebts: debtsWithDisplayBalances.filter((debt) => debt.displayBalance <= 0),
    };
}
