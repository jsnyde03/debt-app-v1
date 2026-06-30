import { expect, test, type Page } from "@playwright/test";

// Clears all state so the onboarding gate fires on next load.
async function freshInstall(page: Page) {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
}

// The main app is considered loaded when either the mobile bottom-nav or the
// iPad sidebar-nav is visible. On iPad, bottom-nav is display:none — filter to
// only visible elements before taking the first match.
async function waitForMainApp(page: Page) {
    await expect(
        page.locator(".bottom-nav, .sidebar-nav").filter({ visible: true }).first()
    ).toBeVisible({ timeout: 12000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Complete all steps → lands in main app with data and flag persisted
// ─────────────────────────────────────────────────────────────────────────────

test("onboarding: complete all steps lands in main app", async ({ page }) => {
    await freshInstall(page);

    // WelcomeStep is visible
    await expect(page.getByText("Your paycheck,")).toBeVisible();

    // Welcome → Paycheck
    await page.getByRole("button", { name: "Get Started" }).click();
    await expect(page.locator("#ob-amount")).toBeVisible();

    // Paycheck → FirstDebtOrBillStep
    await page.locator("#ob-amount").fill("1800");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Add your first")).toBeVisible();

    // Add a debt → CompletionStep
    await page.locator("#ob-entry-name").fill("Car Loan");
    await page.locator("#ob-balance").fill("5000");
    await page.locator("#ob-min").fill("150");
    await page.getByRole("button", { name: "Add & Continue" }).click();
    await expect(page.getByText("You're all set")).toBeVisible();

    // Complete → main app
    await page.getByRole("button", { name: /See My Plan/i }).click();
    await waitForMainApp(page);

    // hasCompletedOnboarding flag must be persisted
    const flag = await page.evaluate(() =>
        localStorage.getItem("debtPlanner.hasCompletedOnboarding")
    );
    expect(flag).toBe("true");

    // Paycheck amount must be persisted
    const amount = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.amount") ?? '""')
    );
    expect(amount).toBe("1800");

    // Debt must be persisted
    const debts = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]")
    );
    expect(debts).toHaveLength(1);
    expect(debts[0].name).toBe("Car Loan");
    expect(debts[0].balance).toBe(5000);

    // Onboarding must NOT reappear on subsequent loads
    await page.reload();
    await waitForMainApp(page);
    await expect(page.getByText("Your paycheck,")).not.toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Skip everything → still lands in main app correctly
// ─────────────────────────────────────────────────────────────────────────────

test("onboarding: skip paycheck step lands in main app", async ({ page }) => {
    await freshInstall(page);

    await page.getByRole("button", { name: "Get Started" }).click();

    // Skip paycheck → jumps to CompletionStep
    await page.getByRole("button", { name: "Skip for now" }).click();
    await expect(page.getByText("You're all set")).toBeVisible();

    await page.getByRole("button", { name: /See My Plan/i }).click();
    await waitForMainApp(page);

    // Flag must be set even on a full skip
    const flag = await page.evaluate(() =>
        localStorage.getItem("debtPlanner.hasCompletedOnboarding")
    );
    expect(flag).toBe("true");

    // Onboarding must not reappear
    await page.reload();
    await waitForMainApp(page);
    await expect(page.getByText("Your paycheck,")).not.toBeVisible();
});

test("onboarding: skip first-debt step lands in main app", async ({ page }) => {
    await freshInstall(page);

    await page.getByRole("button", { name: "Get Started" }).click();
    await page.locator("#ob-amount").fill("2000");
    await page.getByRole("button", { name: "Continue" }).click();

    // Skip adding a debt
    await page.getByRole("button", { name: /Skip/i }).click();
    await expect(page.getByText("You're all set")).toBeVisible();

    await page.getByRole("button", { name: /See My Plan/i }).click();
    await waitForMainApp(page);

    // No debts should have been saved
    const debts = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]")
    );
    expect(debts).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. "Try with Sample Data" → demo mode loads; onboarding does NOT reappear
// ─────────────────────────────────────────────────────────────────────────────

test("onboarding: Try with Sample Data enters demo mode", async ({ page }) => {
    await freshInstall(page);

    await page.getByRole("button", { name: "Try with Sample Data" }).click();

    // Should reload into demo mode main app
    await waitForMainApp(page);
    await expect(page.locator(".demo-mode-banner")).toBeVisible();

    // Reload — onboarding must NOT reappear (isDemoMode bypasses gate)
    await page.reload();
    await waitForMainApp(page);
    await expect(page.getByText("Your paycheck,")).not.toBeVisible();
    await expect(page.locator(".demo-mode-banner")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. "Start My Own Plan" (exit demo) → onboarding reappears
// ─────────────────────────────────────────────────────────────────────────────

test("onboarding: exit demo shows onboarding", async ({ page }) => {
    await freshInstall(page);

    // Enter demo mode via WelcomeStep CTA
    await page.getByRole("button", { name: "Try with Sample Data" }).click();
    await waitForMainApp(page);
    await expect(page.locator(".demo-mode-banner")).toBeVisible();

    // Exit demo — clears all localStorage including flags
    await page.getByRole("button", { name: "Start My Own Plan" }).click();

    // localStorage fully cleared → onboarding gate fires → WelcomeStep appears
    await expect(page.getByText("Your paycheck,")).toBeVisible();
    await expect(page.locator(".demo-mode-banner")).not.toBeVisible();
});
