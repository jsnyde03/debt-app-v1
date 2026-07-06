import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

async function seedPayoffDatePlanner(page: Page) {
    await seedLocalStorage(page, {
        amount: "150",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: "2026-05-01",
        nextPaycheckDate: "2026-05-15",
        // Suppress the Payday Autopilot capture sheet (past payday; not a payday test).
        lastHandledPaydayDate: "2026-05-15",
        requiredExpenses: [],
        livingExpenses: [],
        goals: [],
        debts: [
            {
                id: "test-debt", name: "Test Debt", balance: 100, originalBalance: 100,
                minimumPayment: 50, apr: 0, dueDate: "2026-05-10", originalDueDate: "2026-05-10",
                type: "debt", recurrence: "monthly",
                isPaidThisCycle: false, minimumPaidThisCycle: false, snowballPaidThisCycle: false,
            },
        ],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        darkMode: false,
    });
}

test.beforeEach(async ({ page }) => {
    await seedPayoffDatePlanner(page);
});

test("recommended payoff date is exact and paid extra debt payment persists after reload", async ({
    page,
}) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Payoff/i }).click();

    const debtFreeStrip = page.locator(".payoff-summary-strip");
    const recommendationStrip = page.locator(".payoff-recommendation-strip");

    await expect(debtFreeStrip.getByText("July 2026")).toBeVisible();
    await expect(recommendationStrip.getByText("June 2026")).toBeVisible();

    await page.evaluate(() => {
        localStorage.setItem(
            "debtPlanner.completedRecommendedActions",
            JSON.stringify([
                {
                    targetId: "test-debt",
                    label: "Extra payment to Test Debt",
                    category: "snowball",
                    recommendedAmount: 50,
                    actualAmount: 50,
                },
            ])
        );
    });

    await page.reload();

    const overlay = page.locator(".settings-overlay");

    if (await overlay.isVisible().catch(() => false)) {
        const calculateButton = page.getByRole("button", {
            name: /Calculate plan/i,
        });

        await expect(calculateButton).toBeVisible();
        await calculateButton.click();
        await expect(overlay).not.toBeVisible();
    }

    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Payoff/i }).click();

    // The recorded extra payment ($50) fully clears the $100 debt (min $50 +
    // extra $50), so the payoff view now shows no active debts.
    await expect(page.getByText("No Active Debts Yet.")).toBeVisible();

    const persistedActions = await page.evaluate(() => {
        return JSON.parse(
            localStorage.getItem("debtPlanner.completedRecommendedActions") ?? "[]"
        );
    });

    expect(persistedActions).toHaveLength(1);
    expect(persistedActions[0].actualAmount).toBe(50);
});
