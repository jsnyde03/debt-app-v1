import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 3.3.6.2 — the early Progress hero leads FORWARD: before any payment (0% paid), the sub-line reads
 * "{remaining} to go" (a goal) instead of a deflating "$0 of $X paid".
 */

test.use({ viewport: { width: 402, height: 874 } });

for (const theme of ['light', 'dark'] as const) {
  test(`§3.3.6.3 Welcome leads with the Guardian job (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: false, themeMode: theme } }));
    await page.goto('/onboarding');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/welcome-${theme}.png` });
    await expect(page.getByText('Will you make it to payday?')).toBeVisible();
    await expect(page.getByText('A guardian for every payday')).toBeVisible();
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
