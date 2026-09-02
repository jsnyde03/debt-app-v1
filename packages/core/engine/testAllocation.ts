import { allocatePaycheck } from "./allocatePaycheck";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function assertMoney(actual: number, expected: number, label: string) {
    const roundedActual = Math.round(actual * 100) / 100;
    const roundedExpected = Math.round(expected * 100) / 100;

    if (roundedActual !== roundedExpected) {
        throw new Error(
            `${label} failed. Expected $${roundedExpected}, received $${roundedActual}`
        );
    }
}

function runAllocationRegressionTests() {
    const basicShortfall = allocatePaycheck({
        paycheckAmount: 500,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        expenses: [
            {
                id: "expense-rent",
                name: "Rent",
                amount: 600,
                dueDate: "2026-05-06",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "expense-phone",
                name: "Phone Bill",
                amount: 80,
                dueDate: "2026-05-12",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        debts: [
            {
                id: "debt-card",
                name: "Credit Card",
                balance: 500,
                minimumPayment: 60,
                apr: 24,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        goals: [],
        paycheckBuffer: 50,
    });

    assertMoney(basicShortfall.totalRequired, 740, "basicShortfall totalRequired");
    assertMoney(basicShortfall.shortfall, 240, "basicShortfall shortfall");
    assertMoney(basicShortfall.remaining, 0, "basicShortfall remaining");
    assertEqual(
        basicShortfall.unfundedRequiredItems.length,
        3,
        "basicShortfall unfundedRequiredItems length"
    );

    const snowballOrder = allocatePaycheck({
        paycheckAmount: 1000,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        expenses: [],
        debts: [
            {
                id: "debt-large",
                name: "Large Card",
                balance: 900,
                minimumPayment: 50,
                apr: 29,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "debt-small",
                name: "Small Card",
                balance: 200,
                minimumPayment: 25,
                apr: 5,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        goals: [],
        paycheckBuffer: 0,
    });

    const firstSnowballExtra = snowballOrder.allocations.find(
        (item) => item.category === "snowball"
    );

    assertEqual(
        firstSnowballExtra?.debtId,
        "debt-small",
        "snowball should target smallest remaining balance first"
    );

    const avalancheOrder = allocatePaycheck({
        paycheckAmount: 1000,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "avalanche",
        expenses: [],
        debts: [
            {
                id: "debt-large",
                name: "Large Card",
                balance: 900,
                minimumPayment: 50,
                apr: 29,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "debt-small",
                name: "Small Card",
                balance: 200,
                minimumPayment: 25,
                apr: 5,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        goals: [],
        paycheckBuffer: 0,
    });

    const firstAvalancheExtra = avalancheOrder.allocations.find(
        (item) => item.category === "snowball"
    );

    assertEqual(
        firstAvalancheExtra?.debtId,
        "debt-large",
        "avalanche should target highest APR first"
    );

    const bufferBeforeGoals = allocatePaycheck({
        paycheckAmount: 500,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        expenses: [],
        debts: [],
        goals: [
            {
                id: "goal-emergency",
                name: "Starter Emergency Fund",
                targetAmount: 1000,
                currentAmount: 0,
                type: "emergency",
            },
        ],
        paycheckBuffer: 50,
    });

    assertEqual(
        bufferBeforeGoals.allocations[0].category,
        "cushion_buffer",
        "cash buffer should be allocated before emergency goal"
    );
    assertMoney(
        bufferBeforeGoals.allocations[0].amount,
        50,
        "cash buffer amount"
    );
    assertMoney(
        bufferBeforeGoals.allocations[1].amount,
        450,
        "emergency goal receives remaining cash after buffer"
    );

    const dueOnPaycheckDateExcluded = allocatePaycheck({
        paycheckAmount: 500,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        expenses: [
            {
                id: "expense-future",
                name: "Future Bill",
                amount: 300,
                dueDate: "2026-05-15",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        debts: [],
        goals: [],
        paycheckBuffer: 0,
    });

    assertMoney(
        dueOnPaycheckDateExcluded.totalRequired,
        0,
        "items due exactly on next paycheck date belong to the next cycle (excluded)"
    );

    // --- affordableUnpaidRequiredCount (drives the required-based Streak) ---

    const affordableInputs = {
        paycheckAmount: 1000,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball" as const,
        debts: [],
        goals: [],
        paycheckBuffer: 0,
    };

    // A comfortably-covered required bill left UNPAID = affordable and skipped.
    const affordableSkipped = allocatePaycheck({
        ...affordableInputs,
        expenses: [{ id: "e1", name: "Internet", amount: 80, dueDate: "2026-05-08", recurrence: "monthly", isPaidThisCycle: false }],
    });
    assertEqual(affordableSkipped.affordableUnpaidRequiredCount, 1, "an affordable unpaid required bill counts as skipped");

    // Same bill marked paid -> not counted.
    const affordablePaid = allocatePaycheck({
        ...affordableInputs,
        expenses: [{ id: "e1", name: "Internet", amount: 80, dueDate: "2026-05-08", recurrence: "monthly", isPaidThisCycle: true }],
    });
    assertEqual(affordablePaid.affordableUnpaidRequiredCount, 0, "a paid required bill is not counted as skipped");

    // Autopay required item -> excluded (it pays automatically; no manual tap needed).
    const autopayUnpaid = allocatePaycheck({
        ...affordableInputs,
        expenses: [{ id: "e1", name: "Internet", amount: 80, dueDate: "2026-05-08", recurrence: "monthly", isPaidThisCycle: false, isAutopay: true }],
    });
    assertEqual(autopayUnpaid.affordableUnpaidRequiredCount, 0, "autopay required items are not counted as skipped");

    // Shortfall / unaffordable required items are forgiven (partial + unfunded, none fully covered).
    assertEqual(basicShortfall.affordableUnpaidRequiredCount, 0, "unaffordable (shortfall) required items are forgiven");

    // §2.9 sinking fund: a PRIORITY savings goal funds BEFORE the snowball; a non-priority one funds
    // after debt (and gets nothing when the snowball consumes the extra).
    const priorityInputs = {
        paycheckAmount: 1000,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-18",
        strategy: "snowball" as const,
        expenses: [{ id: "rent", name: "Rent", amount: 400, dueDate: "2026-05-06", recurrence: "monthly" as const }],
        debts: [{ id: "card", name: "Card", balance: 5000, minimumPayment: 50, apr: 20, dueDate: "2026-05-10", type: "debt" as const, recurrence: "monthly" as const }],
        paycheckBuffer: 100,
    };
    const withPriority = allocatePaycheck({
        ...priorityInputs,
        goals: [
            { id: "couch", name: "Couch", targetAmount: 200, currentAmount: 0, type: "savings", priority: true },
            { id: "vacay", name: "Vacation", targetAmount: 500, currentAmount: 0, type: "savings" },
        ],
    });
    assertMoney(withPriority.allocations.find((a) => a.goalId === "couch")?.amount ?? 0, 200, "priority sinking fund funds before debt (couch $200)");
    assertEqual(withPriority.allocations.find((a) => a.goalId === "vacay"), undefined, "a non-priority savings goal gets nothing when the snowball consumes the extra");
    // The priority goal took $200 that would otherwise have gone to the snowball (the honest debt cost).
    assertMoney(withPriority.allocations.filter((a) => a.category === "snowball").reduce((s, a) => s + a.amount, 0), 250, "the snowball is reduced by exactly what the sinking fund took");

    // The SAME goal WITHOUT priority funds after debt → nothing (proving the flag is what routes it).
    const withoutPriority = allocatePaycheck({
        ...priorityInputs,
        goals: [{ id: "couch", name: "Couch", targetAmount: 200, currentAmount: 0, type: "savings" }],
    });
    assertEqual(withoutPriority.allocations.find((a) => a.goalId === "couch"), undefined, "the same goal WITHOUT priority funds after debt → nothing here");

    // §2.9 sinking-fund PACE cap: a $75/paycheck cap funds only $75 (not the full $200), so a chosen
    // pace is real; the rest still goes to debt this cycle.
    const paced = allocatePaycheck({
        ...priorityInputs,
        goals: [{ id: "couch", name: "Couch", targetAmount: 200, currentAmount: 0, type: "savings", priority: true, priorityPerPaycheck: 75 }],
    });
    assertMoney(paced.allocations.find((a) => a.goalId === "couch")?.amount ?? 0, 75, "the per-paycheck cap paces the sinking fund ($75, not the full $200)");
    assertMoney(paced.allocations.filter((a) => a.category === "snowball").reduce((s, a) => s + a.amount, 0), 375, "the uncapped remainder still reaches debt this cycle");

    // ── [A2] Sub-cycle obligations occur MORE THAN ONCE inside one pay cycle. ────────────────────────
    //
    // The allocator filtered on a single `dueDate` and summed `amount` once, so a weekly bill under a
    // monthly payer was reserved for ONCE — a ~4× under-reserve on the most common sub-cycle cadence.
    // `recurrence` was on the type and read by nobody.
    //
    // This is money, not presentation: under-reserving means the Guardian says a paycheck is clear when
    // three of the four occurrences have not been funded, and the user finds out by going short.
    const weeklyUnderMonthly = allocatePaycheck({
        paycheckAmount: 3000,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-06-01", // a 31-day cycle
        strategy: "snowball",
        expenses: [
            {
                id: "expense-groceries",
                name: "Groceries",
                amount: 50,
                dueDate: "2026-05-04",
                recurrence: "weekly",
                isPaidThisCycle: false,
            },
        ],
        debts: [],
        goals: [],
    });

    // May 4, 11, 18, 25 all fall before June 1 — four occurrences, $200.
    assertMoney(
        weeklyUnderMonthly.totalRequired,
        200,
        "[A2] a weekly bill inside a monthly cycle is reserved for EVERY occurrence"
    );

    /**
     * ⛔ **S1.13.7.10 — THE SAME CLASS ON THE OTHER BRANCH — all three fixtures above pass `debts: []`. [pass-6 `A3-4`]
     *
     * The block's header states the claim at CLASS scope (*"sub-cycle obligations occur MORE THAN ONCE
     * inside one pay cycle"*), and `recurrence` is on `Debt` too. So this is the instrument that would
     * have caught `A3-1` — a plain weekly debt under a monthly payer reserving ONE payment of three,
     * moving `totalRequired` from $300 to $100 — and it could not, because it never handed the allocator
     * a debt at all.
     *
     * ⚠️ ** A DEBT, not a BNPL: `A3-1`'s defect was a gate reading `type === 'bnpl'`, and a cadence is a
     * fact about the SCHEDULE rather than the label. A `bnpl` fixture here would pass over that defect.
     */
    const weeklyDebtUnderMonthly = allocatePaycheck({
        paycheckAmount: 3000,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-06-01", // the same 31-day cycle
        strategy: "snowball",
        expenses: [],
        debts: [
            {
                id: "debt-weekly",
                name: "Weekly loan",
                balance: 2000,
                minimumPayment: 50,
                apr: 12,
                dueDate: "2026-05-04",
                type: "debt",
                recurrence: "weekly",
                isPaidThisCycle: false,
            },
        ],
        goals: [],
    });

    // May 4, 11, 18, 25 — four occurrences, exactly as the bill above.
    assertMoney(
        weeklyDebtUnderMonthly.totalRequired,
        200,
        "[A2/A3-1] a weekly DEBT inside a monthly cycle reserves every occurrence too"
    );

    // Biweekly: May 4 and May 18 → two occurrences.
    const biweeklyUnderMonthly = allocatePaycheck({
        paycheckAmount: 3000,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-06-01",
        strategy: "snowball",
        expenses: [
            {
                id: "expense-sitter",
                name: "Sitter",
                amount: 120,
                dueDate: "2026-05-04",
                recurrence: "biweekly",
                isPaidThisCycle: false,
            },
        ],
        debts: [],
        goals: [],
    });

    assertMoney(
        biweeklyUnderMonthly.totalRequired,
        240,
        "[A2] a biweekly bill inside a monthly cycle counts twice"
    );

    // …and the guard against over-correcting: a MONTHLY bill in a monthly cycle still counts ONCE, and a
    // bill whose next occurrence lands after the next payday still counts ZERO. Without these, "expand
    // every obligation" would quietly double the most common case in the app.
    const monthlyStaysOnce = allocatePaycheck({
        paycheckAmount: 3000,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-06-01",
        strategy: "snowball",
        expenses: [
            {
                id: "expense-rent",
                name: "Rent",
                amount: 1500,
                dueDate: "2026-05-04",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "expense-later",
                name: "Due after payday",
                amount: 90,
                dueDate: "2026-06-04",
                recurrence: "weekly",
                isPaidThisCycle: false,
            },
        ],
        debts: [],
        goals: [],
    });

    assertMoney(
        monthlyStaysOnce.totalRequired,
        1500,
        "[A2] a monthly bill counts once, and one due after the next payday counts zero"
    );

    /**
     * ⛔ **A SECOND `emergency` GOAL USED TO BE FUNDED BY NO RUNG AT ALL.** [P6.8.9.7.11.12 · A-J2-4] The
     * emergency rungs take `find`'s first match and the two sinking-fund rungs required
     * `type === "savings"`, so goal #2 matched none of the five — every paycheck allocated it exactly `$0`
     * while Money drew it a live progress bar and nothing on any screen said so.
     *
     * ⚠️ **Reachable through the ordinary UI, and carried from v1.6.** `GoalSheet` offers the type freely
     * and guards only name-uniqueness, and v1.6's engine has the identical `find` — so a migrating user
     * can already hold two. 🎯 2026-08-25 chose to FUND it rather than refuse it, because refusing does
     * nothing for the stores that already exist.
     *
     * ⚠️ No fixture anywhere carried two emergency goals at once, which is why nothing caught this.
     */
    const twoEmergencyGoals = allocatePaycheck({
        paycheckAmount: 1000,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        expenses: [],
        debts: [],
        goals: [
            {
                id: "goal-ef",
                name: "Emergency Fund",
                targetAmount: 500,
                currentAmount: 500,
                type: "emergency",
            },
            {
                id: "goal-car",
                name: "Car repair fund",
                targetAmount: 800,
                currentAmount: 0,
                type: "emergency",
            },
        ],
    });

    const toCarFund = twoEmergencyGoals.allocations
        .filter((item) => item.goalId === "goal-car")
        .reduce((sum, item) => sum + item.amount, 0);
    assertMoney(toCarFund, 800, "[A-J2-4] a second emergency goal is FUNDED, not starved at $0");

    // …and the first one keeps its own rung. A goal already at target draws nothing, which is what makes
    // the assertion above unambiguous: every dollar that moved went to the second goal.
    const toPrimary = twoEmergencyGoals.allocations
        .filter((item) => item.goalId === "goal-ef")
        .reduce((sum, item) => sum + item.amount, 0);
    assertMoney(toPrimary, 0, "[A-J2-4] …and the funded primary emergency fund draws nothing");

    /**
     * ⛔ **THE PRIMARY MUST NOT BE DOUBLE-FUNDED BY THE CHANGE.** The rule is a negative — everything that
     * is not THE emergency fund funds as a sinking fund — so the one case that would break it is the
     * emergency fund also matching a savings rung and drawing twice in one paycheck.
     */
    const singleEmergencyGoal = allocatePaycheck({
        paycheckAmount: 1000,
        currentDate: "2026-05-04",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        expenses: [],
        debts: [],
        goals: [
            {
                id: "goal-ef",
                name: "Emergency Fund",
                targetAmount: 400,
                currentAmount: 0,
                type: "emergency",
            },
        ],
    });
    const toSingle = singleEmergencyGoal.allocations
        .filter((item) => item.goalId === "goal-ef")
        .reduce((sum, item) => sum + item.amount, 0);
    assertMoney(toSingle, 400, "[A-J2-4] a lone emergency fund is funded to its target exactly once");

    console.log("✅ Allocation regression tests passed.");
}

runAllocationRegressionTests();
