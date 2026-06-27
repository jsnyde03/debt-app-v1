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
    });

    await page.reload();

    const setupOverlay = page.locator(".settings-overlay");

    if (await setupOverlay.isVisible().catch(() => false)) {
        await page.getByRole("button", { name: /Calculate plan/i }).click();
    }
}

test.beforeEach(async ({ page }) => {
    await resetApp(page);
});

test("planner empty state renders on mobile", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
        localStorage.clear();
    });

    await page.reload();

    const overlay = page.locator(".settings-overlay");

    if (await overlay.isVisible().catch(() => false)) {
        const calculateButton = page.getByRole("button", {
            name: /Calculate plan/i,
        });

        if (await calculateButton.isVisible().catch(() => false)) {
            await calculateButton.click();
        }
    }

    await expect(
        page.getByRole("heading", { name: "Debt Planner" })
    ).toBeVisible();

    await expect(
        page.locator(".bottom-nav")
    ).toBeVisible();
});


test("bottom navigation switches sections", async ({ page }) => {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Bills/i }).click();

    await expect(
        page.getByRole("button", { name: /Expenses/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /Expenses/i }).click();

    await expect(
        page.getByRole("heading", { name: "Required Expenses" })
    ).toBeVisible();

    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Payoff/i }).click();

    await expect(
        page.getByRole("heading", { name: "Debt Payoff Plan" })
    ).toBeVisible();

    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Goals/i }).click();

    await expect(
        page.getByRole("heading", { name: "Goals" })
    ).toBeVisible();

    await page.getByRole("button", { name: /Plan/i }).click();

    await expect(
        page.getByRole("button", { name: /Recommended Actions/i })
    ).toBeVisible();
});

test("plan settings opens", async ({ page }) => {
    await page.goto("/");

    const overlay = page.locator(".settings-overlay");

    if (await overlay.isVisible().catch(() => false)) {
        await expect(
            page.getByRole("heading", { name: /Plan Settings/i })
        ).toBeVisible();

        return;
    }

    await page.getByRole("button", {
        name: /Plan Settings/i,
    }).click();

    await expect(
        page.getByRole("heading", {
            name: /Plan Settings/i,
        })
    ).toBeVisible();
});
