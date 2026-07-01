import type { PayCycleSnapshot } from "../storage/debtPlannerStorage";

export type CycleDelta = {
    // "down" = total debt fell since the last cycle (good, green);
    // "up" = total debt rose (amber). Magnitude is always positive.
    direction: "down" | "up";
    amount: number;
};

// How the user's total debt moved since the last recorded cycle. Compares the
// previous cycle's snapshot balance against the current total. Returns null
// when there's no prior cycle to compare against, or when the change rounds to
// $0 (nothing meaningful to show) - the indicator renders nothing in both.
export function computeCycleDelta(
    previousSnapshot: Pick<PayCycleSnapshot, "totalDebtBalance"> | null | undefined,
    currentTotalDebt: number
): CycleDelta | null {
    if (!previousSnapshot) {
        return null;
    }

    const raw = previousSnapshot.totalDebtBalance - currentTotalDebt;
    const amount = Math.round(Math.abs(raw) * 100) / 100;

    if (amount === 0) {
        return null;
    }

    return {
        direction: raw > 0 ? "down" : "up",
        amount,
    };
}
