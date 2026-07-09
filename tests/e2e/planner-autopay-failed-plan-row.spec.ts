import { expect, test, type Page } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

// A user-reported FAILED autopay must stop hiding behind the frictionless
// "Autopay" status on the Plan tab. It should present as a manual owed bill —
// Overdue chip + Mark-Paid pill — so the user can both SEE it needs them and
// RESOLVE it right there, while `isAutopay` stays true so autopay resumes next
// cycle once paid. (No payday sheet here: no nextPaycheckDate is seeded.)

function seededState() {
    return {
        amount: "2000",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: "2026-05-23",
        requiredExpenses: [
            // Failed autopay, past due, still owed → should read as Overdue + Mark-Paid.
            { id: "phone", name: "Phone", amount: 90, dueDate: "2026-05-20", recurrence: "monthly", isPaidThisCycle: false, isAutopay: true, autopayFailedThisCycle: true },
            // Healthy autopay, past due → presumed paid, still reads as autopay.
            { id: "gym", name: "Gym", amount: 40, dueDate: "2026-05-19", recurrence: "monthly", isPaidThisCycle: false, isAutopay: true },
        ],
        debts: [
            { id: "visa", name: "Visa", balance: 500, minimumPayment: 50, apr: 22, dueDate: "2026-05-29", type: "debt", recurrence: "monthly", isPaidThisCycle: false, minimumPaidThisCycle: false, snowballPaidThisCycle: false },
        ],
        goals: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        darkMode: false,
    };
}

async function gotoPlan(page: Page) {
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: "Plan" }).click();
}

function rowFor(page: Page, name: string) {
    return page.locator(".saved-item").filter({ has: page.locator(".saved-title", { hasText: name }) });
}

test("failed autopay presents as an Overdue manual bill on the Plan tab (healthy autopay unaffected)", async ({ page }) => {
    await seedLocalStorage(page, seededState());
    await gotoPlan(page);

    const phone = rowFor(page, "Phone");
    await expect(phone).toBeVisible();
    // Reads as an owed bill: Overdue chip + a Mark-Paid pill, NOT the inert autopay status.
    await expect(phone.locator(".status-chip.overdue")).toBeVisible();
    await expect(phone.getByRole("button", { name: /Mark Paid/i })).toBeVisible();
    await expect(phone.locator(".autopay-status")).toHaveCount(0);

    // A HEALTHY autopay is untouched — still the frictionless status, no pill.
    const gym = rowFor(page, "Gym");
    await expect(gym.locator(".autopay-status")).toBeVisible();
    await expect(gym.locator(".status-chip.overdue")).toHaveCount(0);
    await expect(gym.getByRole("button", { name: /Mark Paid/i })).toHaveCount(0);
});

test("marking a failed autopay paid clears the failed flag so autopay resumes next cycle", async ({ page }) => {
    await seedLocalStorage(page, seededState());
    await gotoPlan(page);

    await rowFor(page, "Phone").getByRole("button", { name: /Mark Paid/i }).click();

    const phone = await page.evaluate(() => {
        const all = JSON.parse(localStorage.getItem("debtPlanner.requiredExpenses") ?? "[]");
        return all.find((e: { id: string }) => e.id === "phone");
    });
    // Resolved AND the failure is cleared — it must not re-fail after rollover.
    expect(phone.isPaidThisCycle).toBe(true);
    expect(phone.autopayFailedThisCycle).toBe(false);
    // Still an autopay bill by nature — autopay resumes next cycle.
    expect(phone.isAutopay).toBe(true);
});
