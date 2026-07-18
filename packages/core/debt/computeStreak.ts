import type { PayCycleSnapshot } from "@core/storage/debtPlannerStorage";

// A cycle counts toward the streak when the user completed every REQUIRED action
// (bills + debt minimums) they could afford that cycle - i.e. they stayed on
// plan. A genuine shortfall (a required item the paycheck couldn't fully cover)
// is forgiven; skipping something affordable is not. Recommended extras
// (snowball/emergency/optional-goal) have no bearing.
//
// Legacy snapshots (written before the required-based streak) lack allRequiredMet
// -> default to on-plan so a fix never retroactively zeroes an existing streak.
export function isCycleOnPlan(snapshot: PayCycleSnapshot): boolean {
    return snapshot.allRequiredMet ?? true;
}

// The current on-plan streak: consecutive most-recent cycles the user stayed
// on plan. cycleHistory is stored oldest-first, so we count backward from the
// latest snapshot and stop at the first cycle that broke the run.
export function computeStreak(cycleHistory: PayCycleSnapshot[]): number {
    let streak = 0;

    for (let i = cycleHistory.length - 1; i >= 0; i -= 1) {
        if (!isCycleOnPlan(cycleHistory[i])) {
            break;
        }
        streak += 1;
    }

    return streak;
}
