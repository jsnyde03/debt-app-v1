import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import {
    rolloverDebts,
    rolloverRequiredExpenses,
} from "@core/recurrence/rolloverPayCycle";
import type { Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

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

function runPlannerStateHardeningTests() {
    // Duplicate debt names must still target by ID.
    const duplicateDebtResult = allocatePaycheck({
        paycheckAmount: 500,
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-05-15",
        strategy: "snowball",
        paycheckBuffer: 0,
        expenses: [],
        goals: [],
        debts: [
            {
                id: "paypal-1",
                name: "PayPal",
                balance: 1000,
                minimumPayment: 50,
                apr: 20,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "paypal-2",
                name: "PayPal",
                balance: 100,
                minimumPayment: 25,
                apr: 5,
                dueDate: "2026-05-10",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
    });

    const duplicateSnowballTarget = duplicateDebtResult.allocations.find(
        (item) => item.category === "snowball"
    );

    assertEqual(
        duplicateSnowballTarget?.debtId,
        "paypal-2",
        "duplicate debt names still target smallest debt by ID"
    );

    // Expense rollover: paid recurring expense advances, unpaid does not.
    const expenses: RequiredExpense[] = [
        {
            id: "rent",
            name: "Rent",
            amount: 800,
            dueDate: "2026-05-01",
            originalDueDate: "2026-05-01",
            recurrence: "monthly",
            expenseType: "fixed",
            isPaidThisCycle: true,
        },
        {
            id: "phone",
            name: "Phone",
            amount: 80,
            dueDate: "2026-05-03",
            originalDueDate: "2026-05-03",
            recurrence: "monthly",
            expenseType: "fixed",
            isPaidThisCycle: false,
        },
    ];

    const rolledExpenses = rolloverRequiredExpenses(expenses, "2026-06-01");

    assertEqual(
        rolledExpenses.find((expense) => expense.id === "rent")?.dueDate,
        "2026-06-01",
        "paid monthly expense rolls forward"
    );

    assertEqual(
        rolledExpenses.find((expense) => expense.id === "phone")?.dueDate,
        "2026-05-03",
        "unpaid expense does not roll forward"
    );

    assertEqual(
        rolledExpenses.every((expense) => expense.isPaidThisCycle === false),
        true,
        "expense paid flags reset after rollover"
    );

    // Debt rollover: paid recurring debt advances and flags reset.
    const debts: Debt[] = [
        {
            id: "card",
            name: "Credit Card",
            balance: 500,
            originalBalance: 500,
            minimumPayment: 50,
            dueDate: "2026-05-05",
            originalDueDate: "2026-05-05",
            apr: 24,
            type: "debt",
            recurrence: "monthly",
            minimumPaidThisCycle: true,
            snowballPaidThisCycle: true,
            isPaidThisCycle: true,
        },
    ];

    const rolledDebts = rolloverDebts(debts, "2026-06-01");
    const rolledDebt = rolledDebts[0];

    assertEqual(rolledDebt.dueDate, "2026-06-05", "paid debt rolls forward");
    assertEqual(rolledDebt.minimumPaidThisCycle, false, "minimum paid flag resets");
    assertEqual(rolledDebt.snowballPaidThisCycle, false, "snowball paid flag resets");
    assertEqual(rolledDebt.isPaidThisCycle, false, "legacy paid flag resets");

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

    console.log("✅ Planner state hardening tests passed.");
}

runPlannerStateHardeningTests();
