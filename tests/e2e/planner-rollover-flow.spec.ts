import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

async function seedRolloverPlanner(page: Page) {
    await seedLocalStorage(page, {
        amount: "2000",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: "2026-05-23",
        // Explicit next payday so the rollover target is deterministic — the app
        // otherwise derives it from the real "today", making the assertion flaky.
        nextPaycheckDate: "2026-06-06",
        requiredExpenses: [
            { id: "rent", name: "Rent", amount: 1200, dueDate: "2026-05-28", recurrence: "monthly", isPaidThisCycle: true },
            { id: "internet", name: "Internet", amount: 90, dueDate: "2026-05-29", recurrence: "monthly", isPaidThisCycle: false },
        ],
        debts: [
            {
                id: "visa", name: "Visa", balance: 500, minimumPayment: 50, apr: 22,
                dueDate: "2026-05-29", type: "debt", recurrence: "monthly",
                isPaidThisCycle: true, minimumPaidThisCycle: true, snowballPaidThisCycle: false,
            },
            {
                id: "discover", name: "Discover", balance: 900, minimumPayment: 75, apr: 18,
                dueDate: "2026-05-30", type: "debt", recurrence: "monthly",
                isPaidThisCycle: false, minimumPaidThisCycle: false, snowballPaidThisCycle: false,
            },
        ],
        goals: [
            { id: "emergency", name: "Emergency Fund", targetAmount: 1000, currentAmount: 200, type: "emergency" },
        ],
        completedRecommendedActions: [
            { id: "completed-goal-1", targetId: "emergency", category: "emergency", label: "Add to Emergency Fund", recommendedAmount: 100, actualAmount: 100 },
        ],
        payoffStrategy: "snowball",
        darkMode: false,
    });
}

test.beforeEach(async ({ page }) => {
    await seedRolloverPlanner(page);
});

test("rollover resets paid flags, clears completed actions, and advances paid recurring due dates", async ({
    page,
}) => {
    await page.getByRole("button", { name: "Plan Settings" }).click();

    await page.getByRole("button", { name: "Start Next Pay Cycle" }).click();

    const state = await page.evaluate(() => {
        return {
            currentDate: JSON.parse(localStorage.getItem("debtPlanner.currentDate") ?? "null"),
            expenses: JSON.parse(localStorage.getItem("debtPlanner.requiredExpenses") ?? "[]"),
            debts: JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]"),
            goals: JSON.parse(localStorage.getItem("debtPlanner.goals") ?? "[]"),
            completedRecommendedActions: JSON.parse(
                localStorage.getItem("debtPlanner.completedRecommendedActions") ?? "[]"
            ),
        };
    });

    expect(state.currentDate).toBe("2026-06-06");

    const rent = state.expenses.find((expense: { id: string }) => expense.id === "rent");
    const internet = state.expenses.find((expense: { id: string }) => expense.id === "internet");

    expect(rent.isPaidThisCycle).toBe(false);
    expect(rent.dueDate).toBe("2026-06-28");

    expect(internet.isPaidThisCycle).toBe(false);
    expect(internet.dueDate).toBe("2026-05-29");

    const visa = state.debts.find((debt: { id: string }) => debt.id === "visa");
    const discover = state.debts.find((debt: { id: string }) => debt.id === "discover");

    expect(visa.isPaidThisCycle).toBe(false);
    expect(visa.minimumPaidThisCycle).toBe(false);
    expect(visa.dueDate).toBe("2026-06-29");

    expect(discover.isPaidThisCycle).toBe(false);
    expect(discover.minimumPaidThisCycle).toBe(false);
    expect(discover.dueDate).toBe("2026-05-30");

    const emergency = state.goals.find((goal: { id: string }) => goal.id === "emergency");

    expect(emergency.currentAmount).toBe(200);
    expect(state.completedRecommendedActions).toHaveLength(0);
});

test("after rollover, previously paid required items reset in persisted state", async ({
    page,
}) => {
    await page.getByRole("button", { name: "Plan Settings" }).click();
    await page.getByRole("button", { name: "Start Next Pay Cycle" }).click();

    const state = await page.evaluate(() => {
        return {
            expenses: JSON.parse(
                localStorage.getItem("debtPlanner.requiredExpenses") ?? "[]"
            ),
            debts: JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]"),
        };
    });

    const rent = state.expenses.find(
        (expense: { id: string }) => expense.id === "rent"
    );

    const visa = state.debts.find(
        (debt: { id: string }) => debt.id === "visa"
    );

    expect(rent.isPaidThisCycle).toBe(false);
    expect(visa.isPaidThisCycle).toBe(false);
    expect(visa.minimumPaidThisCycle).toBe(false);
});

test("a live rollover records one correctly-populated Pay Cycle History snapshot", async ({
    page,
}) => {
    // The tier-visibility tests (planner-history-flow) seed cycleHistory directly.
    // This exercises the REAL rollover path (handleRolloverPayCycle -> recordCycleSnapshot),
    // proving a live rollover appends a snapshot built from PRE-rollover state. Recording
    // is tier-independent, so no subscription is mocked.
    const before = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.cycleHistory") ?? "[]")
    );
    expect(before).toHaveLength(0);

    await page.getByRole("button", { name: "Plan Settings" }).click();
    await page.getByRole("button", { name: "Start Next Pay Cycle" }).click();

    const after = await page.evaluate(() => ({
        history: JSON.parse(localStorage.getItem("debtPlanner.cycleHistory") ?? "[]"),
        currentDate: JSON.parse(localStorage.getItem("debtPlanner.currentDate") ?? "null"),
    }));

    expect(after.history).toHaveLength(1);
    const snapshot = after.history[0];
    // PRE-rollover debt balances captured (Visa 500 + Discover 900), not the
    // post-payment balances - the snapshot reflects where the cycle closed.
    expect(snapshot.totalDebtBalance).toBe(1400);
    // Sum of completed recommended actions' actual amounts (the $100 to Emergency Fund).
    expect(snapshot.totalPaidThisCycle).toBe(100);
    expect(snapshot.payoffStrategy).toBe("snowball");
    expect(snapshot.completedRecommendedActions).toHaveLength(1);
    // cycleEndDate = the payday the cycle rolled over to. The rollover advances
    // currentDate to that same nextPaycheckDate, so the snapshot's cycle-end must
    // equal the new current date — asserted as an invariant, not a hardcoded date.
    expect(snapshot.cycleEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(snapshot.cycleEndDate).toBe(after.currentDate);
});