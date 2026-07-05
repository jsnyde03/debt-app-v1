import { projectDebtPayoff } from "./projectDebtPayoff";
import { buildPayoffTrajectory } from "./buildPayoffTrajectory";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

// Two 0%-APR debts, no extra. Debt A ($100, $100 min) clears in month 1; its
// freed $100 minimum must roll onto Debt B ($300, $100 min). With the roll B is
// paid in month 2; WITHOUT it (the old fixed-extra bug) B would take until
// month 3. 0% APR keeps the arithmetic exact.
function runFreedMinimumRollTests() {
    const debts = [
        { id: "a", name: "A", balance: 100, minimumPayment: 100, apr: 0, dueDate: "2026-01-01", type: "debt" as const, recurrence: "monthly" as const },
        { id: "b", name: "B", balance: 300, minimumPayment: 100, apr: 0, dueDate: "2026-01-01", type: "debt" as const, recurrence: "monthly" as const },
    ];

    const projected = projectDebtPayoff({
        debts,
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-01-01",
    });
    assertEqual(projected.monthsToDebtFree, 2, "projectDebtPayoff rolls the freed minimum (2 months, not 3)");
    assertEqual(projected.payoffOrder.join(","), "A,B", "payoff order A then B");

    const trajectory = buildPayoffTrajectory({
        debts,
        monthlyExtraPayment: 0,
        strategy: "snowball",
    });
    const last = trajectory[trajectory.length - 1];
    assertEqual(last.balance, 0, "trajectory reaches zero");
    assertEqual(last.month, 2, "buildPayoffTrajectory rolls the freed minimum (zero by month 2, not 3)");

    console.log("✅ Freed-minimum roll regression tests passed.");
}

runFreedMinimumRollTests();
