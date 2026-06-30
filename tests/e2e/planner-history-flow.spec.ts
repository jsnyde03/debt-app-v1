import { expect, test, type Page } from "@playwright/test";

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
    await page.goto("/");

    await page.evaluate(
        ({ mockSubscription, cycleCount, history }) => {
            localStorage.clear();

            localStorage.setItem("debtPlanner.amount", JSON.stringify("2000"));
            localStorage.setItem("debtPlanner.payCycle", JSON.stringify("biweekly"));
            localStorage.setItem("debtPlanner.currentDate", JSON.stringify("2026-05-23"));
            localStorage.setItem("debtPlanner.hasConfiguredPaycheck", JSON.stringify(true));
            localStorage.setItem("debtPlanner.hasCompletedOnboarding", JSON.stringify(true));

            localStorage.setItem("debtPlanner.cycleHistory", JSON.stringify(history));

            // useSubscription reads this as a bare string (not JSON).
            if (mockSubscription) {
                localStorage.setItem("debtPlanner.mockSubscription", mockSubscription);
            }

            void cycleCount;
        },
        {
            mockSubscription: options.mockSubscription ?? null,
            cycleCount: options.cycleCount,
            history: buildCycleHistory(options.cycleCount),
        }
    );

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

async function openHistory(page: Page) {
    await page.getByRole("button", { name: "Plan Settings" }).first().click();
    await page.getByRole("button", { name: "View Pay Cycle History" }).click();
    await expect(page.getByRole("dialog", { name: "Pay Cycle History" })).toBeVisible();
}

test("premium sees the 6 most recent cycles plus an upgrade row", async ({ page }) => {
    await seedHistoryPlanner(page, { mockSubscription: "premium", cycleCount: 8 });
    await openHistory(page);

    await expect(page.locator(".history-row")).toHaveCount(6);
    await expect(page.locator(".history-upsell-row")).toBeVisible();
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
