import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { seedLocalStorage } from "./helpers/seed";
import { billsSection } from "./helpers/nav";

// A configured, onboarded planner with empty collections — the base every
// hardening test starts from. Per-test data is folded into the seed (below) so
// it's present at first paint; the old goto()->evaluate(setItem)->reload() dance
// let the app's first render race the seed and clobber it back to [] (the
// long-standing `storedDebtNames: []` flake that RED-ed the CI gate).
const BASE = {
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
};

test("corrupted localStorage does not crash the planner", async ({ page }) => {
    // Seed the collections as raw, un-parseable garbage so the app hits its
    // JSON.parse guards on the very first render (rawState is written after the
    // JSON seed, so it overrides the empty arrays in BASE).
    await seedLocalStorage(page, BASE, {
        requiredExpenses: "{broken",
        debts: "{broken",
        goals: "{broken",
    });

    await expect(
        page.getByRole("heading", { name: "Debt Planner" })
    ).toBeVisible();

    await expect(
        page.getByText("Required Actions").first()
    ).toBeVisible();
});

test("debt search accepts input and seeded debts persist", async ({ page }) => {
    await seedLocalStorage(page, {
        ...BASE,
        debts: [
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
        ],
    });

    const debtsCol = await billsSection(page, "debts");

    const searchInput = debtsCol.getByPlaceholder("Search debts...");

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

    // "Import Backup" lives in the first-run setup panel, so seed the state that
    // shows it: onboarded (no onboarding flow) but no paycheck configured.
    await seedLocalStorage(page, { hasCompletedOnboarding: true });

    await page.locator(".import-button input[type='file']").setInputFiles(fixturePath);

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

    // v1.6 onboarding-seam fixes:
    // (1) Importing from the first-run overlay must CLOSE it and load the plan —
    //     it previously stayed up ("stuck"), with the plan blocked underneath.
    await expect(page.locator(".settings-overlay")).toBeHidden();
    await expect(page.getByRole("button", { name: /Recommended Actions/i })).toBeVisible();
    // (2) The Payday Autopilot sheet must NOT auto-open on import: the backup's
    //     stale payday is rolled forward to a real upcoming date, so it isn't payday.
    await expect(page.locator(".payday-sheet")).toHaveCount(0);

    // …and the payday was actually rolled to the future (not the backup's past date).
    const nextPayday = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("debtPlanner.nextPaycheckDate") ?? '""')
    );
    const todayISO = new Date().toISOString().slice(0, 10);
    expect(nextPayday >= todayISO).toBe(true);
});
