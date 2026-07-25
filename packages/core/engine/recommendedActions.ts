import type { allocatePaycheck } from "./allocatePaycheck";
import type { CompletedRecommendedAction, Goal } from "@core/storage/debtPlannerStorage";

type AllocationResult = ReturnType<typeof allocatePaycheck>;
type AllocationItem = AllocationResult["allocations"][number];

export type RecommendedCategory = "emergency" | "snowball" | "optional_goal";

export type RecommendationOverride = {
    targetId: string;
    category: "emergency" | "snowball";
    amount: number;
};

export type ActiveRecommendedAction = {
    key: string;
    label: string;
    category: RecommendedCategory;
    targetId: string;
    recommendedAmount: number;
    actualAmount: number;
};

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

export function computeFlexibleCash({
    paycheckAmount,
    totalRequired,
    livingExpenseReserve,
    bufferTotal,
    completedRecommendedTotal,
}: {
    paycheckAmount: number;
    totalRequired: number;
    livingExpenseReserve: number;
    bufferTotal: number;
    completedRecommendedTotal: number;
}): number {
    return roundMoney(
        Math.max(0, paycheckAmount - totalRequired - livingExpenseReserve - bufferTotal - completedRecommendedTotal)
    );
}

export function computeCompletedSnowballByDebt(
    completedActions: CompletedRecommendedAction[]
): Record<string, number> {
    return completedActions
        .filter((a) => a.category === "snowball")
        .reduce<Record<string, number>>((map, a) => {
            map[a.targetId] = roundMoney((map[a.targetId] ?? 0) + a.actualAmount);
            return map;
        }, {});
}

export function computeCompletedRecommendedTotal(
    completedActions: CompletedRecommendedAction[]
): number {
    return roundMoney(
        completedActions
            .filter((a) => a.paymentSource !== "external")
            .reduce((sum, a) => sum + a.actualAmount, 0)
    );
}

function getRecommendationMaxAmount(item: AllocationItem, goals: Goal[]): number {
    if (!item.targetId) return item.amount;

    if (item.category === "snowball") {
        return roundMoney(Math.max(0, item.amount));
    }

    if (item.category === "emergency" || item.category === "optional_goal") {
        const goal = goals.find((g) => g.id === item.targetId);
        if (!goal) return item.amount;
        const remaining = roundMoney(Math.max(0, goal.targetAmount - goal.currentAmount));
        // §2.9: a PACED sinking fund recommends only THIS cycle's set-aside (what the engine reserved),
        // not the whole goal — so the action matches the allocation and can't over-fund the plan.
        if (goal.priority === true && goal.priorityPerPaycheck != null && goal.priorityPerPaycheck > 0) {
            return roundMoney(Math.min(remaining, goal.priorityPerPaycheck));
        }
        return remaining;
    }

    return item.amount;
}

export function buildActiveRecommendedActions({
    recommendedActions,
    flexibleCashAvailable,
    goals,
    recommendationOverrides = [],
}: {
    recommendedActions: AllocationItem[];
    flexibleCashAvailable: number;
    goals: Goal[];
    recommendationOverrides?: RecommendationOverride[];
}): ActiveRecommendedAction[] {
    const result: ActiveRecommendedAction[] = [];
    let remainingCapacity = flexibleCashAvailable;

    for (const item of recommendedActions) {
        if (remainingCapacity <= 0) break;
        if (!item.targetId) continue;
        if (item.category !== "emergency" && item.category !== "snowball" && item.category !== "optional_goal") continue;

        const category = item.category as RecommendedCategory;
        const maxAmount = getRecommendationMaxAmount(item, goals);
        const override = recommendationOverrides.find(
            (o) => o.targetId === item.targetId && o.category === category
        )?.amount;

        const amount = roundMoney(Math.min(override ?? maxAmount, maxAmount, remainingCapacity));
        if (amount <= 0) continue;

        result.push({
            key: `active-${category}-${item.targetId}-${item.label}`,
            label: item.label,
            category,
            targetId: item.targetId,
            recommendedAmount: maxAmount,
            actualAmount: amount,
        });

        remainingCapacity = roundMoney(remainingCapacity - amount);
    }

    return result;
}
