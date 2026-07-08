import { expect, test } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

// Payday a few days ago → past AND recent (within the freshness window) regardless
// of when the suite runs, so Payday Autopilot's detection reliably fires. A FIXED
// past date would eventually fall outside the recency window as real "today"
// advances, so compute it relative to now. Seeding nextPaycheckDate is required —
// it's the payday trigger, and a bare seed leaves it empty.
function isoDaysAgo(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
}

const RECENT_PAYDAY = isoDaysAgo(3);

const PAST_PAYDAY = {
    amount: "1950",
    hasCompletedOnboarding: true,
    hasConfiguredPaycheck: true,
    payCycle: "biweekly",
    currentDate: isoDaysAgo(3),
    nextPaycheckDate: RECENT_PAYDAY,
    requiredExpenses: [],
    debts: [
        {
            id: "d1",
            name: "Visa",
            balance: 2400,
            minimumPayment: 60,
            dueDate: "2026-06-10",
            apr: 22.9,
            type: "debt",
            recurrence: "monthly",
        },
    ],
    goals: [],
    completedRecommendedActions: [],
    payoffStrategy: "snowball",
    darkMode: false,
};

test("payday capture: sheet auto-opens, one-tap captures, no re-prompt", async ({ page }) => {
    await seedLocalStorage(page, PAST_PAYDAY);

    // The capture sheet proactively surfaces on payday.
    await expect(page.locator(".payday-sheet")).toBeVisible();
    await expect(page.locator(".payday-extra-row")).toHaveCount(1);

    // One-tap "I followed the plan" captures the recommended allocation.
    await page.getByRole("button", { name: "I followed the plan" }).click();

    // Sheet closes and the action is persisted (paycheck source).
    await expect(page.locator(".payday-sheet")).toBeHidden();

    // #2 regression: after a FULL one-tap capture (which empties the active list),
    // the "Start Next Pay Cycle" nudge must still appear so the cycle isn't frozen.
    await expect(page.locator(".payday-rollover-nudge")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Next Pay Cycle" })).toBeVisible();

    const completed = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.completedRecommendedActions") || "[]")
    );
    expect(completed.length).toBe(1);
    expect(completed[0].targetId).toBe("d1");
    expect(completed[0].category).toBe("snowball");
    expect(completed[0].paymentSource).toBe("paycheck");

    // The payday is marked handled → it must NOT re-prompt on the next open.
    const handled = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.lastHandledPaydayDate") || "null")
    );
    expect(handled).toBe(RECENT_PAYDAY);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Debt Planner" })).toBeVisible();
    await expect(page.locator(".payday-sheet")).toHaveCount(0);
});

test("payday capture: 'Skip this payday' dismisses without capturing, no re-prompt", async ({ page }) => {
    await seedLocalStorage(page, PAST_PAYDAY);

    await expect(page.locator(".payday-sheet")).toBeVisible();
    await page.getByRole("button", { name: "Skip this payday" }).click();

    // Dismissed: nothing captured, but the payday is marked handled (no nagging).
    await expect(page.locator(".payday-sheet")).toBeHidden();
    const completed = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.completedRecommendedActions") || "[]")
    );
    expect(completed.length).toBe(0);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Debt Planner" })).toBeVisible();
    await expect(page.locator(".payday-sheet")).toHaveCount(0);
});
