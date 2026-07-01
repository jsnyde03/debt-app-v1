import type { PayCycleSnapshot } from "../storage/debtPlannerStorage";

// A cycle counts toward the streak when the user paid at least what the plan
// recommended that cycle - i.e. they stayed on plan. Cycles where the plan
// asked for nothing extra (recommendedThisCycle 0), and snapshots persisted
// before the field existed (undefined -> 0), qualify trivially.
export function isCycleOnPlan(snapshot: PayCycleSnapshot): boolean {
    const required = snapshot.recommendedThisCycle ?? 0;
    return snapshot.totalPaidThisCycle >= required;
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
