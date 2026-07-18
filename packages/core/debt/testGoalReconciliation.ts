import { markGoal, unmarkGoal } from "./reconcileGoalAmount";

function assertEqual(actual: number, expected: number, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${expected}, received ${actual}`);
    }
}

function runGoalReconciliationTests() {
    // ─── normal marking: clamp to remaining room, cap at target ───
    {
        const { appliedAmount, nextCurrentAmount } = markGoal(200, 1000, 500);
        assertEqual(appliedAmount, 500, "partial: applies full requested (fits in room)");
        assertEqual(nextCurrentAmount, 700, "partial: currentAmount += applied");
    }
    {
        const { appliedAmount, nextCurrentAmount } = markGoal(800, 1000, 500);
        assertEqual(appliedAmount, 200, "near-complete: applied clamped to remaining room");
        assertEqual(nextCurrentAmount, 1000, "near-complete: lands exactly on target, never over");
    }
    {
        const { appliedAmount, nextCurrentAmount } = markGoal(900, 1000, 500);
        assertEqual(appliedAmount, 100, "over-request: clamped to the 100 of room");
        assertEqual(nextCurrentAmount, 1000, "over-request: caps at target, does not overshoot");
    }
    {
        // fractional cents are rounded (33.333 → 33.33)
        const { appliedAmount, nextCurrentAmount } = markGoal(0, 1000, 33.333);
        assertEqual(appliedAmount, 33.33, "fractional request rounded to cents");
        assertEqual(nextCurrentAmount, 33.33, "fractional currentAmount rounded to cents");
    }

    // ─── THE BUG (regression): over-funded goal must not lose money ───
    // A goal funded to 1000 then re-targeted DOWN to 600 is over-funded
    // (current 1000 > target 600). Marking any action on it must NOT clamp
    // currentAmount down to the target — that reduction was unrecoverable on
    // unmark in the old inline code. Mark is a no-op on an over-funded goal
    // (no room), and fully reversible.
    {
        const { appliedAmount, nextCurrentAmount } = markGoal(1000, 600, 300);
        assertEqual(appliedAmount, 0, "over-funded: no room, applies 0");
        assertEqual(nextCurrentAmount, 1000, "over-funded: currentAmount UNCHANGED (excess not destroyed)");
        assertEqual(unmarkGoal(nextCurrentAmount, appliedAmount), 1000, "over-funded: unmark restores exactly");
    }
    {
        // partial over-funding: current just above target
        const { nextCurrentAmount, appliedAmount } = markGoal(500, 400, 250);
        assertEqual(nextCurrentAmount, 500, "over-funded (small): currentAmount unchanged");
        assertEqual(appliedAmount, 0, "over-funded (small): applies 0");
    }

    // ─── unmark floors at 0 (defensive) ───
    assertEqual(unmarkGoal(50, 200), 0, "unmark never drives currentAmount negative");
    assertEqual(unmarkGoal(700, 500), 200, "unmark subtracts the stored applied amount");

    // ─── THE INVARIANT: unmark exactly reverses mark, for ALL inputs ───
    // Includes over-funded currents (>target) and requests exceeding room.
    const currents = [0, 200, 500, 999.99, 1000, 1500];
    const targets = [400, 1000];
    const requests = [0, 50, 300, 500, 2000];
    for (const c of currents) {
        for (const t of targets) {
            for (const a of requests) {
                const { appliedAmount, nextCurrentAmount } = markGoal(c, t, a);
                assertEqual(
                    unmarkGoal(nextCurrentAmount, appliedAmount),
                    c,
                    `invariant unmark(mark)===current for current=${c} target=${t} request=${a}`
                );
                // Normal-path guarantee: when starting at/under target, marking
                // never pushes currentAmount past the target.
                if (c <= t) {
                    if (nextCurrentAmount > t) {
                        throw new Error(
                            `mark overshot target: current=${c} target=${t} request=${a} → ${nextCurrentAmount}`
                        );
                    }
                }
            }
        }
    }

    console.log("✅ goal reconciliation (mark/unmark) regression tests passed.");
}

runGoalReconciliationTests();
