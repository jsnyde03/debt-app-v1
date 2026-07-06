import type { CompletedRecommendedAction } from "@/lib/storage/debtPlannerStorage";

export type RecommendedActionInput = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    recommendedAmount: number;
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
 * gets `actualAmount === recommendedAmount`, `paymentSource: "paycheck"`. The
 * downstream write (`handleMarkRecommendedAction`, reconciliation-safe per step
 * 1.4) and the cash-exclusion of `paymentSource: "external"`
 * (`computeCompletedRecommendedTotal`) are unchanged — this only builds the inputs.
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
                actualAmount: o.actualAmount ?? a.recommendedAmount,
                paymentSource,
            };
        });
}
