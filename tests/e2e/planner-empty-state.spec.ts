import { expect, test, type Page } from "@playwright/test";
import { billsSection } from "./helpers/nav";
import { seedLocalStorage } from "./helpers/seed";

async function resetApp(page: Page) {
    // Seed BEFORE first paint via addInitScript (seedLocalStorage), NOT the old
    // goto→evaluate(setItem)→reload dance. The app reads `amount` synchronously at
    // mount (usePersistedState lazy init), so with the paycheck already present
    // `isFirstRunSetup` (= !hasConfiguredPaycheck) is false and the "Create Your
    // First Plan" overlay never renders — nothing to dismiss. The old pattern
    // seeded AFTER the first mount, so the overlay flashed and, on the wide/slow
    // iPad-landscape layout, its post-reload hydration reconciliation stuck (an
    // un-dismissable overlay → main app never renders → timeouts). This is the same
    // pattern every other (non-flaky) spec uses.
    await seedLocalStorage(page, {
        amount: "1950",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: "2026-05-23",
        requiredExpenses: [],
        debts: [],
        goals: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        darkMode: false,
    });

    // Barrier: main app up, no first-run overlay (paycheck seeded pre-paint).
    await expect(page.getByRole("heading", { name: "Debt Planner" })).toBeVisible();
    await expect(page.locator(".settings-overlay")).toBeHidden();
}

test.beforeEach(async ({ page }) => {
    await resetApp(page);
});

test("planner empty state renders on mobile", async ({ page }) => {
    // resetApp (beforeEach) seeded a paycheck with NO debts/expenses — the empty
    // MAIN-APP state (a returning user with no data), which is exactly what this
    // asserts (NOT the first-run overlay). The old inline re-seed cleared the
    // paycheck, which re-entered the first-run flow — where clicking "Calculate"
    // is a no-op (no paycheck to compute) so the overlay couldn't be dismissed —
    // and added a racy goto→evaluate→reload that flaked under load.
    await expect(
        page.getByRole("heading", { name: "Debt Planner" })
    ).toBeVisible();

    // Phone renders .bottom-nav; iPad (≥834px) hides it and shows .sidebar-nav.
    // Assert whichever primary nav is actually visible for this layout.
    await expect(
        page.locator(".bottom-nav:visible, .sidebar-nav:visible").first()
    ).toBeVisible();
});


test("bottom navigation switches sections", async ({ page }) => {
    // Bills → Expenses. Phone has a sub-tab switcher; iPad shows both columns
    // (no switcher), so billsSection handles both. Assert the section heading
    // rather than the phone-only switcher button.
    await billsSection(page, "expenses");

    await expect(
        page.getByRole("heading", { name: "Required Expenses" })
    ).toBeVisible();

    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Payoff/i }).click();

    await expect(
        page.getByRole("heading", { name: "Payoff", exact: true }).first()
    ).toBeVisible();

    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Goals/i }).click();

    await expect(
        page.getByRole("heading", { name: "Goals" }).first()
    ).toBeVisible();

    // Scope to the visible nav: a bare /Plan/i button-role match also hits the
    // "Open Plan Settings" button on iPad's sidebar (strict-mode violation).
    await page.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Plan/i }).click();

    await expect(
        page.getByRole("button", { name: /Recommended Actions/i })
    ).toBeVisible();
});

test("plan settings opens", async ({ page }) => {
    // resetApp (beforeEach) already left us on the main app with the plan
    // configured — no extra goto(), which would re-trigger the first-run overlay.
    await page.getByRole("button", { name: /Plan Settings/i }).click();

    // The opened settings panel renders these stable sections (PlanSettingsBody).
    await expect(
        page.getByRole("heading", { name: "Appearance" })
    ).toBeVisible();
});
