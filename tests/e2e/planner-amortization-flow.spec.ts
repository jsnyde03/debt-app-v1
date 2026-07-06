import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

// Seeds a planner with one active, interest-bearing focus debt and a
// configured paycheck so the Payoff tab's focus strip (and its "View
// Schedule" entry point) renders. Seeds via addInitScript (seedLocalStorage)
// so state lands before first paint — no goto->evaluate->reload race.
async function seedAmortizationPlanner(
    page: Page,
    mockSubscription: "premium" | "premium_plus" | null
) {
    await seedLocalStorage(
        page,
        {
            amount: "2000",
            hasCompletedOnboarding: true,
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
            ],
            completedRecommendedActions: [],
            payoffStrategy: "snowball",
            darkMode: false,
        },
        // useSubscription reads this as a bare string (not JSON).
        mockSubscription ? { mockSubscription } : {}
    );

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

    // v1.5 QA fix: the schedule renders inline below the button, so opening it
    // must bring the card into view — it previously stayed off-screen below,
    // forcing the user to scroll down to find it.
    await expect(dialog).toBeInViewport();

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
