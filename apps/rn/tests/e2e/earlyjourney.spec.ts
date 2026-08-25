import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 3.3.6.2 — the early Progress hero leads FORWARD: before any payment (0% paid), the sub-line reads
 * "{remaining} to go" (a goal) instead of a deflating "$0 of $X paid".
 */

test.use({ viewport: { width: 402, height: 874 } });

for (const theme of ['light', 'dark'] as const) {
  test(`§3.3.6.3 Welcome leads with the Guardian job (${theme})`, async ({ page }) => {
    // ⛔ A genuine PRE-onboarding store — no income, no obligations. The fixture used to be a full
    // `scenario()` with `onboardingComplete: false`, and that state stopped existing on 2026-08-19:
    // `runMigrations` now PROMOTES a store carrying income AND an obligation to onboarded (a v1.6 backup
    // file cannot express the flag, and the restored portfolio was being hidden behind this very gate).
    // So the old fixture asked for a working plan and the screen that only shows without one, and the
    // route guard — correctly — rendered Today. ⚠️ The fixture was contradictory, not the app.
    await seedStore(page, scenario({
      paycheck: { amount: '' },
      debts: [],
      requiredExpenses: [],
      prefs: { onboardingComplete: false, themeMode: theme },
    }));
    await page.goto('/onboarding');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/welcome-${theme}.png` });
    await expect(page.getByText('Will you make it to payday?')).toBeVisible();
    await expect(page.getByText('A guardian for every payday')).toBeVisible();

    /**
     * ⛔ **[A4 + M1-9 · P6.8.9.7.7] THE THIRD WELCOME BULLET, WHICH NOTHING ASSERTED.**
     *
     * Both findings are the same line: it promised a PREMIUM feature to a user who has not chosen a tier,
     * on the first screen of the app. Cluster b replaced it with the privacy bullet — and the verification
     * pass found **no test asserts anything about bullet 3 at all**, so the old promise could return
     * without a single suite noticing. It is also built from CONSTANTS, which makes every copy gate
     * structurally blind to it: `lint:copy` and `lint:glossary` read literals.
     *
     * ⚠️ Asserts the REPLACEMENT is present AND the retired promise is absent. Presence alone would pass if
     * both shipped side by side; absence alone is true of a page that never rendered — the trap this repo
     * has been bitten by twice — which the two assertions above already guard by proving the screen is up.
     */
    await expect(page.getByText('Private by design')).toBeVisible();
    await expect(page.getByText(/never be sold more debt/)).toBeVisible();
    /**
     * ⛔ **THE ABSENCE ASSERT DID NOT NAME THE THING THAT WAS RETIRED.** [P6.8.9.7.11.5] The regex below
     * lists premium FEATURE NAMES, and A4/M1-9's retired bullet was a sentence — *"Check any purchase
     * against your plan before you buy"* — which contains none of those words. **Re-adding that exact
     * bullet passed all three assertions in this block.** The guard was aimed at the category and missed
     * the instance it was written for. (P6.8.9.7.10 · F-3.)
     */
    await expect(page.getByText(/Check any purchase against your plan/i)).toHaveCount(0);
    // The broader net stays: it catches a DIFFERENT premium promise arriving in this slot later.
    await expect(page.getByText(/Smart Insights|Forecast|What-If|Strategy Comparison/i)).toHaveCount(0);
  });

  test(`early Progress hero leads forward (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({
      subscriptionPlan: 'premium',
      paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
      // A fresh debt: balance === originalBalance → 0% paid (the deflating case the reframe fixes).
      debts: [{ id: 'd', name: 'Card', balance: 5000, originalBalance: 5000, minimumPayment: 120, apr: 12, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
      prefs: { onboardingComplete: true, guardianIntroSeen: true, themeMode: theme },
    }));
    await page.goto('/progress');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `test-results/early-progress-${theme}.png` });
    await expect(page.getByText(/to go/)).toBeVisible();
    await expect(page.getByText(/of .* paid/)).toHaveCount(0); // the deflating phrasing is gone
  });
}

/**
 * T3.3 (audit L5-1) — the user who took the OTHER onboarding path.
 *
 * Onboarding step 2 offers "Debt | Expense" as two equal segments. Choosing Expense left a user with a
 * paycheck, a bill and no debts — and Today threw the entire plan away for a single "Add your first
 * debt" card: no hero, no required rows, no "Spoken for", and no Payday Guardian, even though the brief
 * was computed and discarded. The Welcome screen's first promise is "A guardian for every payday", and
 * it was invisible to anyone who had not yet entered debt.
 *
 * ⚠️ Asserts the PLAN is present, not merely that the prompt moved. The cheap version of this fix — keep
 * the prompt, add a hero — would pass a test that only looked for the hero.
 */
test('a user with a paycheck and a bill but NO debts still gets their plan', async ({ page }) => {
  await seedStore(page, scenario({
    debts: [],
    paycheck: { amount: '2000', payCycle: 'biweekly', currentDate: day(0), nextPaycheckDate: day(14) },
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 350, dueDate: day(4), recurrence: 'monthly', category: 'housing' }],
  }));
  await page.goto('/');
  await page.waitForTimeout(600);

  // The Guardian — the headline feature, and the one the old branch computed and discarded.
  await expect(page.getByTestId('payday-guardian-card')).toBeVisible();
  // The hero still frames the cycle.
  await expect(page.getByTestId('plan-hero')).toBeVisible();
  // The required row: their rent is owed whether or not they carry debt.
  await expect(page.getByText('Pay Rent')).toBeVisible();
  // …and the invitation is still offered — demoted to a card INSIDE the plan, not instead of it.
  await expect(page.getByText('Add your first debt')).toBeVisible();
});
