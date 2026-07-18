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
        "leftover",
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

    console.log("✅ Allocation regression tests passed.");
}

runAllocationRegressionTests();
