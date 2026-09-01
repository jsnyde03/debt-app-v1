import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import {
    rolloverDebts,
    rolloverRequiredExpenses,
} from "@core/recurrence/rolloverPayCycle";
import type { Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${expected}, received ${actual}`);
    }
}

function assertMoney(actual: number, expected: number, label: string) {
    const roundedActual = Math.round(actual * 100) / 100;
    const roundedExpected = Math.round(expected * 100) / 100;

    if (roundedActual !== roundedExpected) {
        throw new Error(`${label} failed. Expected ${roundedExpected}, received ${roundedActual}`);
    }
}

function runFinalLaunchRegressionTests() {
    const expenses: RequiredExpense[] = [
        {
            id: "electric",
            name: "Electric",
            amount: 100,
            dueDate: "2026-06-05",
            recurrence: "monthly",
            isPaidThisCycle: true,
        },
        {
            id: "internet",
            name: "Internet",
            amount: 80,
            dueDate: "2026-06-06",
            recurrence: "monthly",
            isPaidThisCycle: false,
        },
    ];

    const debts: Debt[] = [
        {
            id: "klarna-1",
            name: "Klarna 1",
            balance: 9.43,
            minimumPayment: 9.43,
            apr: 0,
            dueDate: "2026-06-07",
            type: "debt",
            recurrence: "monthly",
            minimumPaidThisCycle: true,
            isPaidThisCycle: true,
        },
        {
            id: "klarna-2",
            name: "Klarna 2",
            balance: 20,
            minimumPayment: 10,
            apr: 0,
            dueDate: "2026-06-08",
            type: "debt",
            recurrence: "monthly",
            minimumPaidThisCycle: false,
        },
        {
            id: "high-apr",
            name: "High APR",
            balance: 200,
            minimumPayment: 25,
            apr: 35.9,
            dueDate: "2026-06-09",
            type: "debt",
            recurrence: "monthly",
            minimumPaidThisCycle: false,
        },
    ];

    const result = allocatePaycheck({
        paycheckAmount: 500,
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
        expenses,
        debts,
        goals: [],
        livingExpenses: [],
        strategy: "snowball",
        paycheckBuffer: 0,
    });

    assertEqual(
        result.allocations.some((item) => item.targetId === "electric"),
        false,
        "paid expense is not reallocated"
    );

    assertEqual(
        result.allocations.some(
            (item) => item.category === "minimum_debt" && item.targetId === "klarna-1"
        ),
        false,
        "paid debt minimum is not reallocated"
    );

    assertEqual(
        result.allocations.some((item) => item.targetId === "internet"),
        true,
        "unpaid expense remains required"
    );

    assertEqual(
        result.allocations.some(
            (item) => item.category === "minimum_debt" && item.targetId === "klarna-2"
        ),
        true,
        "unpaid debt minimum remains required"
    );

    const snowballAllocations = result.allocations.filter(
        (item) => item.category === "snowball"
    );

    assertEqual(
        snowballAllocations[0]?.targetId,
        "klarna-2",
        "fully paid debt is removed from snowball targeting"
    );

    const avalancheResult = allocatePaycheck({
        paycheckAmount: 500,
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
        expenses: [],
        debts,
        goals: [],
        livingExpenses: [],
        strategy: "avalanche",
        paycheckBuffer: 0,
    });

    const firstAvalancheSnowball = avalancheResult.allocations.find(
        (item) => item.category === "snowball"
    );

    assertEqual(
        firstAvalancheSnowball?.targetId,
        "high-apr",
        "avalanche recommends highest APR debt first"
    );

    const quarterlyExpenses = rolloverRequiredExpenses(
        [
            {
                id: "insurance",
                name: "Insurance",
                amount: 300,
                dueDate: "2026-01-10",
                recurrence: "quarterly",
                isPaidThisCycle: true,
            },
        ],
        "2026-04-15"
    );

    assertEqual(
        quarterlyExpenses[0].dueDate,
        "2026-07-10",
        "quarterly expense rolls forward until after plan date"
    );

    const yearlyDebts = rolloverDebts(
        [
            {
                id: "annual-fee",
                name: "Annual Fee",
                balance: 95,
                minimumPayment: 95,
                apr: 0,
                dueDate: "2026-01-15",
                type: "debt",
                recurrence: "annually",
                minimumPaidThisCycle: true,
            },
        ],
        "2026-06-15"
    );

    assertEqual(
        yearlyDebts[0].dueDate,
        "2027-01-15",
        "yearly debt rolls forward one year"
    );

    assertEqual(
        yearlyDebts[0].minimumPaidThisCycle,
        false,
        "rollover clears paid flag only when starting next pay cycle"
    );

    /**
     * ⛔ **S1.13.7.10 [pass-6 `A3-17`] — EIGHT ASSERTIONS NAMED "backup ..." USED TO SIT HERE, AND THEY TESTED `JSON.stringify`.
     *
     * `JSON.parse(JSON.stringify(objectLiteral))` proves a property of the JavaScript engine. These were
     * inside `test:regression`, inside `validate:release:rn`, reading as coverage of the one path where a
     * defect loses a user's entire portfolio — and this package cannot import the backup code at all:
     * its import list is `allocatePaycheck` plus the rollovers.
     *
     * ⚡ ** REMOVED ONLY AFTER THE REAL COVERAGE EXISTED, and the hole was real: `apps/rn/src/data/backup.test.ts`
     * had 48 assertions and mentioned `completedRecommendedActions`, `isPaidThisCycle` and
     * `minimumPaidThisCycle` ZERO times — the exact three properties these named. It now drives
     * `serializeBackup` -> `parseBackup` over a store carrying all three (71 assertions).
     *
     * ⚠️ ** Deleted rather than replaced in place, which is the exception to this repo's usual rule: there is
     * nothing in `packages/core` to replace them WITH, because the property is not a core property. What
     * replaces them is the pointer above.
     */

    console.log("✅ Final launch regression tests passed.");
}

runFinalLaunchRegressionTests();
