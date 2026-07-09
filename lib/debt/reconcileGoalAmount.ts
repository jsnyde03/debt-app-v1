import { roundMoney } from "@/lib/utils/money";

/**
 * Pure goal-fund reconciliation for marking / unmarking a recommended action
 * against a savings goal (emergency / optional_goal). Extracted from
 * page.tsx's `handleMarkRecommendedAction` so this money path is unit-testable
 * (the full handler extraction — backup coupling etc. — stays for v1.7).
 *
 * THE INVARIANT this exists to guarantee (the reconciliation gate): unmarking
 * EXACTLY reverses marking —
 *     unmarkGoal(markGoal(c, t, a).nextCurrentAmount, markGoal(c, t, a).appliedAmount) === c
 * for ALL currentAmount / targetAmount / requestedAmount, INCLUDING an
 * over-funded goal (currentAmount > targetAmount, reachable by lowering a goal's
 * target after it was funded).
 *
 * The old inline mark wrote `min(targetAmount, current + safe)`. When a goal was
 * over-funded that `min` silently clamped `currentAmount` DOWN to `targetAmount`
 * — a reduction never recorded in the stored amount, so unmark could not restore
 * it (money quietly lost). Because `appliedAmount` is already clamped to the
 * remaining room, `current + appliedAmount` never overshoots target in the
 * normal path, so marking is a pure `+=` of the applied amount — which makes
 * mark and unmark exact inverses. Do NOT re-introduce a `min(targetAmount, …)`
 * here; correct over-funding at the goal-EDIT site, not on this reversible path.
 */
export function markGoal(
    currentAmount: number,
    targetAmount: number,
    requestedAmount: number
): { appliedAmount: number; nextCurrentAmount: number } {
    const remainingRoom = roundMoney(Math.max(0, targetAmount - currentAmount));
    const appliedAmount = roundMoney(Math.min(roundMoney(requestedAmount), remainingRoom));
    const nextCurrentAmount = roundMoney(currentAmount + appliedAmount);
    return { appliedAmount, nextCurrentAmount };
}

/** Reverse a mark: subtract the stored applied amount, floored at 0. */
export function unmarkGoal(currentAmount: number, appliedAmount: number): number {
    return roundMoney(Math.max(0, currentAmount - appliedAmount));
}
