import { applyDebtPaymentProjection } from "./applyDebtPaymentProjection";
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

function assertGreaterThan(actual: number, expected: number, label: string) {
    if (!(actual > expected)) {
        throw new Error(
            `${label} failed. Expected greater than ${expected}, received ${actual}`
        );
    }
}

function runDebtProjectionTests() {
    const oneMonthProjection = applyDebtPaymentProjection({
        balance: 1000,
        apr: 24,
        payment: 120,
    });

    assertMoney(oneMonthProjection.interest, 20, "single month interest");
    assertMoney(
        oneMonthProjection.balanceAfterInterest,
        1020,
        "single month balance after interest"
    );
    assertMoney(oneMonthProjection.payment, 120, "single month payment");
    assertMoney(
        oneMonthProjection.projectedBalance,
        900,
        "single month projected balance"
    );

    const overpaymentProjectionSingle = applyDebtPaymentProjection({
        balance: 50,
        apr: 0,
        payment: 100,
    });

    assertMoney(
        overpaymentProjectionSingle.payment,
        50,
        "single month payment is capped at balance"
    );
    assertMoney(
        overpaymentProjectionSingle.projectedBalance,
        0,
        "single month overpayment does not create negative balance"
    );

    const zeroAprProjection = applyDebtPaymentProjection({
        balance: 500,
        apr: 0,
        payment: 125,
    });

    assertMoney(zeroAprProjection.interest, 0, "zero APR projection interest");
    assertMoney(
        zeroAprProjection.projectedBalance,
        375,
        "zero APR projection balance"
    );

    const snowballProjection = projectDebtPayoff({
        debts: [
            {
                id: "small",
                name: "Small Debt",
                balance: 300,
                minimumPayment: 50,
                apr: 5,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "large",
                name: "Large Debt",
                balance: 5000,
                minimumPayment: 100,
                apr: 29,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 300,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        snowballProjection.payoffOrder[0],
        "Small Debt",
        "snowball payoff order"
    );

    const avalancheProjection = projectDebtPayoff({
        debts: [
            {
                id: "lowapr",
                name: "Low APR",
                balance: 5000,
                minimumPayment: 50,
                apr: 5,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "highapr",
                name: "High APR",
                balance: 300,
                minimumPayment: 100,
                apr: 29,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 300,
        strategy: "avalanche",
        startDate: "2026-05-01",
    });

    assertEqual(
        avalancheProjection.payoffOrder[0],
        "High APR",
        "avalanche payoff order"
    );

    assertGreaterThan(
        avalancheProjection.totalInterestPaid,
        0,
        "interest accrual"
    );

    assertGreaterThan(
        avalancheProjection.monthsToDebtFree,
        0,
        "months to debt free"
    );

    const impossibleProjection = projectDebtPayoff({
        debts: [
            {
                id: "bad",
                name: "Impossible Debt",
                balance: 10000,
                minimumPayment: 10,
                apr: 35,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        impossibleProjection.estimatedDebtFreeDate,
        "Unable to estimate",
        "negative amortization detection"
    );

    const overpaymentProjection = projectDebtPayoff({
        debts: [
            {
                id: "tiny",
                name: "Tiny Debt",
                balance: 50,
                minimumPayment: 100,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 1000,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        overpaymentProjection.monthsToDebtFree,
        1,
        "overpayment prevention payoff timing"
    );

    assertMoney(
        overpaymentProjection.totalInterestPaid,
        0,
        "zero APR overpayment has no interest"
    );

    const exactBaselineDateProjection = projectDebtPayoff({
        debts: [
            {
                id: "exact-date",
                name: "Exact Date Debt",
                balance: 100,
                minimumPayment: 50,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        exactBaselineDateProjection.monthsToDebtFree,
        2,
        "exact baseline payoff months"
    );

    assertEqual(
        exactBaselineDateProjection.estimatedDebtFreeDate,
        "July 2026",
        "exact baseline payoff date"
    );

    const exactRecommendedDateProjection = projectDebtPayoff({
        debts: [
            {
                id: "exact-date",
                name: "Exact Date Debt",
                balance: 100,
                minimumPayment: 50,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 50,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        exactRecommendedDateProjection.monthsToDebtFree,
        1,
        "exact recommended payoff months"
    );

    assertEqual(
        exactRecommendedDateProjection.estimatedDebtFreeDate,
        "June 2026",
        "exact recommended payoff date"
    );

    const paidDebtIgnoredProjection = projectDebtPayoff({
        debts: [
            {
                id: "paid",
                name: "Paid Debt",
                balance: 0,
                minimumPayment: 50,
                apr: 29,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: true,
            },
            {
                id: "remaining",
                name: "Remaining Debt",
                balance: 100,
                minimumPayment: 100,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        paidDebtIgnoredProjection.monthsToDebtFree,
        1,
        "paid debt ignored payoff months"
    );

    assertEqual(
        paidDebtIgnoredProjection.estimatedDebtFreeDate,
        "June 2026",
        "paid debt ignored payoff date"
    );


    console.log("✅ Debt projection regression tests passed.");
}

runDebtProjectionTests();
