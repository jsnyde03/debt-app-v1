import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * 3.7.A9 — the variable-income controls, driven THROUGH THE UI.
 *
 * ⚠️ The seeding shortcut is banned here on purpose. `incomeVaries` was read by six engine modules and
 * written by nothing in the app, so no user could reach any variable-income feature — and the suite stayed
 * green throughout, because `vis5-cone.spec.ts` sets the flag straight into the store. The test and the
 * user were entering through different doors, and only the test's door existed.
 *
 * So every assertion below starts from a control a finger can reach.
 */

test.use({ viewport: { width: 402, height: 874 } });

// Real debt and real bills, because the band only renders when the typical and lean runs produce
// DIFFERENT dates — a thin fixture yields one date, no band, and a failure that has nothing to do with the
// control under test.
//
// ⚠️ RELATIVE dates, per the seed helper's own warning. The first draft copied `vis5-cone.spec.ts`'s
// calendar literals and failed for a reason that looked like a broken feature: saving through the sheet
// re-stamps `currentDate` to TODAY, which left every seeded bill a week overdue, collapsed the allocation,
// and made both income runs project the same date. `vis5-cone` survives its literals only because it never
// opens a sheet. Fixtures that go through the UI cannot borrow a frozen calendar.
const MONEY = {
  debts: [{ id: 'd0', name: 'Visa', balance: 9000, minimumPayment: 220, apr: 21, dueDate: day(6), type: 'debt', recurrence: 'monthly', originalBalance: 11000, balanceAsOfDate: day(0) }],
  requiredExpenses: [
    { id: 'e0', name: 'Rent', amount: 1500, dueDate: day(3), recurrence: 'monthly' },
    { id: 'e1', name: 'Car', amount: 400, dueDate: day(10), recurrence: 'monthly' },
  ],
} as const;

const FIXED = scenario({
  paycheck: { amount: '3000', payCycle: 'monthly', currentDate: day(0), incomeVaries: false, leanAmount: 0 },
  ...MONEY,
  prefs: { onboardingComplete: true, guardianIntroSeen: true },
});

test('the paycheck sheet can turn variable income ON, and the plan starts using it', async ({ page }) => {
  await seedStore(page, FIXED);
  await page.goto('/');

  await page.getByText(/THIS PAYCHECK/i).first().click();
  await expect(page.getByText('Income varies')).toBeVisible();

  // OFF by default → the floor field is withheld rather than rendered dead.
  await expect(page.getByText('The amount you can count on')).toHaveCount(0);

  await page.getByLabel('Income varies').click();
  await expect(page.getByText('The amount you can count on')).toBeVisible();

  // ⚠️ THE ASSERTION THIS ITEM EXISTS FOR: saving with the switch on but no floor must be REFUSED.
  // `selectDebtFreeBand` needs `leanAmount > 0`, so a 0 floor would leave every downstream feature silent
  // and the user would read "I turned it on and nothing happened" — A9's own defect, one layer in.
  await page.getByText('Save paycheck').click();
  await expect(page.getByText(/Enter the amount you can count on/i)).toBeVisible();

  // A floor above a typical paycheck is incoherent and is also refused.
  await page.getByLabel('The amount you can count on').fill('4000');
  await page.getByText('Save paycheck').click();
  await expect(page.getByText(/no more than a typical one/i)).toBeVisible();

  await page.getByLabel('The amount you can count on').fill('2200');
  await page.getByText('Save paycheck').click();

  // ⚠️ The TAB, not `page.goto`. `goto` is a full reload, which re-hydrates from localStorage and races
  // the debounced persist — the band then fails to appear for a reason that has nothing to do with the
  // control, and looks exactly like a broken feature. Tapping the tab is also what a user does: an in-app
  // navigation reads the same in-memory store the save just wrote.
  await page.getByTestId('tab-progress').click();

  // The payoff surface now shows the VIS-5 safe-floor band — the feature that was unreachable. Asserted on
  // the RENDERED band rather than by reading the flag back, which would be the test agreeing with itself.
  await expect(page.getByText(/Safe floor|safe-floor/i).first()).toBeVisible({ timeout: 15_000 });
});

test('turning it back off clears the floor rather than leaving a stale one', async ({ page }) => {
  await seedStore(page, scenario({
    paycheck: { amount: '3000', payCycle: 'monthly', currentDate: day(0), incomeVaries: true, leanAmount: 2200 },
    ...MONEY,
    prefs: { onboardingComplete: true, guardianIntroSeen: true },
  }));
  await page.goto('/');

  await page.getByText(/THIS PAYCHECK/i).first().click();
  // It reflects what is stored, so a returning user sees their own answer rather than a reset one.
  await expect(page.getByLabel('The amount you can count on')).toHaveValue('2200');

  await page.getByLabel('Income varies').click();
  await page.getByText('Save paycheck').click();

  await page.getByText(/THIS PAYCHECK/i).first().click();
  await expect(page.getByText('The amount you can count on')).toHaveCount(0);
  await page.getByLabel('Income varies').click();
  // Cleared, not remembered: a stale floor would keep feeding the engine a number nobody stands behind.
  await expect(page.getByLabel('The amount you can count on')).toHaveValue('');
});
