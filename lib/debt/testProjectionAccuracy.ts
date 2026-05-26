import { projectDebtPayoff } from "./projectDebtPayoff";

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

function baseDebt(overrides: {
    id: string;
    name: string;
    balance: number;
    minimumPayment: number;
    apr: number;
}) {
    return {
        ...overrides,
        dueDate: "2026-05-01",
        type: "debt" as const,
        recurrence: "monthly" as const,
        isPaidThisCycle: false,
    };
}

function runProjectionAccuracyTests() {
    const zeroAprMinimumOnly = projectDebtPayoff({
        debts: [
            baseDebt({
                id: "zero",
                name: "Zero APR",
                balance: 1200,
                minimumPayment: 100,
                apr: 0,
            }),
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-01-01",
    });

    assertEqual(
        zeroAprMinimumOnly.monthsToDebtFree,
        12,
        "zero APR minimum-only months"
    );

    assertEqual(
        zeroAprMinimumOnly.estimatedDebtFreeDate,
        "January 2027",
        "zero APR minimum-only payoff date"
    );

    assertMoney(
        zeroAprMinimumOnly.totalInterestPaid,
        0,
        "zero APR minimum-only interest"
    );

    const highAprMinimumOnly = projectDebtPayoff({
        debts: [
            baseDebt({
                id: "high",
                name: "High APR",
                balance: 1000,
                minimumPayment: 100,
                apr: 24,
            }),
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-01-01",
    });

    assertEqual(
        highAprMinimumOnly.monthsToDebtFree,
        12,
        "high APR minimum-only months"
    );

    assertEqual(
        highAprMinimumOnly.estimatedDebtFreeDate,
        "January 2027",
        "high APR minimum-only payoff date"
    );

    assertMoney(
        highAprMinimumOnly.totalInterestPaid,
        127.04,
        "high APR minimum-only interest"
    );

    const highAprWithExtra = projectDebtPayoff({
        debts: [
            baseDebt({
                id: "high",
                name: "High APR",
                balance: 1000,
                minimumPayment: 100,
                apr: 24,
            }),
        ],
        monthlyExtraPayment: 100,
        strategy: "snowball",
        startDate: "2026-01-01",
    });

    assertEqual(
        highAprWithExtra.monthsToDebtFree,
        6,
        "high APR with extra payment months"
    );

    assertEqual(
        highAprWithExtra.estimatedDebtFreeDate,
        "July 2026",
        "high APR with extra payment payoff date"
    );

    assertMoney(
        highAprWithExtra.totalInterestPaid,
        64.54,
        "high APR with extra payment interest"
    );

    const snowballTwoDebts = projectDebtPayoff({
        debts: [
            baseDebt({
                id: "small",
                name: "Small Debt",
                balance: 200,
                minimumPayment: 50,
                apr: 0,
            }),
            baseDebt({
                id: "large",
                name: "Large Debt",
                balance: 600,
                minimumPayment: 50,
                apr: 0,
            }),
        ],
        monthlyExtraPayment: 100,
        strategy: "snowball",
        startDate: "2026-01-01",
    });

    assertEqual(
        snowballTwoDebts.monthsToDebtFree,
        5,
        "snowball two-debt payoff months"
    );

    assertEqual(
        snowballTwoDebts.estimatedDebtFreeDate,
        "June 2026",
        "snowball two-debt payoff date"
    );

    assertEqual(
        snowballTwoDebts.payoffOrder.join(","),
        "Small Debt,Large Debt",
        "snowball two-debt payoff order"
    );

    const avalancheTwoDebts = projectDebtPayoff({
        debts: [
            baseDebt({
                id: "low",
                name: "Low APR",
                balance: 200,
                minimumPayment: 50,
                apr: 0,
            }),
            baseDebt({
                id: "high",
                name: "High APR",
                balance: 600,
                minimumPayment: 50,
                apr: 24,
            }),
        ],
        monthlyExtraPayment: 100,
        strategy: "avalanche",
        startDate: "2026-01-01",
    });

    assertEqual(
        avalancheTwoDebts.monthsToDebtFree,
        5,
        "avalanche two-debt payoff months"
    );

    assertEqual(
        avalancheTwoDebts.estimatedDebtFreeDate,
        "June 2026",
        "avalanche two-debt payoff date"
    );

    assertEqual(
        avalancheTwoDebts.payoffOrder.join(","),
        "Low APR,High APR",
        "avalanche two-debt payoff order with minimum payoff first"
    );

    assertMoney(
        avalancheTwoDebts.totalInterestPaid,
        31.83,
        "avalanche two-debt interest"
    );

    const exactBoundary = projectDebtPayoff({
        debts: [
            baseDebt({
                id: "boundary",
                name: "Boundary Debt",
                balance: 102,
                minimumPayment: 100,
                apr: 24,
            }),
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-01-01",
    });

    assertEqual(
        exactBoundary.monthsToDebtFree,
        2,
        "exact payoff boundary months"
    );

    assertEqual(
        exactBoundary.estimatedDebtFreeDate,
        "March 2026",
        "exact payoff boundary date"
    );

    assertMoney(
        exactBoundary.totalInterestPaid,
        2.12,
        "exact payoff boundary interest"
    );

    console.log("✅ Projection accuracy tests passed.");
}

runProjectionAccuracyTests();
