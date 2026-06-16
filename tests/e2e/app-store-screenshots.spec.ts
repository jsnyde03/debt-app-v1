import { test, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// App Store screenshot data — generic, realistic, aspirational
const screenshotState = {
    amount: "2400",
    payCycle: "biweekly",
    currentDate: "2026-06-15",
    nextPaycheckDate: "2026-06-27",
    semiMonthlyFirstDay: "1",
    semiMonthlySecondDay: "15",
    monthlyPayDay: "1",

    requiredExpenses: [
        {
            id: "exp-rent",
            name: "Rent",
            amount: 850,
            dueDate: "2026-06-18",
            originalDueDate: "2026-06-18",
            recurrence: "monthly",
            expenseType: "fixed",
            isPaidThisCycle: false,
            isAutopay: false,
        },
        {
            id: "exp-electric",
            name: "Electric",
            amount: 95,
            dueDate: "2026-06-20",
            originalDueDate: "2026-06-20",
            recurrence: "monthly",
            expenseType: "variable",
            isPaidThisCycle: false,
            isAutopay: true,
        },
        {
            id: "exp-internet",
            name: "Internet",
            amount: 65,
            dueDate: "2026-06-22",
            originalDueDate: "2026-06-22",
            recurrence: "monthly",
            expenseType: "fixed",
            isPaidThisCycle: false,
            isAutopay: true,
        },
        {
            id: "exp-car-insurance",
            name: "Car Insurance",
            amount: 138,
            dueDate: "2026-06-25",
            originalDueDate: "2026-06-25",
            recurrence: "monthly",
            expenseType: "fixed",
            isPaidThisCycle: false,
            isAutopay: false,
        },
    ],

    livingExpenses: [
        { id: "living-groceries", name: "Groceries", amount: 300, enabled: true },
        { id: "living-gas", name: "Gas", amount: 120, enabled: true },
        { id: "living-misc", name: "Misc", amount: 80, enabled: true },
    ],

    debts: [
        {
            id: "debt-capital-one",
            name: "Capital One Platinum",
            balance: 3200,
            originalBalance: 3200,
            minimumPayment: 75,
            apr: 22.99,
            dueDate: "2026-06-21",
            originalDueDate: "2026-06-21",
            type: "debt",
            recurrence: "monthly",
            isPaidThisCycle: false,
            minimumPaidThisCycle: false,
            snowballPaidThisCycle: false,
            isAutopay: false,
        },
        {
            id: "debt-car-loan",
            name: "Car Loan",
            balance: 8450,
            originalBalance: 8450,
            minimumPayment: 245,
            apr: 6.9,
            dueDate: "2026-06-24",
            originalDueDate: "2026-06-24",
            type: "debt",
            recurrence: "monthly",
            isPaidThisCycle: false,
            minimumPaidThisCycle: false,
            snowballPaidThisCycle: false,
            isAutopay: true,
        },
        {
            id: "debt-medical",
            name: "Medical Bill",
            balance: 620,
            originalBalance: 620,
            minimumPayment: 25,
            apr: 0,
            dueDate: "2026-06-26",
            originalDueDate: "2026-06-26",
            type: "debt",
            recurrence: "monthly",
            isPaidThisCycle: false,
            minimumPaidThisCycle: false,
            snowballPaidThisCycle: false,
            isAutopay: false,
        },
    ],

    goals: [
        {
            id: "goal-emergency",
            name: "Emergency Fund",
            targetAmount: 1000,
            currentAmount: 450,
            type: "emergency",
        },
        {
            id: "goal-vacation",
            name: "Vacation Fund",
            targetAmount: 2500,
            currentAmount: 800,
            type: "savings",
        },
    ],

    completedRecommendedActions: [],
    payoffStrategy: "avalanche",
    darkMode: true,
};

const OUT_DIR = "test-results/app-store-screenshots";

async function seedAndCalculate(page: Page) {
    await page.goto("/");

    await page.evaluate((state) => {
        localStorage.clear();
        localStorage.setItem("debtPlanner.mockSubscription", "premium");
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
    }, screenshotState);

    await page.reload();

    // Dismiss first-run settings sheet if it appears
    const overlay = page.locator(".settings-overlay");
    if (await overlay.isVisible().catch(() => false)) {
        await page.getByRole("button", { name: /Calculate plan/i }).click();
        await overlay.waitFor({ state: "hidden" });
    }

    // Wait for the plan heading to confirm app is fully loaded
    await page.getByRole("heading", { name: "Debt Planner" }).waitFor({ state: "visible" });
    await page.waitForTimeout(400);
}

async function shot(page: Page, name: string) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
        path: path.join(OUT_DIR, `${name}.png`),
        fullPage: false,
    });
}

