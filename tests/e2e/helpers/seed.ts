import type { Page } from "@playwright/test";

/**
 * Seed `debtPlanner.*` localStorage keys BEFORE the app's first render, then
 * navigate to the app.
 *
 * Why not the old `goto() -> evaluate(setItem) -> reload()` dance: that was racy.
 * Between the initial load and the seed landing, the app could render its
 * first-run state (empty paycheck -> setup overlay), and that overlay would then
 * intercept the test's first interaction. `addInitScript` runs before any page
 * script on every navigation, so the very first paint already sees the seed —
 * the race is gone.
 *
 * A sessionStorage sentinel makes the seed apply only on the initial load, so any
 * data the app writes during a test survives a later `page.reload()` (the many
 * "add X -> reload -> assert persisted" tests depend on that).
 *
 * Keys are passed bare (e.g. `amount`, `debts`) and get the `debtPlanner.` prefix
 * + JSON.stringify here, matching how the app reads them.
 */
export async function seedLocalStorage(
    page: Page,
    state: Record<string, unknown>,
    // Keys stored as bare strings (not JSON) — e.g. debtPlanner.mockSubscription,
    // which useSubscription reads via a raw getItem, not JSON.parse.
    rawState: Record<string, string> = {}
): Promise<void> {
    await page.addInitScript(({ seed, raw }) => {
        if (sessionStorage.getItem("__e2e_seeded__") === "1") return;
        localStorage.clear();
        for (const [key, value] of Object.entries(seed)) {
            localStorage.setItem(`debtPlanner.${key}`, JSON.stringify(value));
        }
        for (const [key, value] of Object.entries(raw)) {
            localStorage.setItem(`debtPlanner.${key}`, value);
        }
        sessionStorage.setItem("__e2e_seeded__", "1");
    }, { seed: state, raw: rawState });

    await page.goto("/");
}
