import type { CompletedRecommendedAction } from "@core/storage/debtPlannerStorage";

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
    /** The user marked this recommended payment as NOT made — it's excluded from
     *  the capture (never recorded as completed). Filtered out before this builder. */
    skipped?: boolean;
};

/** targetId|label|category — the same identity `handleMarkRecommendedAction` dedups on. */
export function captureKey(a: { targetId: string; label: string; category: string }): string {
    return `${a.targetId}|${a.label}|${a.category}`;
}

/**
 * Pure core of Payday Autopilot capture: map the cycle's ACTIVE recommended
 * actions (+ optional per-item overrides) to the `CompletedRecommendedAction`
 * inputs to mark.
 *
 * The input is the selector's ACTIVE list, which is already the net-REMAINING
 * recommendation (it subtracts this cycle's completed snowball from debt balances
 * and completed cash from capacity). So every active item is a real remaining
 * contribution and MUST be captured — there is nothing to skip. (The prior
 * `alreadyCompleted` skip was the v1.6 collision bug: a re-recommended remainder
 * shares `targetId|label|category` with its completed partial, so the skip
 * silently dropped a contribution the sheet displayed. Accumulation across the
 * partial and the remainder now happens downstream via `upsertCompletedAction`.)
 *
 * One-tap "I followed the plan" = no overrides → every active action gets
 * `actualAmount = the cycle's recommended payment`, `paymentSource: "paycheck"`
 * (with `recommendedAmount` = the full payoff room, matching the Plan tab so drift
 * is consistent across capture paths). Adjust overrides the paid amount / marks
 * external. The cash-exclusion of `paymentSource: "external"`
 * (`computeCompletedRecommendedTotal`) is unchanged — this only builds the inputs.
 */
export function buildPaydayCaptureItems(
    recommendedActions: RecommendedActionInput[],
    overrides: Record<string, PaydayCaptureOverride> = {}
): CompletedRecommendedAction[] {
    return recommendedActions.map((a) => {
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
