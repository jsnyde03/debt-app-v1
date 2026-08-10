import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.7.A10.2 [D22b/c] — the recovery path, for a mistake that has ALREADY been made.
 *
 * A10.1's chooser only helps someone who has not filed anything yet. This is the half that reaches
 * backward — and it is the half that matters most, because v1.6's app offered "Credit Card Payment" and
 * "Loan Payment" as one-tap BILL presets, so migrating users arrive already mis-filed.
 *
 * The assertions are on the STORE, not the screen: the defect is that a mis-filed obligation is missing
 * from `debts`, and only `debts` reaches the payoff plan.
 */
test.use({ viewport: { width: 402, height: 874 } });

const MORTGAGE = { id: 'e-mortgage', name: 'Mortgage', amount: 1600, dueDate: '2026-09-01', recurrence: 'monthly', category: 'housing' };
const RENT = { id: 'e-rent', name: 'Rent', amount: 1600, dueDate: '2026-09-01', recurrence: 'monthly', category: 'housing' };

const seeded = (expenses: unknown[]) => scenario({ requiredExpenses: expenses, prefs: { onboardingComplete: true } });

async function openExpenses(page: import('@playwright/test').Page) {
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();
}

test('a mis-filed mortgage is offered a way out — and rent beside it is not accused', async ({ page }) => {
  // Both are housing, monthly, and $1,600. The ONLY thing separating them is the name, which is exactly
  // the claim the detector makes — so they are tested together or the precision claim is untested.
  await seedStore(page, seeded([MORTGAGE, RENT]));
  await openExpenses(page);

  await expect(page.getByTestId('misfiled-convert-e-mortgage')).toBeVisible();
  await expect(page.getByTestId('misfiled-convert-e-rent')).toHaveCount(0);
});

test('"Move to Debts" converts it in ONE write — the expense is gone and the debt exists', async ({ page }) => {
  await seedStore(page, seeded([MORTGAGE]));
  await openExpenses(page);
  await page.getByTestId('misfiled-convert-e-mortgage').click();

  // It lands in Debts, on the form, prefilled with everything the expense already knew.
  await expect(page.getByText('APR %')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByPlaceholder('Visa, Car Loan')).toHaveValue('Mortgage');
  await expect(page.getByPlaceholder('e.g. 65')).toHaveValue('1600');

  // The two fields an expense cannot carry — and the reason this is a form, not a silent re-file.
  await page.getByPlaceholder('e.g. 2400').fill('240000');
  await page.getByPlaceholder('e.g. 22.99').fill('6.5');
  await page.getByText('Add debt', { exact: true }).click();

  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const s = JSON.parse(raw ?? '{}');
      return {
        debts: (s.debts ?? []).map((d: { name: string; balance: number }) => `${d.name}:${d.balance}`),
        expenses: (s.requiredExpenses ?? []).map((e: { name: string }) => e.name),
      };
    }, { timeout: 10_000 })
    // The money moved exactly once. Reserved as an expense AND projected as a debt would be worse than
    // the mistake being corrected.
    .toEqual({ debts: ['Card:5000', 'Mortgage:240000'], expenses: [] });
});

test('"Not a debt" is remembered — a suggestion that cannot be silenced is an accusation', async ({ page }) => {
  await seedStore(page, seeded([MORTGAGE]));
  await openExpenses(page);
  await page.getByTestId('misfiled-dismiss-e-mortgage').click();
  await expect(page.getByTestId('misfiled-convert-e-mortgage')).toHaveCount(0);

  // And it survives a relaunch — asserted through the PERSISTED pref, because the in-memory state would
  // hide a write that never reached storage.
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      return JSON.parse(raw ?? '{}').prefs?.notDebtExpenseIds ?? [];
    }, { timeout: 10_000 })
    .toEqual(['e-mortgage']);
});
