import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

// The payday checkpoint's REQUIRED section: the one-tap "I followed the plan"
// bulk path, and the itemized [Adjust] path (mark a manual bill paid + deny a
// failed autopay).

function isoDaysAgo(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
}

function paydayState() {
    return {
        amount: "1950",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: isoDaysAgo(16),
        nextPaycheckDate: isoDaysAgo(2),
        requiredExpenses: [
            { id: "phone", name: "Phone", amount: 90, dueDate: isoDaysAgo(10), recurrence: "monthly", isPaidThisCycle: false, isAutopay: true },
            { id: "internet", name: "Internet", amount: 80, dueDate: isoDaysAgo(6), recurrence: "monthly", isPaidThisCycle: false },
        ],
        debts: [
            { id: "visa", name: "Visa", balance: 2400, minimumPayment: 60, dueDate: isoDaysAgo(8), apr: 22.9, type: "debt", recurrence: "monthly" },
        ],
        goals: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        darkMode: false,
    };
}

async function readState(page: Page) {
    return page.evaluate(() => ({
        expenses: JSON.parse(localStorage.getItem("debtPlanner.requiredExpenses") ?? "[]"),
        debts: JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]"),
    }));
}

test("payday checkpoint: 'I followed the plan' marks ALL required paid (bulk happy path)", async ({ page }) => {
    await seedLocalStorage(page, paydayState());
    await page.locator(".payday-sheet").waitFor({ timeout: 10000 });

    await page.getByRole("button", { name: "I followed the plan" }).click();
    await expect(page.locator(".payday-sheet")).toBeHidden();

    const state = await readState(page);
    const phone = state.expenses.find((e: { id: string }) => e.id === "phone");
    const internet = state.expenses.find((e: { id: string }) => e.id === "internet");
    const visa = state.debts.find((d: { id: string }) => d.id === "visa");

    expect(phone.isPaidThisCycle).toBe(true);
    expect(internet.isPaidThisCycle).toBe(true);
    expect(visa.minimumPaidThisCycle).toBe(true);
});

test("payday checkpoint: [Adjust] marks a manual bill paid AND denies a failed autopay", async ({ page }) => {
    await seedLocalStorage(page, paydayState());
    await page.locator(".payday-sheet").waitFor({ timeout: 10000 });

    await page.getByRole("button", { name: "Adjust", exact: true }).click();
    await page.locator(".payday-reconcile-list").waitFor();

    // Manual Internet opens "Didn't pay" → tap to mark paid.
    await page.getByRole("button", { name: /Internet/ }).click();
    // Autopay Phone opens "Paid · ran" → tap to deny (report it failed).
    await page.getByRole("button", { name: /Phone/ }).click();

    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Confirm what I paid" }).click();
    await expect(page.locator(".payday-sheet")).toBeHidden();

    const state = await readState(page);
    const phone = state.expenses.find((e: { id: string }) => e.id === "phone");
    const internet = state.expenses.find((e: { id: string }) => e.id === "internet");

    // Manual Internet → marked paid.
    expect(internet.isPaidThisCycle).toBe(true);
    // Autopay Phone → denied → flagged failed, stays owed (not paid).
    expect(phone.autopayFailedThisCycle).toBe(true);
    expect(phone.isPaidThisCycle).toBe(false);
});
