import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

type SeedOptions = {
    mockSubscription?: "premium" | "premium_plus" | null;
    cycleCount: number;
};

function buildCycleHistory(count: number) {
    // Oldest-first, as the app stores it. Balances descend over time so a
    // newer cycle always shows less debt than the one before it.
    return Array.from({ length: count }, (_, i) => ({
        cycleEndDate: `2026-${String(i + 1).padStart(2, "0")}-15`,
        totalDebtBalance: 10000 - i * 500,
        totalPaidThisCycle: 500,
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
    }));
}

async function seedHistoryPlanner(page: Page, options: SeedOptions) {
    await seedLocalStorage(
        page,
        {
            amount: "2000",
            payCycle: "biweekly",
            currentDate: "2026-05-23",
            hasConfiguredPaycheck: true,
            hasCompletedOnboarding: true,
            cycleHistory: buildCycleHistory(options.cycleCount),
        },
        // mockSubscription is read as a bare string (not JSON) by useSubscription.
        options.mockSubscription ? { mockSubscription: options.mockSubscription } : {}
    );
}

async function openHistory(page: Page) {
    await page.getByRole("button", { name: "Plan Settings" }).first().click();
    await page.getByRole("button", { name: "View Pay Cycle History" }).click();
    await expect(page.getByRole("dialog", { name: "Pay Cycle History" })).toBeVisible();
}

test("premium sees the 6 most recent cycles, no Premium+ upsell (tier not sold in v1.5)", async ({ page }) => {
    await seedHistoryPlanner(page, { mockSubscription: "premium", cycleCount: 8 });
    await openHistory(page);

    await expect(page.locator(".history-row")).toHaveCount(6);
    // Premium+ is not sold in v1.5, so the "upgrade to Premium+" upsell is hidden
    // (PREMIUM_PLUS_AVAILABLE=false). The 6-cycle cap itself still applies.
    await expect(page.locator(".history-upsell-row")).toHaveCount(0);
});

test("premium plus sees the full uncapped history with no upgrade row", async ({ page }) => {
    await seedHistoryPlanner(page, { mockSubscription: "premium_plus", cycleCount: 8 });
    await openHistory(page);

    await expect(page.locator(".history-row")).toHaveCount(8);
    await expect(page.locator(".history-upsell-row")).toHaveCount(0);
});

test("premium under the cap shows all cycles and no upgrade row", async ({ page }) => {
    await seedHistoryPlanner(page, { mockSubscription: "premium", cycleCount: 3 });
    await openHistory(page);

    await expect(page.locator(".history-row")).toHaveCount(3);
    await expect(page.locator(".history-upsell-row")).toHaveCount(0);
});

test("free sees the locked upsell instead of any history", async ({ page }) => {
    await seedHistoryPlanner(page, { mockSubscription: null, cycleCount: 8 });
    await openHistory(page);

    await expect(page.locator(".history-locked-card")).toBeVisible();
    await expect(page.locator(".history-row")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Upgrade to Premium" })).toBeVisible();
});
