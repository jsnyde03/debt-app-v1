import { expect, test, type Page } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7c.1 (audit B1) — a money field cannot write a number the app cannot read.
 *
 * ⛔ **These assert WHAT LANDED IN THE STORE, not that an error appeared.** The defect was never that the
 * form looked wrong — it looked fine. `Number("1,200")` is `NaN`, `NaN <= 0` is `false`, so the guard
 * passed and the write went through; `JSON.stringify` then serialised it as `null`, which loads as `0`,
 * which files the debt under `PAID OFF` and drops it from the plan, the payoff schedule and the widget.
 * A spec that only checked for a visible error would pass against a build that still corrupts the store.
 *
 * ⚠️ The unit tests in `store/amountField.test.ts` pin the parser. These exist because the parser being
 * correct and the FORM using it are two different claims, and only one of them is visible from here.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

async function readStore(page: Page) {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), KEY);
  return JSON.parse(raw ?? '{}');
}

async function openAddDebt(page: Page) {
  await page.goto('/money');
  await page.getByTestId('money-add').first().click();
  await page.getByTestId('add-choice-debt').click();
  await expect(page.getByText('APR %')).toBeVisible({ timeout: 10_000 });
}

test('a grouped balance is READ, not corrupted — "1,200" becomes 1200', async ({ page }) => {
  await seedStore(page, scenario());
  await openAddDebt(page);

  await page.getByTestId('field-debt-name').fill('Store card');
  await page.getByTestId('field-debt-balance').fill('1,200');
  await page.getByTestId('field-debt-minimum').fill('50');
  await page.getByRole('button', { name: 'Add debt' }).click();

  await expect
    .poll(async () => (await readStore(page)).debts?.find((d: { name: string }) => d.name === 'Store card')?.balance)
    .toBe(1200);
});

test('an unreadable balance is REFUSED — nothing is written', async ({ page }) => {
  await seedStore(page, scenario());
  await openAddDebt(page);

  const before = (await readStore(page)).debts?.length ?? 0;

  await page.getByTestId('field-debt-name').fill('Junk');
  await page.getByTestId('field-debt-balance').fill('abc');
  await page.getByTestId('field-debt-minimum').fill('50');
  await page.getByRole('button', { name: 'Add debt' }).click();

  // The sheet stays open on its error rather than closing over a corrupt write.
  await expect(page.getByText('Enter the current balance.')).toBeVisible();
  const after = await readStore(page);
  expect(after.debts?.length ?? 0).toBe(before);
  expect(after.debts?.some((d: { name: string }) => d.name === 'Junk')).toBeFalsy();
});

test('no debt in the store can carry a null balance after a form write', async ({ page }) => {
  // ⚠️ The class, not the keystroke. `null` is what BOTH `NaN` and `Infinity` serialise to, so this is the
  // one assertion that does not depend on guessing which string a user typed.
  await seedStore(page, scenario());
  await openAddDebt(page);

  await page.getByTestId('field-debt-name').fill('Infinity card');
  await page.getByTestId('field-debt-balance').fill('Infinity');
  await page.getByTestId('field-debt-minimum').fill('50');
  await page.getByRole('button', { name: 'Add debt' }).click();

  // ⛔ **Settle before asserting, or this test passes for free.** Read straight after the click and the
  // write has not flushed to `localStorage` yet — the loop below then walks the SEED debt alone and is
  // vacuously true. Measured: with the old guard planted back, this test PASSED while the other two went
  // red, which is precisely the shape of a green tick that never tested anything.
  await expect
    .poll(async () => {
      const s = await readStore(page);
      if (s.debts?.some((d: { name: string }) => d.name === 'Infinity card')) return 'written';
      return (await page.getByText('Enter the current balance.').isVisible()) ? 'refused' : 'pending';
    })
    .not.toBe('pending');

  const after = await readStore(page);
  for (const d of after.debts ?? []) {
    expect(d.balance, `debt ${d.id} carries an unreadable balance`).not.toBeNull();
    expect(typeof d.balance).toBe('number');
  }
});
