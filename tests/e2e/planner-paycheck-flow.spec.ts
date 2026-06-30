import { expect, test, type Page } from "@playwright/test";

async function seedPlanner(page: Page) {
    await page.goto("/");

    await page.evaluate(() => {
        localStorage.clear();

        localStorage.setItem("debtPlanner.amount", JSON.stringify("2000"));
        localStorage.setItem("debtPlanner.payCycle", JSON.stringify("biweekly"));
        localStorage.setItem("debtPlanner.currentDate", JSON.stringify("2026-05-23"));
        localStorage.setItem("debtPlanner.hasConfiguredPaycheck", JSON.stringify(true));

        localStorage.setItem(
            "debtPlanner.requiredExpenses",
            JSON.stringify([
                {
                    id: "rent",
                    name: "Rent",
                    amount: 1200,
                    dueDate: "2026-05-28",
                    recurrence: "monthly",
                    isPaidThisCycle: false,
                },
                {
                    id: "electric",
                    name: "Electric",
                    amount: 150,
                    dueDate: "2026-05-30",
                    recurrence: "monthly",
                    isPaidThisCycle: false,
                },
            ])
        );

        localStorage.setItem(
            "debtPlanner.debts",
            JSON.stringify([
                {
                    id: "visa",
                    name: "Visa",
                    balance: 500,
                    minimumPayment: 50,
                    apr: 22,
                    dueDate: "2026-05-29",
                    type: "debt",
                    recurrence: "monthly",
                    isPaidThisCycle: false,
                    minimumPaidThisCycle: false,
                    snowballPaidThisCycle: false,
                },
            ])
        );

        localStorage.setItem(
            "debtPlanner.goals",
            JSON.stringify([
                {
                    id: "emergency",
                    name: "Emergency Fund",
                    targetAmount: 1000,
                    currentAmount: 200,
                    type: "emergency",
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
        await page.getByRole("button", { name: /Calculate plan/i }).click();

        await page.evaluate(() => {
            localStorage.setItem("debtPlanner.hasConfiguredPaycheck", JSON.stringify(true));
        });

        await page.reload();
    }
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
    await page.getByRole("button", { name: /Dark Mode/i }).click();

    await page.waitForTimeout(300);

    const storedValue = await page.evaluate(() => {
        return localStorage.getItem("debtPlanner.darkMode");
    });

    expect(storedValue).toBe("true");

    await page.reload();

    await page.waitForTimeout(300);

    const restoredValue = await page.evaluate(() => {
        return localStorage.getItem("debtPlanner.darkMode");
    });

    expect(restoredValue).toBe("true");
});

