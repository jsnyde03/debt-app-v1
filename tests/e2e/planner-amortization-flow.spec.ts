import { expect, test, type Page } from "@playwright/test";

// Seeds a planner with one active, interest-bearing focus debt and a
// configured paycheck so the Payoff tab's focus strip (and its "View
// Schedule" entry point) renders.
async function seedAmortizationPlanner(
    page: Page,
    mockSubscription: "premium" | "premium_plus" | null
) {
    await page.goto("/");

    await page.evaluate((plan) => {
        localStorage.clear();

        localStorage.setItem("debtPlanner.amount", JSON.stringify("2000"));
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
                    id: "focus-debt",
                    name: "Focus Card",
                    balance: 1000,
                    originalBalance: 1000,
                    minimumPayment: 50,
                    apr: 24,
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

        // useSubscription reads this as a bare string (not JSON).
        if (plan) {
            localStorage.setItem("debtPlanner.mockSubscription", plan);
        }
    }, mockSubscription);

    await page.reload();

    const overlay = page.locator(".settings-overlay");
    if (await overlay.isVisible().catch(() => false)) {
        const calculateButton = page.getByRole("button", { name: /Calculate plan/i });
        await expect(calculateButton).toBeVisible();
        await calculateButton.click();
        await expect(overlay).not.toBeVisible();
    }
}

async function openPayoffTab(page: Page) {
    await page
        .locator(".bottom-nav-item:visible, .sidebar-nav-item:visible")
        .filter({ hasText: /Payoff/i })
        .click();
}

test("premium opens the focus-debt schedule and it lands at exactly $0", async ({ page }) => {
    await seedAmortizationPlanner(page, "premium");
    await openPayoffTab(page);

    await page.getByRole("button", { name: "View Schedule" }).click();

    const dialog = page.getByRole("dialog", { name: "Payoff schedule for Focus Card" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".amortization-table")).toBeVisible();

    // Reveal every month, then assert the final balance is exactly $0.00.
    const showMore = page.getByRole("button", { name: "Show More Months" });
    while (await showMore.isVisible().catch(() => false)) {
        await showMore.click();
    }

    await expect(dialog.locator(".amortization-balance").last()).toHaveText("$0.00");
});

test("free sees a Premium pill on View Schedule and is routed to the paywall", async ({ page }) => {
    await seedAmortizationPlanner(page, null);
    await openPayoffTab(page);

    const scheduleButton = page.locator(".payoff-focus-schedule-button");
    await expect(scheduleButton.locator(".premium-pill")).toBeVisible();

    await scheduleButton.click();

    // No schedule for free users - the paywall opens instead.
    await expect(
        page.getByRole("dialog", { name: "Payoff schedule for Focus Card" })
    ).toHaveCount(0);
    await expect(page.locator("#upgrade-section")).toBeVisible();
});
