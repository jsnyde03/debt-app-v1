import { buildAmortizationSchedule } from "./buildAmortizationSchedule";
import { projectDebtPayoff } from "./projectDebtPayoff";
import type { Debt } from "../storage/debtPlannerStorage";

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

function makeDebt(overrides: Partial<Debt> & { balance: number; minimumPayment: number; apr: number }): Debt {
    return {
        id: "focus",
        name: "Focus Debt",
        dueDate: "2026-05-01",
        type: "debt",
        recurrence: "monthly",
        isPaidThisCycle: false,
        ...overrides,
    };
}

function runAmortizationScheduleTests() {
    // --- Reconciliation: the non-negotiable finance-math invariant. ---
    // buildAmortizationSchedule (single debt, fixed payment) must produce the
    // exact same total interest as projectDebtPayoff for the same debt, where
    // the schedule's payment = the debt's minimum + the extra projectDebtPayoff
    // pours onto its single (always-focus) debt.
    const reconciliationCases = [
        { balance: 5000, apr: 22, minimumPayment: 100, extra: 300 },
        { balance: 12000, apr: 27.99, minimumPayment: 250, extra: 150 },
        { balance: 800, apr: 15, minimumPayment: 40, extra: 0 },
        { balance: 3200.55, apr: 19.49, minimumPayment: 75, extra: 425 },
        { balance: 20000, apr: 6.5, minimumPayment: 300, extra: 1000 },
    ];

    for (const testCase of reconciliationCases) {
        const debt = makeDebt({
            balance: testCase.balance,
            apr: testCase.apr,
            minimumPayment: testCase.minimumPayment,
        });

        const projection = projectDebtPayoff({
            debts: [debt],
            monthlyExtraPayment: testCase.extra,
            strategy: "snowball",
            startDate: "2026-05-01",
        });

        const schedule = buildAmortizationSchedule({
            balance: testCase.balance,
            apr: testCase.apr,
            monthlyPayment: testCase.minimumPayment + testCase.extra,
        });

        assertMoney(
            schedule.totalInterest,
            projection.totalInterestPaid,
            `reconciliation interest ($${testCase.balance} @ ${testCase.apr}% / $${testCase.minimumPayment}+$${testCase.extra})`
        );
    }

    // --- Schedule terminates at payoff; final balance is exactly 0. ---
    const terminating = buildAmortizationSchedule({
        balance: 5000,
        apr: 22,
        monthlyPayment: 400,
    });

    assertEqual(terminating.payoffPossible, true, "terminating schedule is payable");
    assertEqual(
        terminating.rows.length,
        terminating.monthsToPayoff,
        "terminating schedule row count matches monthsToPayoff"
    );
    assertMoney(
        terminating.rows[terminating.rows.length - 1].endingBalance,
        0,
        "terminating schedule final balance is exactly 0"
    );
    // Every row's ending balance = starting + interest - payment.
    for (const row of terminating.rows) {
        assertMoney(
            row.endingBalance,
            Math.max(0, row.startingBalance + row.interest - row.payment),
            `row ${row.month} balance continuity`
        );
    }
    // Rows chain: each starts where the previous ended.
    for (let i = 1; i < terminating.rows.length; i += 1) {
        assertMoney(
            terminating.rows[i].startingBalance,
            terminating.rows[i - 1].endingBalance,
            `row ${i + 1} starts at previous ending balance`
        );
    }

    // --- Zero APR: no interest, pure principal, clean division. ---
    const zeroApr = buildAmortizationSchedule({
        balance: 1000,
        apr: 0,
        monthlyPayment: 250,
    });

    assertMoney(zeroApr.totalInterest, 0, "zero APR accrues no interest");
    assertEqual(zeroApr.monthsToPayoff, 4, "zero APR pays off in balance / payment months");
    assertMoney(
        zeroApr.rows[zeroApr.rows.length - 1].endingBalance,
        0,
        "zero APR final balance is 0"
    );

    // --- Already paid off: empty, trivially possible. ---
    const paidOff = buildAmortizationSchedule({
        balance: 0,
        apr: 22,
        monthlyPayment: 100,
    });

    assertEqual(paidOff.payoffPossible, true, "paid-off debt is trivially payable");
    assertEqual(paidOff.rows.length, 0, "paid-off debt has no schedule rows");
    assertEqual(paidOff.monthsToPayoff, 0, "paid-off debt needs 0 months");

    // --- Negative amortization: payment can't cover interest. ---
    const negativeAm = buildAmortizationSchedule({
        balance: 10000,
        apr: 35,
        monthlyPayment: 10,
    });

    assertEqual(negativeAm.payoffPossible, false, "unpayable debt flagged not payable");
    assertEqual(negativeAm.rows.length, 0, "unpayable debt produces no runaway rows");
    assertMoney(negativeAm.totalInterest, 0, "unpayable debt reports 0 interest (no false total)");

    // projectDebtPayoff agrees this debt is unpayable.
    const unpayableProjection = projectDebtPayoff({
        debts: [makeDebt({ balance: 10000, apr: 35, minimumPayment: 10 })],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });
    assertEqual(
        unpayableProjection.estimatedDebtFreeDate,
        "Unable to estimate",
        "projectDebtPayoff agrees the negative-am debt is unpayable"
    );

    console.log("✅ Amortization schedule regression tests passed.");
}

runAmortizationScheduleTests();
