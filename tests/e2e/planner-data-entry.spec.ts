import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";
import { billsSection } from "./helpers/nav";

async function resetApp(page: Page) {
    await seedLocalStorage(page, {
        amount: "1950",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: "2026-05-23",
        requiredExpenses: [],
        debts: [],
        goals: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        darkMode: false,
    });
}

test.beforeEach(async ({ page }) => {
    await resetApp(page);
});

test("can add an expense and persist after reload", async ({ page }) => {
    const expensesCol = await billsSection(page, "expenses");
    await expensesCol.getByRole("button", { name: "+ Add", exact: true }).click();

    await page.getByPlaceholder("Rent, phone, utilities").fill("Internet");
    await page.getByPlaceholder("Amount due").fill("89.99");
    await page.locator('.bills-modal input[type="date"]').fill("2026-05-28");

    await page.getByRole("button", { name: "Add Required Expense" }).click();

    await expect(page.locator(".saved-title").filter({hasText: "Internet"})).toBeVisible;

    await page.reload();

    await billsSection(page, "expenses");

    await expect(page.getByText("Internet")).toBeVisible();
});

test("can add a debt and persist after reload", async ({ page }) => {
    const debtsCol = await billsSection(page, "debts");
    await debtsCol.getByRole("button", { name: "+ Add", exact: true }).click();

    await page.getByPlaceholder("Debt Name").fill("Test Visa");
    await page.getByPlaceholder("Total Balance Owed").fill("500");
    await page.getByPlaceholder("Minimum Payment").fill("50");
    await page.getByPlaceholder("Example: 24.99").fill("22");
    await page.locator('.debt-add-modal input[type="date"]').fill("2026-05-29");

    await page.getByRole("button", { name: "Add Debt", exact: true }).click();

    await expect(page.getByText("$500.00")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();
    // Debts now live in a collapsible "Active Debts" group — expand it to see the row detail.
    await debtsCol.getByRole("button", { name: /Active Debts/i }).click();
    await expect(page.getByText("APR 22%")).toBeVisible();

    const storedDebtName = await page.evaluate(() => {
        const debts = JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]");
        return debts[0]?.name;
    });

    expect(storedDebtName).toBe("Test Visa");

    await page.reload();

    await billsSection(page, "debts");

    await expect(page.getByText("$500.00")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();
});

test("can add a goal and persist after reload", async ({ page }) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Goals/i }).click();

    await page.getByRole("button", { name: "+ Add", exact: true }).click();

    await page.getByPlaceholder("Starter Emergency Fund").fill("Vacation Fund");
    await page.getByPlaceholder("1000", { exact: true }).fill("1200");
    await page.getByPlaceholder("0", { exact: true }).fill("100");

    await page.getByRole("button", { name: "Add Goal", exact: true }).click();

    await expect(page.getByText("Vacation Fund")).toBeVisible();

    await page.reload();

    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Goals/i }).click();

    await expect(page.getByText("Vacation Fund")).toBeVisible();
});
