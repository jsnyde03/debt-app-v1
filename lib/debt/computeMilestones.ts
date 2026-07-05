// Milestone thresholds (percent of a debt paid off) that earn a celebration.
export const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const;
export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number];

export type MilestoneDebtInput = {
    id: string;
    name: string;
    originalBalance?: number;
    // Balance before this rollover and after it - a threshold only counts
    // when it's crossed THIS cycle, so we need both to detect the transition.
    previousBalance: number;
    currentBalance: number;
};

export type DebtMilestone = {
    debtId: string;
    debtName: string;
    // The highest threshold newly crossed this rollover (e.g. a jump from 40%
    // to fully paid reports 100, not 50/75).
    threshold: MilestoneThreshold;
    isPaidOff: boolean;
    progressPercent: number; // current progress, 0-100, rounded for display
};

export type MilestoneResult = {
    milestones: DebtMilestone[];
    // Every tracked debt is now paid off.
    allDebtsPaidOff: boolean;
    // ...and at least one of them was still owed before this rollover, so this
    // is the cycle that finished them - the trigger for the "debt free" moment.
    newlyAllPaidOff: boolean;
};

function progressPercent(originalBalance: number, balance: number) {
    if (originalBalance <= 0) {
        return 0;
    }
    const paid = originalBalance - Math.max(0, balance);
    return (paid / originalBalance) * 100;
}

// Pure milestone detection for a pay-cycle rollover: compares each debt's
// pre- and post-rollover progress against originalBalance and returns the
// thresholds newly crossed this cycle. No React, no side effects - so the
// celebration logic has a test surface independent of the rollover handler.
export function computeMilestones(params: {
    debts: MilestoneDebtInput[];
}): MilestoneResult {
    const milestones: DebtMilestone[] = [];

    // Only debts with a known, positive starting balance can have progress.
    const trackable = params.debts.filter(
        (debt) =>
            typeof debt.originalBalance === "number" && debt.originalBalance > 0
    );

    for (const debt of trackable) {
        const original = debt.originalBalance as number;
        const previous = progressPercent(original, debt.previousBalance);
        const current = progressPercent(original, debt.currentBalance);

        // Newly-crossed thresholds only. A grown balance (current < previous)
        // never satisfies previous < t <= current, so backslides celebrate
        // nothing.
        const crossed = MILESTONE_THRESHOLDS.filter(
            (threshold) => previous < threshold && current >= threshold
        );

        if (crossed.length === 0) {
            continue;
        }

        const highest = crossed[crossed.length - 1];

        milestones.push({
            debtId: debt.id,
            debtName: debt.name,
            threshold: highest,
            isPaidOff: highest === 100,
            progressPercent: Math.round(current),
        });
    }

    // Debt-free is about EVERY debt, not just the trackable (originalBalance>0)
    // ones. Basing this on `trackable` let a debt lacking originalBalance be
    // ignored, firing a false "Debt free!" while it was still owed. currentBalance
    // / previousBalance exist on all debts regardless of originalBalance.
    const allDebtsPaidOff =
        params.debts.length > 0 &&
        params.debts.every((debt) => debt.currentBalance <= 0);

    const someOwedBefore = params.debts.some((debt) => debt.previousBalance > 0);

    return {
        milestones,
        allDebtsPaidOff,
        newlyAllPaidOff: allDebtsPaidOff && someOwedBefore,
    };
}
