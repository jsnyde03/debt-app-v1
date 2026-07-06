import { markGoal } from "./reconcileGoalAmount";
import type { Goal, CompletedRecommendedAction } from "@/lib/storage/debtPlannerStorage";

/**
 * Bulk-apply a payday capture: fund each goal action and append all captured
 * actions to the completed list, in ONE pass. This is the multi-item analogue of
 * `handleMarkRecommendedAction`'s mark path — it exists because looping that
 * handler would setState off stale closures (only the last item would stick).
 *
 * Goal actions (emergency / optional_goal) run through the reconciliation-safe
 * `markGoal` (step 1.4): the goal's currentAmount gets the clamped applied amount
 * and the STORED actualAmount is that same applied amount, so a later un-capture
 * reconciles exactly. Snowball actions carry no goal side-effect. Funding happens
 * regardless of paymentSource (external still funds the goal; it's only excluded
 * from the paycheck CASH total downstream).
 */
export function applyPaydayCapture(
    items: CompletedRecommendedAction[],
    goals: Goal[],
    completedRecommendedActions: CompletedRecommendedAction[]
): { nextGoals: Goal[]; nextCompleted: CompletedRecommendedAction[] } {
    let nextGoals = goals;

    const captured = items.map((item) => {
        if (item.category === "emergency" || item.category === "optional_goal") {
            const goal = nextGoals.find((g) => g.id === item.targetId);
            if (goal) {
                const { appliedAmount, nextCurrentAmount } = markGoal(
                    goal.currentAmount,
                    goal.targetAmount,
                    item.actualAmount
                );
                nextGoals = nextGoals.map((g) =>
                    g.id === item.targetId ? { ...g, currentAmount: nextCurrentAmount } : g
                );
                return { ...item, actualAmount: appliedAmount };
            }
        }
        return item;
    });

    return { nextGoals, nextCompleted: [...completedRecommendedActions, ...captured] };
}
