import { roundMoney } from "@core/utils/money";
import type { Debt } from "@core/storage/debtPlannerStorage";

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
    // ⚠️ **`||` IS DELIBERATE HERE, AND pass-3 `A5`'s REMEDY TO MAKE IT `??` WAS REFUSED.**
    // [S1.10.6.7.2 · A5] The finding is right that this is the tree's only `||` on this pair — measured,
    // one site against thirty. It is wrong that the thirty are doing the same job.
    //
    // ⚡ **The two spellings answer DIFFERENT questions.** The `??` sites are a MIGRATION fallback: read
    // the [D2] owner, fall back to the legacy field only when the owner is **absent**, i.e. a pre-[D2]
    // persisted store. This line is a DOMAIN OR: subtract the minimum when the minimum was paid **or the
    // whole debt was paid**, which the test beside it states outright — *"isPaidThisCycle also triggers
    // the minimum subtraction (either flag counts)"*.
    //
    // ⛔ Switching to `??` makes a debt paid IN FULL, carrying `minimumPaidThisCycle: false`, display its
    // FULL balance — measured: `testGetDebtsWithDisplayBalances` reds with *"expected 950, received
    // 1000"*. A debt paid in full has necessarily covered its minimum.
    //
    // ⚠️ **What is genuinely open is which record wins when the two flags CONTRADICT** (`false` beside
    // `true`, which `markDebtMinimumPaid(id, false)` can produce). That is a money-semantics call on data
    // Phase 5 migrates, and `bulkMarkRequired.ts`'s own header already routes exactly this class to the
    // **Phase-6 financial-correctness gate** — so it is filed to P6.10, not decided here. This module is
    // legacy-only and P6.11 deletes it, so nothing ships on the answer either way.
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
