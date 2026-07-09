import {
    computeMilestones,
    type MilestoneDebtInput,
} from "./computeMilestones";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function debt(overrides: Partial<MilestoneDebtInput> & { previousBalance: number; currentBalance: number }): MilestoneDebtInput {
    return {
        id: "d1",
        name: "Card",
        originalBalance: 1000,
        ...overrides,
    };
}

function runComputeMilestonesTests() {
    // --- Each threshold is detected exactly once, on the cycle it's crossed. ---
    const cross25 = computeMilestones({
        debts: [debt({ previousBalance: 800, currentBalance: 740 })], // 20% -> 26%
    });
    assertEqual(cross25.milestones.length, 1, "25% crossing count");
    assertEqual(cross25.milestones[0].threshold, 25, "25% threshold");
    assertEqual(cross25.milestones[0].isPaidOff, false, "25% not paid off");

    const cross50 = computeMilestones({
        debts: [debt({ previousBalance: 520, currentBalance: 480 })], // 48% -> 52%
    });
    assertEqual(cross50.milestones[0].threshold, 50, "50% threshold");

    const cross75 = computeMilestones({
        debts: [debt({ previousBalance: 260, currentBalance: 240 })], // 74% -> 76%
    });
    assertEqual(cross75.milestones[0].threshold, 75, "75% threshold");

    const cross100 = computeMilestones({
        debts: [debt({ previousBalance: 40, currentBalance: 0 })], // 96% -> 100%
    });
    assertEqual(cross100.milestones[0].threshold, 100, "100% threshold");
    assertEqual(cross100.milestones[0].isPaidOff, true, "100% is paid off");
    assertEqual(cross100.milestones[0].progressPercent, 100, "100% progress");

    // --- Already past a threshold: no re-fire on later cycles. ---
    const noRefire = computeMilestones({
        debts: [debt({ previousBalance: 700, currentBalance: 650 })], // 30% -> 35%, 25% already passed
    });
    assertEqual(noRefire.milestones.length, 0, "no re-fire past a crossed threshold");

    // --- A big jump reports only the HIGHEST crossed threshold. ---
    const bigJump = computeMilestones({
        debts: [debt({ previousBalance: 600, currentBalance: 0 })], // 40% -> 100%
    });
    assertEqual(bigJump.milestones.length, 1, "big jump reports one milestone");
    assertEqual(bigJump.milestones[0].threshold, 100, "big jump reports highest (100)");

    // --- Edge: originalBalance unset -> no milestone (can't compute progress). ---
    const noOriginal = computeMilestones({
        debts: [
            {
                id: "d1",
                name: "Card",
                originalBalance: undefined,
                previousBalance: 500,
                currentBalance: 0,
            },
        ],
    });
    assertEqual(noOriginal.milestones.length, 0, "no originalBalance -> no milestone");
    // Debt-free is a balance fact, independent of originalBalance: the only debt
    // is at 0, so the user IS debt-free even though we can't compute its progress.
    assertEqual(noOriginal.allDebtsPaidOff, true, "a paid-off debt counts as debt-free even without originalBalance");

    // --- Edge: balance increased -> no crossing. ---
    const increased = computeMilestones({
        debts: [debt({ previousBalance: 400, currentBalance: 500 })], // 60% -> 50%
    });
    assertEqual(increased.milestones.length, 0, "balance increase celebrates nothing");

    // --- Edge: 0% progress start, still owing -> no milestone. ---
    const zeroProgress = computeMilestones({
        debts: [debt({ previousBalance: 1000, currentBalance: 990 })], // 0% -> 1%
    });
    assertEqual(zeroProgress.milestones.length, 0, "sub-25% progress -> no milestone");

    // --- All debts paid off, and newly so this cycle. ---
    const allPaid = computeMilestones({
        debts: [
            debt({ id: "a", previousBalance: 30, currentBalance: 0 }),
            { id: "b", name: "Loan", originalBalance: 2000, previousBalance: 50, currentBalance: 0 },
        ],
    });
    assertEqual(allPaid.allDebtsPaidOff, true, "all debts paid off");
    assertEqual(allPaid.newlyAllPaidOff, true, "newly all paid off this cycle");
    assertEqual(allPaid.milestones.length, 2, "both debts report a 100% milestone");

    // --- Already all paid before -> allDebtsPaidOff but NOT newly. ---
    const alreadyPaid = computeMilestones({
        debts: [debt({ previousBalance: 0, currentBalance: 0 })],
    });
    assertEqual(alreadyPaid.allDebtsPaidOff, true, "already-paid debts count as all paid off");
    assertEqual(alreadyPaid.newlyAllPaidOff, false, "already-paid does not re-fire the debt-free moment");

    // --- Mixed: one debt paid off, another still owing -> not all paid off. ---
    const mixed = computeMilestones({
        debts: [
            debt({ id: "a", previousBalance: 20, currentBalance: 0 }),
            { id: "b", name: "Loan", originalBalance: 2000, previousBalance: 1500, currentBalance: 1400 },
        ],
    });
    assertEqual(mixed.allDebtsPaidOff, false, "one debt still owed -> not all paid off");
    assertEqual(mixed.milestones.length, 1, "only the paid-off debt reports a milestone");
    assertEqual(mixed.milestones[0].debtId, "a", "the paid-off debt is the one reported");

    // --- F6: a legacy debt lacking originalBalance that is STILL OWED must block
    // debt-free. Previously it was excluded from the check, so paying off a newer
    // (trackable) debt fired a false "Debt free!" while the legacy debt was owed. ---
    const legacyStillOwed = computeMilestones({
        debts: [
            debt({ id: "new", previousBalance: 300, currentBalance: 0 }), // new debt, paid off
            {
                id: "legacy",
                name: "Old Card",
                originalBalance: undefined,
                previousBalance: 800,
                currentBalance: 800,
            }, // legacy, no originalBalance, still owed
        ],
    });
    assertEqual(legacyStillOwed.allDebtsPaidOff, false, "a still-owed legacy debt (no originalBalance) blocks debt-free");
    assertEqual(legacyStillOwed.newlyAllPaidOff, false, "no false 'Debt free!' while a legacy debt is owed");

    // --- #10: a threshold does NOT re-celebrate after a backslide + re-cross. ---
    // The debt already peaked at 51% paid, backslid to 49% (interest > minimum), and a
    // later payment re-crosses to 51%. With the high-water mark, 50% must NOT re-fire.
    const reCross = computeMilestones({
        debts: [debt({ previousBalance: 510, currentBalance: 490 })], // 49% -> 51%
        maxProgressByDebt: { d1: 51 },
    });
    assertEqual(reCross.milestones.length, 0, "50% does NOT re-celebrate on a re-cross (#10)");
    assertEqual(reCross.nextMaxProgressByDebt.d1, 51, "high-water mark stays at 51");

    // ...and with no prior max (empty map = existing behavior), the same crossing fires once.
    const firstCross = computeMilestones({
        debts: [debt({ previousBalance: 510, currentBalance: 490 })], // 49% -> 51%
    });
    assertEqual(firstCross.milestones.length, 1, "a genuine first 50% crossing still fires");
    assertEqual(firstCross.milestones[0].threshold, 50, "first crossing reports 50");
    assertEqual(firstCross.nextMaxProgressByDebt.d1, 51, "records the new high-water mark");

    console.log("✅ Milestone regression tests passed.");
}

runComputeMilestonesTests();
