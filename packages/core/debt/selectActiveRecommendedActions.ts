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

    // §2.5 (2.4.7.6): the starter + fuller EF are two waterfall tranches of the SAME goal — merge them
    // into ONE "Add to Emergency Fund" recommended action (the tranche split is internal to the allocation
    // order; the user just funds their fund). `getRecommendationMaxAmount` drives the amount off the goal.
    const efItems = result.allocations.filter((item) => item.category === "emergency" || item.category === "starter_emergency");
    const mergedEmergency: AllocationItem[] = efItems.length > 0 ? [{ ...efItems[0], category: "emergency" }] : [];

    // §2.9: ONLY an opt-in sinking fund (a PRIORITY savings goal) surfaces before debt — it funds before the
    // snowball in `allocatePaycheck`, so it must also show as a plan action ahead of the extra-debt items and
    // consume flexible-cash capacity first (matching the allocation order). A NORMAL savings goal is NOT
    // surfaced here — normal debt payoff keeps optional goals after debt (Jason 2026-07-25).
    // `buildActiveRecommendedActions` already handles `optional_goal`.
    const priorityGoalIds = new Set(goals.filter((g) => g.priority === true).map((g) => g.id));
    const sinkingFundItems = result.allocations.filter(
        (item) => item.category === "optional_goal" && item.targetId != null && priorityGoalIds.has(item.targetId)
    );

    const recommendedActions: AllocationItem[] = [
        ...mergedEmergency,
        ...sinkingFundItems,
        ...adjustedActiveDebts.map((debt) => ({
            category: "snowball" as const,
            targetId: debt.id,
            debtId: debt.id,
            label: `Extra payment to ${debt.name}`,
            amount: debt.balance,
        })),
    ];

    // The non-deployable reserved cushion = the floor buffer + the §2.0 held reserves (2.4.6.1.3:
    // discovery/cold-start + prefunded). Subtracting all of it from flexible cash keeps the recommended
    // surface from offering to deploy money the plan is holding back. `true_leftover` is excluded — it's
    // the residual AFTER recommendations, not a reservation.
    const bufferTotal = result.allocations
        .filter(
            (item) =>
                item.category === "cushion_buffer" ||
                item.category === "discovery_holdback" ||
                item.category === "prefunded_reserve"
        )
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
