import { expect, test, type Page } from "@playwright/test";

async function resetApp(page: Page) {
    await page.goto("/");

    await page.evaluate(() => {
        localStorage.clear();

        localStorage.setItem("debtPlanner.amount", JSON.stringify("1950"));
        localStorage.setItem("debtPlanner.payCycle", JSON.stringify("biweekly"));
        localStorage.setItem("debtPlanner.currentDate", JSON.stringify("2026-05-23"));
        localStorage.setItem("debtPlanner.requiredExpenses", JSON.stringify([]));
        localStorage.setItem("debtPlanner.debts", JSON.stringify([]));
        localStorage.setItem("debtPlanner.goals", JSON.stringify([]));
        localStorage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify([]));
        localStorage.setItem("debtPlanner.payoffStrategy", JSON.stringify("snowball"));
        localStorage.setItem("debtPlanner.darkMode", JSON.stringify(false));
        localStorage.setItem("debtPlanner.hasConfiguredPaycheck", JSON.stringify(true));
    });

    await page.reload();

    const setupOverlay = page.locator(".settings-overlay");

    if (await setupOverlay.isVisible().catch(() => false)) {
        const paycheckInput = page.getByPlaceholder("Example: 1000");

        await paycheckInput.fill("1950");

        await page.getByRole("button", { name: /Calculate plan/i }).click();

        await expect(setupOverlay).not.toBeVisible();
    }
}

test.beforeEach(async ({ page }) => {
    await resetApp(page);
});

test("can add an expense and persist after reload", async ({ page }) => {
    await page.locator(".bottom-nav-item").filter({ hasText: /Bills/i }).click();
    await page.getByRole("button", { name: /Expenses/i }).click();

    await page.getByRole("button", { name: /\+ Add Expense/i }).click();

    await page.getByPlaceholder("Rent, phone, utilities").fill("Internet");
    await page.getByPlaceholder("Amount due").fill("89.99");
    await page.locator('input[type="date"]').first().fill("2026-05-28");

    await page.getByRole("button", { name: "Add Required Expense" }).click();

    await expect(page.locator(".saved-title").filter({hasText: "Internet"})).toBeVisible;

    await page.reload();

    await page.locator(".bottom-nav-item").filter({ hasText: /Bills/i }).click();
    await page.getByRole("button", { name: /Expenses/i }).click();

    await expect(page.getByText("Internet")).toBeVisible();
});

test("can add a debt and persist after reload", async ({ page }) => {
    await page.locator(".bottom-nav-item").filter({ hasText: /Bills/i }).click();
    await page.getByRole("button", { name: /Debts/i }).click();

    await page.getByRole("button", { name: /\+ Add Debt/i }).click();

    await page.getByPlaceholder("Debt Name").fill("Test Visa");
    await page.getByPlaceholder("Total Balance Owed").fill("500");
    await page.getByPlaceholder("Minimum Payment").fill("50");
    await page.getByPlaceholder("Example: 24.99").fill("22");
    await page.locator('input[type="date"]').first().fill("2026-05-29");

    await page.getByRole("button", { name: "Add Debt", exact: true }).click();

    await expect(page.getByText("$500.00")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();
    await expect(page.getByText("22%")).toBeVisible();

    const storedDebtName = await page.evaluate(() => {
        const debts = JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]");
        return debts[0]?.name;
    });

    expect(storedDebtName).toBe("Test Visa");

    await page.reload();

    await page.locator(".bottom-nav-item").filter({ hasText: /Bills/i }).click();
    await page.getByRole("button", { name: /Debts/i }).click();

    await expect(page.getByText("$500.00")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();
});

test("can add a goal and persist after reload", async ({ page }) => {
    await page.getByRole("button", { name: /Goals/i }).click();

    await page.getByRole("button", { name: /\+ Add Goal/i }).click();

    await page.getByPlaceholder("Starter Emergency Fund").fill("Vacation Fund");
    await page.getByPlaceholder("1000").fill("1200");
    await page.getByPlaceholder("0", { exact: true }).fill("100");

    await page.getByRole("button", { name: "Add goal", exact: true }).click();

    await expect(page.getByText("Vacation Fund")).toBeVisible();

    await page.reload();

    await page.getByRole("button", { name: /Goals/i }).click();

    await expect(page.getByText("Vacation Fund")).toBeVisible();
});
