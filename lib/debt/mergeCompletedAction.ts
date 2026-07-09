import type { CompletedRecommendedAction } from "@/lib/storage/debtPlannerStorage";

/**
 * Identity for a completed recommended action INCLUDING its payment source.
 *
 * A goal/debt can legitimately hold more than one contribution in a single cycle:
 * a partial (or an external) payment, then the re-recommended REMAINDER the engine
 * surfaces once room/capacity remains (see selectActiveRecommendedActions). Those
 * must accumulate — but a paycheck-funded contribution and an external one have to
 * stay DISTINCT, because external is excluded from the paycheck cash total
 * (computeCompletedRecommendedTotal). So the identity is keyed on source too, and a
 * goal/debt holds at most one paycheck entry + one external entry per cycle.
 *
 * This is the fix for the v1.6 capture-collision bug: the old `targetId|label|
 * category` identity let a re-recommended remainder collide with its completed
 * partial, so payday capture silently skipped it and the Plan tab un-marked the
 * partial instead of adding the remainder.
 */
export function completedActionKey(
    a: Pick<CompletedRecommendedAction, "targetId" | "label" | "category" | "paymentSource">
): string {
    return `${a.targetId}|${a.label}|${a.category}|${a.paymentSource}`;
}

/**
 * Accumulate a newly marked/captured action into the completed list: if a same
 * (target|label|category|source) action already exists this cycle, sum its
 * `actualAmount` (a partial + its re-recommended remainder); otherwise append.
 * Keeps at most one entry per (key + source) so marking, capture, and un-marking
 * all stay unambiguous. `recommendedAmount` (the full payoff room, for drift) does
 * not grow as you pay it down, so the reference keeps the larger of the two.
 */
export function upsertCompletedAction(
    list: CompletedRecommendedAction[],
    action: CompletedRecommendedAction
): CompletedRecommendedAction[] {
    const key = completedActionKey(action);
    const idx = list.findIndex((a) => completedActionKey(a) === key);

    if (idx === -1) {
        return [...list, action];
    }

    const existing = list[idx];
    const merged: CompletedRecommendedAction = {
        ...existing,
        actualAmount: existing.actualAmount + action.actualAmount,
        recommendedAmount: Math.max(existing.recommendedAmount, action.recommendedAmount),
    };

    return list.map((a, i) => (i === idx ? merged : a));
}
