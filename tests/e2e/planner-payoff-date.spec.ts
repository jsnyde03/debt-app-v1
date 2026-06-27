import { expect, test, type Page } from "@playwright/test";

async function seedPayoffDatePlanner(page: Page) {
    await page.goto("/");

    await page.evaluate(() => {
        localStorage.clear();

        localStorage.setItem("debtPlanner.amount", JSON.stringify("150"));
        localStorage.setItem("debtPlanner.payCycle", JSON.stringify("biweekly"));
        localStorage.setItem("debtPlanner.currentDate", JSON.stringify("2026-05-01"));
        localStorage.setItem("debtPlanner.nextPaycheckDate", JSON.stringify("2026-05-15"));

        localStorage.setItem("debtPlanner.requiredExpenses", JSON.stringify([]));
        localStorage.setItem("debtPlanner.livingExpenses", JSON.stringify([]));
        localStorage.setItem("debtPlanner.goals", JSON.stringify([]));

        localStorage.setItem(
            "debtPlanner.debts",
            JSON.stringify([
                {
                    id: "test-debt",
                    name: "Test Debt",
                    balance: 100,
                    originalBalance: 100,
                    minimumPayment: 50,
                    apr: 0,
                    dueDate: "2026-05-10",
                    originalDueDate: "2026-05-10",
                    type: "debt",
                    recurrence: "monthly",
                    isPaidThisCycle: false,
                    minimumPaidThisCycle: false,
                    snowballPaidThisCycle: false,
                },
            ])
        );

        localStorage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify([]));
        localStorage.setItem("debtPlanner.payoffStrategy", JSON.stringify("snowball"));
        localStorage.setItem("debtPlanner.darkMode", JSON.stringify(false));
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
}

test.beforeEach(async ({ page }) => {
    await seedPayoffDatePlanner(page);
});

test("recommended payoff date is exact and paid extra debt payment persists after reload", async ({
    page,
}) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Payoff/i }).click();

    const debtFreeCard = page.locator(".summary-card").filter({
        hasText: "Debt Free",
    });

    const recommendationCard = page.locator(".summary-card").filter({
        hasText: "With Recommendation",
    });

    await expect(debtFreeCard.getByText("July 2026")).toBeVisible();
    await expect(recommendationCard.getByText("June 2026")).toBeVisible();

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

    const updatedDebtFreeCard = page.locator(".summary-card").filter({
        hasText: "Debt Free",
    });

    const updatedRecommendationCard = page.locator(".summary-card").filter({
        hasText: "With Recommendation",
    });

    await expect(updatedDebtFreeCard.getByText("June 2026")).toBeVisible();
    await expect(updatedRecommendationCard.getByText("June 2026")).toBeVisible();

    const persistedActions = await page.evaluate(() => {
        return JSON.parse(
            localStorage.getItem("debtPlanner.completedRecommendedActions") ?? "[]"
        );
    });

    expect(persistedActions).toHaveLength(1);
    expect(persistedActions[0].actualAmount).toBe(50);
});
