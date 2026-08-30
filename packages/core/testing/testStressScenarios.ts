import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { projectDebtPayoff } from "../debt/projectDebtPayoff";

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

function assertGreaterThan(actual: number, expected: number, label: string) {
    if (!(actual > expected)) {
        throw new Error(
            `${label} failed. Expected greater than ${expected}, received ${actual}`
        );
    }
}

function assertLessThanOrEqual(actual: number, expected: number, label: string) {
    if (!(actual <= expected)) {
        throw new Error(
            `${label} failed. Expected ${actual} to be <= ${expected}`
        );
    }
}

function runStressScenarioTests() {
    // Scenario 1: User is underwater. Required obligations exceed paycheck.
    const underwater = allocatePaycheck({
        paycheckAmount: 900,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        paycheckBuffer: 50,
        expenses: [
            {
                id: "rent",
                name: "Rent",
                amount: 850,
                dueDate: "2026-05-02",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "electric",
                name: "Electric",
                amount: 160,
                dueDate: "2026-05-10",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        debts: [
            {
                id: "card",
                name: "Credit Card",
                balance: 2200,
                minimumPayment: 140,
                apr: 29,
                dueDate: "2026-05-12",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        goals: [
            {
                id: "emergency",
                name: "Emergency Fund",
                targetAmount: 1000,
                currentAmount: 0,
                type: "emergency",
            },
        ],
    });

    assertMoney(underwater.totalRequired, 1150, "underwater total required");
    assertMoney(underwater.shortfall, 250, "underwater shortfall");
    assertMoney(underwater.remaining, 0, "underwater remaining cash");
    assertEqual(
        underwater.allocations.some((item) => item.category === "emergency" || item.category === "starter_emergency"),
        false,
        "underwater scenario should not fund goals (neither EF tranche)"
    );

    // Scenario 2: All required items are already paid.
    const allPaid = allocatePaycheck({
        paycheckAmount: 1200,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        paycheckBuffer: 50,
        expenses: [
            {
                id: "rent",
                name: "Rent",
                amount: 800,
                dueDate: "2026-05-05",
                recurrence: "monthly",
                isPaidThisCycle: true,
            },
        ],
        debts: [
            {
                id: "card",
                name: "Credit Card",
                balance: 500,
                minimumPayment: 50,
                apr: 20,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: true,
            },
        ],
        goals: [],
    });

    assertMoney(allPaid.totalRequired, 850, "all paid total required");
    assertMoney(allPaid.shortfall, 0, "all paid shortfall");
    assertMoney(allPaid.remaining, 0, "all paid remaining after buffer and snowball");
    assertEqual(
        allPaid.allocations.some((item) => item.category === "snowball"),
        true,
        "all paid scenario should allow snowball allocation"
    );

    // Scenario 3: Huge paycheck must never recommend more than available cash.
    const largePaycheck = allocatePaycheck({
        paycheckAmount: 10000,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        paycheckBuffer: 50,
        expenses: [],
        debts: [
            {
                id: "small-card",
                name: "Small Card",
                balance: 300,
                minimumPayment: 25,
                apr: 20,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        goals: [
            {
                id: "emergency",
                name: "Emergency Fund",
                targetAmount: 1000,
                currentAmount: 200,
                type: "emergency",
            },
        ],
    });

    const totalAllocated = largePaycheck.allocations.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    assertLessThanOrEqual(
        totalAllocated,
        10000,
        "large paycheck allocations never exceed paycheck"
    );

    // Scenario 4: Debt due exactly on next paycheck date is included.
    const boundaryDate = allocatePaycheck({
        paycheckAmount: 500,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        paycheckBuffer: 0,
        expenses: [],
        debts: [
            {
                id: "boundary-card",
                name: "Boundary Card",
                balance: 1000,
                minimumPayment: 75,
                apr: 19,
                dueDate: "2026-05-15",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        goals: [],
    });

    assertMoney(
        boundaryDate.totalRequired,
        0,
        "debt due on next paycheck date belongs to the next cycle (excluded)"
    );

    // Scenario 5: Very high APR projection should not silently claim success.
    const impossibleProjection = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        startDate: "2026-05-01",
        strategy: "avalanche",
        monthlyExtraPayment: 0,
        debts: [
            {
                id: "toxic-card",
                name: "Toxic Card",
                balance: 20000,
                minimumPayment: 25,
                apr: 99,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
    });

    assertEqual(
        impossibleProjection.estimatedDebtFreeDate,
        "Unable to estimate",
        "toxic APR debt should be unable to estimate"
    );

    // Scenario 6: Large debt list should still produce deterministic snowball target.
    const manyDebts = allocatePaycheck({
        paycheckAmount: 2000,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        paycheckBuffer: 0,
        expenses: [],
        debts: Array.from({ length: 50 }, (_, index) => ({
            id: `debt-${index + 1}`,
            name: `Debt ${index + 1}`,
            balance: 1000 + index * 100,
            minimumPayment: 10,
            apr: index % 2 === 0 ? 10 : 20,
            dueDate: "2026-05-10",
            type: "debt" as const,
            recurrence: "monthly" as const,
            isPaidThisCycle: false,
        })),
        goals: [],
    });

    const snowballTarget = manyDebts.allocations.find(
        (item) => item.category === "snowball"
    );

    assertEqual(
        snowballTarget?.debtId,
        "debt-1",
        "large debt list snowball target remains deterministic"
    );

    // Scenario 7: Projection with no debts should finish immediately.
    const noDebtProjection = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        startDate: "2026-05-01",
        strategy: "snowball",
        monthlyExtraPayment: 500,
        debts: [],
    });

    assertEqual(
        noDebtProjection.monthsToDebtFree,
        0,
        "no debt projection months"
    );

    // Scenario 8: Avalanche should produce interest and a valid payoff timeline.
    const realisticProjection = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        startDate: "2026-05-01",
        strategy: "avalanche",
        monthlyExtraPayment: 250,
        debts: [
            {
                id: "card-a",
                name: "Card A",
                balance: 3000,
                minimumPayment: 100,
                apr: 24,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "loan-a",
                name: "Loan A",
                balance: 7000,
                minimumPayment: 175,
                apr: 8,
                dueDate: "2026-05-12",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
    });

    assertGreaterThan(
        realisticProjection.monthsToDebtFree,
        0,
        "realistic projection has debt-free timeline"
    );

    assertGreaterThan(
        realisticProjection.totalInterestPaid,
        0,
        "realistic projection accrues interest"
    );

    console.log("✅ Stress scenario tests passed.");
}

runStressScenarioTests();
