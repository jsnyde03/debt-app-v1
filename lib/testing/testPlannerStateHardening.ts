import { allocatePaycheck } from "../engine/allocatePaycheck";
import {
    rolloverDebts,
    rolloverRequiredExpenses,
} from "../recurrence/rolloverPayCycle";
import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";

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

    // Backup-style JSON roundtrip preserves IDs and completed actions.
    const backupPayload = {
        version: 1,
        amount: "1500",
        payoffStrategy: "snowball",
        requiredExpenses: expenses,
        debts,
        goals: [],
        completedRecommendedActions: [
            {
                targetId: "paypal-2",
                label: "Extra payment to PayPal",
                category: "snowball",
                recommendedAmount: 100,
                actualAmount: 100,
            },
        ],
    };

    const restored = JSON.parse(JSON.stringify(backupPayload));

    assertEqual(restored.amount, "1500", "backup amount roundtrip");
    assertEqual(restored.payoffStrategy, "snowball", "backup strategy roundtrip");
    assertEqual(restored.debts[0].id, "card", "backup debt ID roundtrip");
    assertEqual(
        restored.completedRecommendedActions[0].targetId,
        "paypal-2",
        "backup completed action target ID roundtrip"
    );
    assertMoney(
        restored.completedRecommendedActions[0].actualAmount,
        100,
        "backup completed action amount roundtrip"
    );

    console.log("✅ Planner state hardening tests passed.");
}

runPlannerStateHardeningTests();