// ─── Tests ──────────────────────────────────────────────────────────────────
// Run with: npx playwright test app-store-screenshots --project=iphone-pro-max

test("01 — Plan overview (dark)", async ({ page }) => {
    await seedAndCalculate(page);

    // Navigate to Plan tab
    await page.locator(".bottom-nav-item").filter({ hasText: /Plan/i }).click();
    await page.waitForTimeout(300);

    // Ensure Required Actions is expanded (it should be by default)
    const requiredSection = page.locator(".section-collapse-button").filter({ hasText: /Required Actions/i });
    const isExpanded = await page.locator(".plan-section-body.expanded").first().isVisible().catch(() => false);
    if (!isExpanded) {
        await requiredSection.click();
        await page.waitForTimeout(200);
    }

    // Scroll to the top of the plan section so execution summary strip is visible
    await page.locator(".plan-dashboard").first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    await shot(page, "01-plan-overview-dark");
});

test("02 — Timeline (dark)", async ({ page }) => {
    await seedAndCalculate(page);

    await page.locator(".bottom-nav-item").filter({ hasText: /Plan/i }).click();
    await page.waitForTimeout(300);

    // Expand the timeline
    const timelineButton = page.locator(".timeline-collapse-button");
    await timelineButton.click();
    await page.waitForTimeout(300);

    // Scroll so the timeline is centered in the viewport
    await page.locator(".timeline-card").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    await shot(page, "02-timeline-dark");
});

test("03 — Smart Insights premium (dark)", async ({ page }) => {
    await seedAndCalculate(page);

    // Navigate to Payoff tab
    await page.locator(".bottom-nav-item").filter({ hasText: /Payoff/i }).click();
    await page.waitForTimeout(300);

    // Smart Insights is expanded by default (expandedPremiumSection === "insights")
    // Scroll to the payoff premium section
    await page.locator(".premium-payoff-hero").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(200);

    // Scroll down slightly so Smart Insights card is in view
    await page.locator(".smart-insight-list").first().scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(200);

    await shot(page, "03-smart-insights-dark");
});

test("04 — Forecasting premium (dark)", async ({ page }) => {
    await seedAndCalculate(page);

    await page.locator(".bottom-nav-item").filter({ hasText: /Payoff/i }).click();
    await page.waitForTimeout(300);

    // Click the Forecast section header to expand it
    const forecastHeader = page.locator(".strategy-comparison-header.premium-collapsible-header").filter({ hasText: /Forecast/i });
    await forecastHeader.scrollIntoViewIfNeeded();
    await forecastHeader.click();
    await page.waitForTimeout(400);

    // Scroll forecast card into view
    await page.locator(".forecast-list").first().scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(200);

    await shot(page, "04-forecast-dark");
});

test("05 — Strategy Comparison premium (dark)", async ({ page }) => {
    await seedAndCalculate(page);

    await page.locator(".bottom-nav-item").filter({ hasText: /Payoff/i }).click();
    await page.waitForTimeout(300);

    // Click Strategy Comparison header to expand it
    const comparisonHeader = page.locator(".strategy-comparison-header.premium-collapsible-header").filter({ hasText: /Strategy Comparison/i });
    await comparisonHeader.scrollIntoViewIfNeeded();
    await comparisonHeader.click();
    await page.waitForTimeout(400);

    await page.locator(".premium-strategy-grid").first().scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(200);

    await shot(page, "05-strategy-comparison-dark");
});

