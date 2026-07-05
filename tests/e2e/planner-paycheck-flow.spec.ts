import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

async function seedPlanner(page: Page) {
    await seedLocalStorage(page, {
        amount: "2000",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: "2026-05-23",
        requiredExpenses: [
            { id: "rent", name: "Rent", amount: 1200, dueDate: "2026-05-28", recurrence: "monthly", isPaidThisCycle: false },
            { id: "electric", name: "Electric", amount: 150, dueDate: "2026-05-30", recurrence: "monthly", isPaidThisCycle: false },
        ],
        debts: [
            {
                id: "visa", name: "Visa", balance: 500, minimumPayment: 50, apr: 22,
                dueDate: "2026-05-29", type: "debt", recurrence: "monthly",
                isPaidThisCycle: false, minimumPaidThisCycle: false, snowballPaidThisCycle: false,
            },
        ],
        goals: [
            { id: "emergency", name: "Emergency Fund", targetAmount: 1000, currentAmount: 200, type: "emergency" },
        ],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        darkMode: false,
    });
}

test.beforeEach(async ({ page }) => {
    await seedPlanner(page);
});

test("required actions can be completed and undone", async ({ page }) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: "Plan" }).click();

    await expect(page.locator(".saved-title").filter({ hasText: "Pay Rent" })).toBeVisible();

    const markPaidButton = page.getByRole("button", { name: /Mark Paid/i }).first();

    await expect(markPaidButton).toBeVisible();

    await markPaidButton.click();

    const completedSectionButton = page
        .getByRole("button")
        .filter({ hasText: /Completed This Cycle/i })
        .first();

    await completedSectionButton.click();

    const undoButton = page.getByRole("button", { name: /Undo/i }).first();

    await expect(undoButton).toBeVisible();

    await undoButton.click();

    await expect(
        page.getByRole("button", { name: /Mark Paid/i }).first()
    ).toBeVisible();
});

test("recommended actions render", async ({ page }) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: "Plan" }).click();

    await page.getByText("Recommended Actions").first().click();

    await expect(
        page.getByText(/Emergency Fund|Visa/i).first()
    ).toBeVisible();
});

test("payoff section renders seeded debt", async ({ page }) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Payoff/i }).click();

    await expect(page.getByText("Visa")).toBeVisible();
    await expect(page.getByText("$500.00")).toBeVisible();
});

test("goals section renders seeded goal", async ({ page }) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Goals/i }).click();

    await expect(
        page.locator(".saved-title").filter({ hasText: "Emergency Fund" })
    ).toBeVisible();

    await expect(page.getByText(/Saved \$200\.00/)).toBeVisible();
});

test("dark mode persists", async ({ page }) => {
    // Theme is now a 3-way Auto/Light/Dark selector inside Plan Settings, and
    // debtPlanner.darkMode stores the preference string (not a boolean).
    await page.getByRole("button", { name: /Plan Settings/i }).click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();

    await page.waitForTimeout(300);

    const storedValue = await page.evaluate(() => {
        return localStorage.getItem("debtPlanner.darkMode");
    });

    expect(storedValue).toBe('"dark"');

    await page.reload();

    await page.waitForTimeout(300);

    const restoredValue = await page.evaluate(() => {
        return localStorage.getItem("debtPlanner.darkMode");
    });

    expect(restoredValue).toBe('"dark"');
});

