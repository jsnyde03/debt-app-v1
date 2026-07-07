import { expect, test } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

// Jason's Option-A gate, proven end to end: an autopay item left untouched at the
// payday checkpoint must reconcile as paid on rollover (advance + pay down), NOT
// rot into next-cycle false-overdue. A user-reported FAILED autopay is the
// exception — it stays owed. (Own spec file: no shared beforeEach seed, so the
// seed sentinel is clean.)

test("rollover reconciles untouched autopay (advances, never overdue); a failed autopay stays owed", async ({
    page,
}) => {
    await seedLocalStorage(page, {
        amount: "2000",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: "2026-05-23",
        nextPaycheckDate: "2026-06-06",
        requiredExpenses: [
            { id: "phone", name: "Phone", amount: 80, dueDate: "2026-05-28", originalDueDate: "2026-05-28", recurrence: "monthly", isPaidThisCycle: false, isAutopay: true },
            { id: "gym", name: "Gym", amount: 40, dueDate: "2026-05-27", originalDueDate: "2026-05-27", recurrence: "monthly", isPaidThisCycle: false, isAutopay: true, autopayFailedThisCycle: true },
        ],
        debts: [
            { id: "card", name: "Card", balance: 500, minimumPayment: 50, apr: 20, dueDate: "2026-05-29", originalDueDate: "2026-05-29", type: "debt", recurrence: "monthly", isPaidThisCycle: false, minimumPaidThisCycle: false, isAutopay: true },
        ],
        goals: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        darkMode: false,
    });

    await page.getByRole("button", { name: "Plan Settings" }).click();
    await page.getByRole("button", { name: "Start Next Pay Cycle" }).click();

    const state = await page.evaluate(() => ({
        expenses: JSON.parse(localStorage.getItem("debtPlanner.requiredExpenses") ?? "[]"),
        debts: JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]"),
    }));

    const phone = state.expenses.find((e: { id: string }) => e.id === "phone");
    const gym = state.expenses.find((e: { id: string }) => e.id === "gym");
    const card = state.debts.find((d: { id: string }) => d.id === "card");

    // Untouched autopay bill → advanced to next month (NOT left overdue at 2026-05-28).
    expect(phone.dueDate).toBe("2026-06-28");
    expect(phone.isPaidThisCycle).toBe(false);

    // FAILED autopay → still owed, keeps its past due date.
    expect(gym.dueDate).toBe("2026-05-27");

    // Untouched autopay debt minimum → advanced AND paid down (balance reduced).
    expect(card.dueDate).toBe("2026-06-29");
    expect(card.balance).toBeLessThan(500);
});
