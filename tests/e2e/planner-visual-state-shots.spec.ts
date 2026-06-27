import { expect, test, type Page } from "@playwright/test";
import { buildDemoPlannerState } from "../../lib/testing/seedPlannerState";

async function seedPopulatedPlanner(page: Page) {
const demoPlannerState = buildDemoPlannerState();

await page.goto("/");

await page.evaluate((state) => {
localStorage.clear();

localStorage.setItem("debtPlanner.amount", JSON.stringify(state.amount));
localStorage.setItem("debtPlanner.payCycle", JSON.stringify(state.payCycle));
localStorage.setItem("debtPlanner.currentDate", JSON.stringify(state.currentDate));
localStorage.setItem("debtPlanner.nextPaycheckDate", JSON.stringify(state.nextPaycheckDate));
localStorage.setItem("debtPlanner.semiMonthlyFirstDay", JSON.stringify(state.semiMonthlyFirstDay));
localStorage.setItem("debtPlanner.semiMonthlySecondDay", JSON.stringify(state.semiMonthlySecondDay));
localStorage.setItem("debtPlanner.monthlyPayDay", JSON.stringify(state.monthlyPayDay));

localStorage.setItem("debtPlanner.requiredExpenses", JSON.stringify(state.requiredExpenses));
localStorage.setItem("debtPlanner.livingExpenses", JSON.stringify(state.livingExpenses));
localStorage.setItem("debtPlanner.debts", JSON.stringify(state.debts));
localStorage.setItem("debtPlanner.goals", JSON.stringify(state.goals));
localStorage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify(state.completedRecommendedActions));
localStorage.setItem("debtPlanner.payoffStrategy", JSON.stringify(state.payoffStrategy));
localStorage.setItem("debtPlanner.darkMode", JSON.stringify(state.darkMode));
}, demoPlannerState);

await page.reload();

const overlay = page.locator(".settings-overlay");

if (await overlay.isVisible().catch(() => false)) {
await page.getByRole("button", { name: /Calculate plan/i }).click();
await expect(overlay).not.toBeVisible();
}
}

async function screenshot(page: Page, name: string) {
await page.screenshot({
path: `test-results/visual-state/${name}.png`,
fullPage: true,
});
}

test.beforeEach(async ({ page }) => {
await seedPopulatedPlanner(page);
});

test("capture populated mobile state screenshots", async ({ page }) => {
await expect(
page.getByRole("heading", { name: "Debt Planner" })
).toBeVisible();

await screenshot(page, "01-plan-populated");

await page.getByText("Recommended Actions").first().click();
await screenshot(page, "02-plan-recommended-expanded");

const firstMarkPaid = page.getByRole("button", { name: /Mark Paid/i }).first();

if (await firstMarkPaid.isVisible().catch(() => false)) {
await firstMarkPaid.click();
}

await page.getByText("Completed This Cycle").first().click();
await screenshot(page, "03-plan-completed-expanded");

await page.locator(".bottom-nav-item").filter({ hasText: /Bills/i }).click();
await page.getByRole("button", { name: /Expenses/i }).click();
await screenshot(page, "04-bills-expenses-populated");

await page.locator(".bottom-nav-item").filter({ hasText: /Bills/i }).click();
await page.getByRole("button", { name: /Debts/i }).click();
await screenshot(page, "05-bills-debts-populated");

await page.getByRole("button", { name: /Payoff/i }).click();
await screenshot(page, "06-payoff-populated");

await page.getByRole("button", { name: /Goals/i }).click();
await screenshot(page, "07-goals-populated");

await page.getByRole("button", { name: /Dark Mode/i }).click();
await screenshot(page, "08-dark-mode-current-tab");

await page.locator(".bottom-nav-item").filter({ hasText: "Plan" }).click();
await screenshot(page, "09-dark-mode-plan-populated");
});
