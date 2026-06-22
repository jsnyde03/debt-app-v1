import { expect, test, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

async function seedBase(page: Page) {
    await page.goto("/");

    await page.evaluate(() => {
        localStorage.clear();

        localStorage.setItem("debtPlanner.amount", JSON.stringify("1950"));
        localStorage.setItem("debtPlanner.payCycle", JSON.stringify("biweekly"));
        localStorage.setItem("debtPlanner.currentDate", JSON.stringify("2026-05-23"));
        localStorage.setItem("debtPlanner.requiredExpenses", JSON.stringify([]));
        localStorage.setItem("debtPlanner.debts", JSON.stringify([]));
        localStorage.setItem("debtPlanner.goals", JSON.stringify([]));
        localStorage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify([]));
        localStorage.setItem("debtPlanner.payoffStrategy", JSON.stringify("snowball"));
        localStorage.setItem("debtPlanner.darkMode", JSON.stringify(false));
    });

    await page.reload();
}

test.beforeEach(async ({ page }) => {
    await seedBase(page);
});

test("corrupted localStorage does not crash the planner", async ({ page }) => {
    await page.evaluate(() => {
        localStorage.setItem("debtPlanner.requiredExpenses", "{broken");
        localStorage.setItem("debtPlanner.debts", "{broken");
        localStorage.setItem("debtPlanner.goals", "{broken");
    });

    await page.reload();

    await expect(
        page.getByRole("heading", { name: "Debt Planner" })
    ).toBeVisible();

    await expect(
        page.getByText("Required Actions").first()
    ).toBeVisible();
});
test("debt search accepts input and seeded debts persist", async ({ page }) => {
    await page.evaluate(() => {
        localStorage.setItem(
            "debtPlanner.debts",
            JSON.stringify([
                {
                    id: "visa-1",
                    name: "Visa Card",
                    balance: 500,
                    minimumPayment: 50,
                    apr: 22,
                    dueDate: "2026-05-29",
                    type: "debt",   
                    recurrence: "monthly",
                    isPaidThisCycle: false,
                    minimumPaidThisCycle: false,
                    snowballPaidThisCycle: false,
                },
                {
                    id: "discover-1",
                    name: "Discover Card",
                    balance: 900,
                    minimumPayment: 75,
                    apr: 18,
                    dueDate: "2026-05-30",
                    type: "debt",
                    recurrence: "monthly",
                    isPaidThisCycle: false,
                    minimumPaidThisCycle: false,
                    snowballPaidThisCycle: false,
                },
            ])
        );
    });

    await page.reload();

    await page.locator(".bottom-nav-item").filter({ hasText: /Bills/i }).click();
    await page.getByRole("button", { name: /Debts/i }).click();

    const searchInput = page.getByPlaceholder("Search debts...");

    await searchInput.fill("Visa");

    await expect(searchInput).toHaveValue("Visa");

    const storedDebtNames = await page.evaluate(() => {
        const debts = JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]");
        return debts.map((debt: { name: string }) => debt.name);
    });

    expect(storedDebtNames).toContain("Visa Card");
    expect(storedDebtNames).toContain("Discover Card");
});


test("backup import restores planner data", async ({ page }) => {
    const fixtureDir = path.join(process.cwd(), "tests", "e2e", "fixtures");
    const fixturePath = path.join(fixtureDir, "backup-import.json");

    fs.mkdirSync(fixtureDir, { recursive: true });

    fs.writeFileSync(
        fixturePath,
        JSON.stringify(
            {
                amount: "2100",
                payCycle: "biweekly",
                semiMonthlyFirstDay: "1",
                semiMonthlySecondDay: "15",
                monthlyPayDay: "1",
                currentDate: "2026-05-23",
                requiredExpenses: [
                    {
                        id: "backup-phone",
                        name: "Phone",
                        amount: 90,
                        dueDate: "2026-05-28",
                        recurrence: "monthly",
                        isPaidThisCycle: false,
                    },
                ],
                debts: [
                    {
                        id: "backup-visa",
                        name: "Backup Visa",
                        balance: 700,
                        minimumPayment: 70,
                        apr: 19,
                        dueDate: "2026-05-29",
                        type: "debt",
                        recurrence: "monthly",
                        isPaidThisCycle: false,
                        minimumPaidThisCycle: false,
                        snowballPaidThisCycle: false,
                    },
                ],
                goals: [
                    {
                        id: "backup-goal",
                        name: "Backup Goal",
                        targetAmount: 1000,
                        currentAmount: 250,
                        type: "emergency",
                    },
                ],
                completedRecommendedActions: [],
                payoffStrategy: "snowball",
            },
            null,
            2
        )
    );

    page.on("dialog", async (dialog) => {
        await dialog.accept();
    });

    await page.getByRole("button", { name: "Plan Settings" }).click();

    await page.locator('input[accept=".json"]').setInputFiles(fixturePath);

    await page.waitForTimeout(500);

    const restored = await page.evaluate(() => {
        return {
            expenses: JSON.parse(localStorage.getItem("debtPlanner.requiredExpenses") ?? "[]"),
            debts: JSON.parse(localStorage.getItem("debtPlanner.debts") ?? "[]"),
            goals: JSON.parse(localStorage.getItem("debtPlanner.goals") ?? "[]"),
        };
    });

    expect(restored.expenses[0].name).toBe("Phone");
    expect(restored.debts[0].name).toBe("Backup Visa");
    expect(restored.goals[0].name).toBe("Backup Goal");
});
