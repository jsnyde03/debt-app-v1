import { expect, test } from "@playwright/test";
import { seedLocalStorage } from "./helpers/seed";

// A configured, onboarded planner — lands straight on the main Plan view (not
// the first-run overlay), so the StorageCorruptionBanner at the top of
// app-content is reachable.
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

// Un-parseable bytes planted at debtPlanner.debts. Distinctive so the non-wipe
// and quarantine assertions can match the exact original.
const CORRUPT_DEBTS = "{corrupt-debts-not-json";

// The headline data-loss guarantee (safeStorage + usePersistedState): when a
// persisted key fails to parse, the mechanism must (1) PRESERVE the original
// bytes — never overwrite them with the fallback — (2) QUARANTINE a recoverable
// copy, and (3) SURFACE the corruption to the user via the banner. debts is the
// key the original data-destroying bug lived in; the same code path guards every
// debtPlanner.* key. Complements planner-herdening's "does not crash" smoke test,
// which corrupts the collections but doesn't assert the safety guarantees.
test("corrupt debts is preserved (not wiped), quarantined, and surfaced", async ({ page }) => {
    // rawState is written after the JSON seed, so this overrides BASE.debts=[]
    // with raw, un-parseable bytes the app hits on its first JSON.parse.
    await seedLocalStorage(page, BASE, { debts: CORRUPT_DEBTS });

    // The app still renders — the read returns the [] fallback for this session's
    // in-memory state, so a single bad key never white-screens the planner.
    await expect(page.getByRole("heading", { name: "Debt Planner" })).toBeVisible();

    // 1. NON-DESTRUCTIVE: the live key still holds the ORIGINAL corrupt bytes.
    //    usePersistedState skipped the mount write-back, so the fallback was NOT
    //    persisted over the original (the headline bug stays fixed).
    const liveDebts = await page.evaluate(() =>
        localStorage.getItem("debtPlanner.debts")
    );
    expect(liveDebts).toBe(CORRUPT_DEBTS);

    // 2. RECOVERABLE: the original bytes were quarantined under a
    //    debtPlanner.__corrupt__.debtPlanner.debts.<timestamp> key.
    const quarantined = await page.evaluate(() => {
        const found: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("debtPlanner.__corrupt__.debtPlanner.debts.")) {
                found.push(localStorage.getItem(k) ?? "");
            }
        }
        return found;
    });
    expect(quarantined).toContain(CORRUPT_DEBTS);

    // 3. SURFACED: the non-blocking corruption banner is shown (not a silent
    //    console.warn), so the user knows something was protected.
    await expect(page.locator(".storage-corruption-banner")).toBeVisible();
});
