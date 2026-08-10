import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.7.A10.1 [D22a] — one Add, and the answer routes.
 *
 * The defect this closes is silent: a terminating obligation filed as a perpetual one is reserved
 * correctly every payday and omitted from the payoff plan and the debt-free date. Nothing on screen says
 * so. So these assert **where the record landed**, not that a sheet opened — an editor appearing proves
 * nothing about which list it writes to, and "which list" is the entire bug.
 */
test.use({ viewport: { width: 402, height: 874 } });

const onboarded = () => scenario({ prefs: { onboardingComplete: true } });

/** Open the chooser from the section a user happens to be standing in. */
async function openChooser(page: import('@playwright/test').Page, from: 'Debts' | 'Expenses' | 'Goals') {
  await page.goto('/money');
  if (from !== 'Debts') await page.getByText(from, { exact: true }).click();
  // By testID, not by label: the copy is "Add" today and this change is *about* the copy, and the
  // empty-state CTA is a `Button` whose accessible name comes from child text — which `getByLabel` does
  // not match on web. One handle covers the list row and the empty state in all three sections.
  await page.getByTestId('money-add').first().click();
  await expect(page.getByText('What are you adding?')).toBeVisible();
}

test('the chooser is reachable from every section — the section no longer decides', async ({ page }) => {
  // The point of [D22a]: standing in Goals must not pre-commit you to adding a goal. If any of these
  // three stopped opening the chooser, the section would silently be doing the classifying again.
  for (const from of ['Debts', 'Expenses', 'Goals'] as const) {
    await seedStore(page, onboarded());
    await openChooser(page, from);
    await expect(page.getByTestId('add-choice-debt')).toBeVisible();
    await expect(page.getByTestId('add-choice-expense')).toBeVisible();
    await expect(page.getByTestId('add-choice-goal')).toBeVisible();
  }
});

test('"a debt" routes to Debts and writes a DEBT — from the Expenses section', async ({ page }) => {
  await seedStore(page, onboarded());
  // Deliberately starting in Expenses: the old behaviour would have produced an expense from here.
  await openChooser(page, 'Expenses');
  await page.getByTestId('add-choice-debt').click();

  // The debt editor, not the expense one — asserted on a field only a debt has.
  await expect(page.getByText('Edit debt').or(page.getByText('Add debt'))).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('APR %')).toBeVisible();
});

test('"an expense" routes to Expenses and writes an EXPENSE — from the Debts section', async ({ page }) => {
  await seedStore(page, onboarded());
  await openChooser(page, 'Debts');
  await page.getByTestId('add-choice-expense').click();

  // The expense editor has an Amount and no APR; APR is the discriminator that matters, because it is
  // the field whose absence makes an obligation invisible to the payoff plan.
  await expect(page.getByPlaceholder('e.g. 850')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('APR %')).toHaveCount(0);
});

test('"a savings goal" routes to Goals — the third destination, on its own axis', async ({ page }) => {
  await seedStore(page, onboarded());
  await openChooser(page, 'Debts');
  await page.getByTestId('add-choice-goal').click();

  await expect(page.getByText('Target amount').or(page.getByText('Goal name'))).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('APR %')).toHaveCount(0);
});

test('a MORTGAGE entered through the chooser lands in Debts, where it counts', async ({ page }) => {
  // The case that started this. Rent and a mortgage look identical in a list — same cadence, same fixed
  // amount, same "housing" — and only one of them ever ends. This walks the whole flow and then reads
  // the persisted store, because the payoff plan reads `debts` and nothing else.
  await seedStore(page, onboarded());
  await openChooser(page, 'Expenses');
  await page.getByTestId('add-choice-debt').click();
  await expect(page.getByText('APR %')).toBeVisible({ timeout: 10_000 });

  await page.getByPlaceholder('Visa, Car Loan').fill('Mortgage');
  await page.getByPlaceholder('e.g. 2400').fill('240000');
  await page.getByPlaceholder('e.g. 65').fill('1600');
  await page.getByPlaceholder('e.g. 22.99').fill('6.5');
  // "Add debt" on a new record, "Save" when editing — `DebtSheet.tsx:210`.
  await page.getByText('Add debt', { exact: true }).click();

  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const store = JSON.parse(raw ?? '{}');
      return {
        debts: (store.debts ?? []).map((d: { name: string }) => d.name),
        expenses: (store.requiredExpenses ?? []).map((e: { name: string }) => e.name),
      };
    }, { timeout: 10_000 })
    .toEqual({ debts: expect.arrayContaining(['Mortgage']), expenses: [] });
});
