import { expect, test, type Page } from "@playwright/test";

async function seedVisualState(page: Page) {
await page.goto("/");

await page.evaluate(() => {
localStorage.clear();

localStorage.setItem("debtPlanner.amount", JSON.stringify("1950"));
localStorage.setItem("debtPlanner.payCycle", JSON.stringify("biweekly"));
localStorage.setItem("debtPlanner.currentDate", JSON.stringify("2026-05-23"));

localStorage.setItem(
"debtPlanner.requiredExpenses",
JSON.stringify([
{
id: "phone",
name: "Cell Phone",
amount: 330.41,
dueDate: "2026-05-22",
recurrence: "monthly",
isPaidThisCycle: false,
},
{
id: "capcut",
name: "CapCut",
amount: 20,
dueDate: "2026-05-26",
recurrence: "monthly",
isPaidThisCycle: false,
},
])
);

localStorage.setItem(
"debtPlanner.debts",
JSON.stringify([
{
id: "paypal",
name: "PayPal - Underground Figures",
balance: 600,
minimumPayment: 30.15,
apr: 24.99,
dueDate: "2026-05-19",
type: "debt",
recurrence: "monthly",
isPaidThisCycle: false,
minimumPaidThisCycle: false,
snowballPaidThisCycle: false,
},
{
id: "klarna-long",
name: "Klarna - Very Long Mobile Wrapping Test Name",
balance: 56.09,
minimumPayment: 18.7,
apr: 0,
dueDate: "2026-05-28",
type: "bnpl",
recurrence: "monthly",
isPaidThisCycle: false,
minimumPaidThisCycle: false,
snowballPaidThisCycle: false,
},
])
);

localStorage.setItem(
"debtPlanner.goals",
JSON.stringify([
{
id: "emergency",
name: "Emergency Fund",
targetAmount: 1000,
currentAmount: 250,
type: "emergency",
},
])
);

localStorage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify([]));
localStorage.setItem("debtPlanner.payoffStrategy", JSON.stringify("snowball"));
localStorage.setItem("debtPlanner.darkMode", JSON.stringify(false));
});

await page.reload();

const overlay = page.locator(".settings-overlay");

if (await overlay.isVisible().catch(() => false)) {
const paycheckInput = page.getByPlaceholder("Example: 1000");

if (await paycheckInput.isVisible().catch(() => false)) {
await paycheckInput.fill("1950");
}

await page.getByRole("button", { name: /Calculate plan/i }).click();
}
}

test.beforeEach(async ({ page }) => {
await seedVisualState(page);
});

test("mobile visual audit screenshots", async ({ page }) => {
await expect(page.getByRole("heading", { name: "Debt Planner" })).toBeVisible();

await page.screenshot({
path: "test-results/mobile-plan.png",
fullPage: true,
});

await page.getByRole("button", { name: /Bills/i }).click();
await page.getByRole("button", { name: /Debts/i }).click();

await page.screenshot({
path: "test-results/mobile-debts.png",
fullPage: true,
});

await page.getByRole("button", { name: /Payoff/i }).click();

await page.screenshot({
path: "test-results/mobile-payoff.png",
fullPage: true,
});

await page.getByRole("button", { name: /Goals/i }).click();

await page.screenshot({
path: "test-results/mobile-goals.png",
fullPage: true,
});

await page.getByRole("button", { name: /Dark Mode/i }).click();

await page.screenshot({
path: "test-results/mobile-dark-mode.png",
fullPage: true,
});
});
