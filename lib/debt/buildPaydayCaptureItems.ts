import type { CompletedRecommendedAction } from "@/lib/storage/debtPlannerStorage";

export type RecommendedActionInput = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    /** The engine's max recommendation (full payoff room) — stored for drift. */
    recommendedAmount: number;
    /** The amount recommended to pay THIS cycle (capacity-limited) — the default
     *  "followed the plan" paid amount. Matches what the Plan tab stores. */
    actualAmount: number;
};

/** Per-item deviation a user records in the payday sheet's "Adjust" path. */
export type PaydayCaptureOverride = {
    /** The real amount, when it differed from the recommended amount. */
    actualAmount?: number;
    /** Paid from outside this paycheck (counts toward debt/goal progress, NOT this paycheck's cash). */
    external?: boolean;
};

/** targetId|label|category — the same identity `handleMarkRecommendedAction` dedups on. */
export function captureKey(a: { targetId: string; label: string; category: string }): string {
    return `${a.targetId}|${a.label}|${a.category}`;
}

/**
 * Pure core of Payday Autopilot capture: map the cycle's recommended actions
 * (+ optional per-item overrides) to the `CompletedRecommendedAction` inputs to
 * mark. Actions ALREADY captured this cycle are skipped — capture is idempotent,
 * never double-counting a goal/debt.
 *
 * One-tap "I followed the plan" = no overrides → every not-yet-captured action
 * gets `actualAmount = the cycle's recommended payment`, `paymentSource: "paycheck"`
 * (with `recommendedAmount` = the full payoff room, matching the Plan tab so drift
 * is consistent across capture paths). Adjust overrides the paid amount / marks
 * external. The cash-exclusion of `paymentSource: "external"`
 * (`computeCompletedRecommendedTotal`) is unchanged — this only builds the inputs.
 */
export function buildPaydayCaptureItems(
    recommendedActions: RecommendedActionInput[],
    alreadyCompleted: Pick<CompletedRecommendedAction, "targetId" | "label" | "category">[],
    overrides: Record<string, PaydayCaptureOverride> = {}
): CompletedRecommendedAction[] {
    const done = new Set(alreadyCompleted.map(captureKey));
    return recommendedActions
        .filter((a) => !done.has(captureKey(a)))
        .map((a) => {
            const o = overrides[captureKey(a)] ?? {};
            const paymentSource: "paycheck" | "external" = o.external ? "external" : "paycheck";
            return {
                targetId: a.targetId,
                label: a.label,
                category: a.category,
                recommendedAmount: a.recommendedAmount,
                actualAmount: o.actualAmount ?? a.actualAmount,
                paymentSource,
            };
        });
}