test("06 — Mark paid interaction (light)", async ({ page }) => {
    // Use light mode for this shot
    const lightState = { ...screenshotState, darkMode: false };

    await page.goto("/");
    await page.evaluate((state) => {
        localStorage.clear();
        localStorage.setItem("debtPlanner.mockSubscription", "premium");
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
    }, lightState);

    await page.reload();
    const overlay = page.locator(".settings-overlay");
    if (await overlay.isVisible().catch(() => false)) {
        await page.getByRole("button", { name: /Calculate plan/i }).click();
        await overlay.waitFor({ state: "hidden" });
    }
    await page.getByRole("heading", { name: "Debt Planner" }).waitFor({ state: "visible" });
    await page.waitForTimeout(400);

    await page.locator(".bottom-nav-item").filter({ hasText: /Plan/i }).click();
    await page.waitForTimeout(300);

    // Ensure Required Actions is expanded
    const isExpanded = await page.locator(".plan-section-body.expanded").first().isVisible().catch(() => false);
    if (!isExpanded) {
        await page.locator(".section-collapse-button").filter({ hasText: /Required Actions/i }).click();
        await page.waitForTimeout(200);
    }

    // Simulate a partial swipe right on the first required action card to reveal "Mark Paid"
    const firstCard = page.locator(".saved-item").first();
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const box = await firstCard.boundingBox();
    if (box) {
        const startX = box.x + 20;
        const startY = box.y + box.height / 2;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 90, startY, { steps: 10 });
        // Hold mid-swipe for screenshot
        await page.waitForTimeout(200);
        await shot(page, "06-swipe-to-pay-light");
        await page.mouse.up();
    } else {
        // Fallback: screenshot with Mark Paid button visible in normal state
        await shot(page, "06-mark-paid-light");
    }
});

test("07 — Goals (light)", async ({ page }) => {
    const lightState = { ...screenshotState, darkMode: false };

    await page.goto("/");
    await page.evaluate((state) => {
        localStorage.clear();
        localStorage.setItem("debtPlanner.mockSubscription", "premium");
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
    }, lightState);

    await page.reload();
    const overlay = page.locator(".settings-overlay");
    if (await overlay.isVisible().catch(() => false)) {
        await page.getByRole("button", { name: /Calculate plan/i }).click();
        await overlay.waitFor({ state: "hidden" });
    }
    await page.getByRole("heading", { name: "Debt Planner" }).waitFor({ state: "visible" });
    await page.waitForTimeout(400);

    await page.locator(".bottom-nav-item").filter({ hasText: /Goals/i }).click();
    await page.waitForTimeout(400);

    await shot(page, "07-goals-light");
});

test("08 — Upgrade paywall (dark)", async ({ page }) => {
    // Seed WITHOUT premium to show the real upgrade modal
    await page.goto("/");
    await page.evaluate((state) => {
        localStorage.clear();
        // No mockSubscription — stays free so upgrade modal is real
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
    }, screenshotState);

    await page.reload();
    const overlay = page.locator(".settings-overlay");
    if (await overlay.isVisible().catch(() => false)) {
        await page.getByRole("button", { name: /Calculate plan/i }).click();
        await overlay.waitFor({ state: "hidden" });
    }
    await page.getByRole("heading", { name: "Debt Planner" }).waitFor({ state: "visible" });
    await page.waitForTimeout(400);

    // Navigate to Payoff tab and click a locked premium section to trigger upgrade modal
    await page.locator(".bottom-nav-item").filter({ hasText: /Payoff/i }).click();
    await page.waitForTimeout(300);

    // Click Smart Insights header — on free plan this opens the upgrade modal
    const insightsHeader = page.locator(".premium-collapsible-header").filter({ hasText: /Smart Insights/i }).first();
    await insightsHeader.scrollIntoViewIfNeeded();
    await insightsHeader.click();
    await page.waitForTimeout(400);

    // Wait for upgrade modal
    const upgradeModal = page.locator(".upgrade-card");
    if (await upgradeModal.isVisible().catch(() => false)) {
        await upgradeModal.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await shot(page, "08-upgrade-paywall-dark");
    } else {
        // Fallback: try clicking the upgrade tab directly
        await page.locator(".bottom-nav-item").filter({ hasText: /Premium/i }).click().catch(() => undefined);
        await page.waitForTimeout(400);
        await shot(page, "08-upgrade-paywall-dark");
    }
});
