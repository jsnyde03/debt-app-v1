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

/**
 * ⛔ **S1.10.6.6 [pass-3 B2] — THE ONLY APR PATH THAT ENFORCED NOTHING.**
 *
 * ⚡ The CSV import, the statement scanner and the v1.6 form all bound the rate to `0–100`; the two RN
 * hand-entry paths tested only *"did it parse"*. So `2599` — a missing decimal point in `25.99`, the
 * commonest slip on a `decimal-pad` field labelled *"APR %"* — was saved and planned against as **2599%**:
 * a $5,000 card accruing **$10,829.17 of interest a month**, ranked first under avalanche, with a debt-free
 * date computed from it.
 *
 * ⚠️ **A unit test asserted this bound and passed**, because `parseDebtFormValues`' only live consumer is
 * the legacy root tree. The guard travelled with v1.6 and never crossed. These assert what LANDED, for the
 * reason this file's header already gives.
 */
test('B2 · an APR above 100 is REFUSED — nothing is written', async ({ page }) => {
  await seedStore(page, scenario());
  await openAddDebt(page);

  const before = (await readStore(page)).debts?.length ?? 0;

  await page.getByTestId('field-debt-name').fill('Slipped card');
  await page.getByTestId('field-debt-balance').fill('5000');
  await page.getByTestId('field-debt-minimum').fill('150');
  await page.getByTestId('field-debt-apr').fill('2599');
  await page.getByRole('button', { name: 'Add debt' }).click();

  // ⛔ The honest state by name: the sheet stays open on an error that names the range.
  await expect(page.getByText('Enter an APR between 0 and 100.')).toBeVisible();
  const after = await readStore(page);
  expect(after.debts?.length ?? 0).toBe(before);
  expect(after.debts?.some((d: { name: string }) => d.name === 'Slipped card')).toBeFalsy();
});

/**
 * ⛔ **S1.11.4.6 [pass-4 `A-F5`] — `B2` WAS FIXED AT BOTH HAND-ENTRY PATHS AND GUARDED AT ONE.**
 *
 * ⚡ The test above drives `DebtSheet` through `openAddDebt`, which goes `/money` → `money-add` →
 * `add-choice-debt`. **The onboarding form is a different component**, reached only before
 * `onboardingComplete`, and every scenario in this suite seeds it `true`. Measured by auditor A: delete
 * the four lines that bound the rate at `FirstDebtOrBillStep.tsx:70-73`, rebuild `dist/` and run the whole
 * suite — **325 of 325 e2e tests and all three unit suites green** with the bound gone. Not one assertion
 * in the tree touched it. ⛔ `lint:finding-guards` reported `S1P3-B2-APRBOUND` green the whole time, and
 * it was green **about the site that is covered**.
 *
 * ⛔ **SO THE PATHS ARE A LIST AND THE ASSERTION WALKS IT.** A second test naming the second path would
 * leave the third one — whenever it arrives — exactly where this one was. ⚠️ Its completeness is not this
 * file's claim: `packages/core/imports/debtCsv.ts` and the legacy `parseDebtFormValues` bound the rate too
 * and are not e2e-reachable; what the list holds is **every path a user can type an APR into by hand**,
 * which is the population `A-F5` counted over the whole repo.
 *
 * ⚠️ Each row asserts **what landed in the store**, not that an error appeared — this file's own standard,
 * and the reason `B2` survived a unit test that passed.
 */
const APR_ENTRY_PATHS: {
  label: string;
  seed: Record<string, unknown>;
  open: (page: Page) => Promise<void>;
  fill: (page: Page, apr: string) => Promise<void>;
  submit: string;
  /** The field that is still on screen when the entry was REFUSED — the deterministic half of the test. */
  stillOpen: string;
}[] = [
  {
    label: 'Money → add a debt (DebtSheet)',
    seed: scenario(),
    open: openAddDebt,
    fill: async (page, apr) => {
      await page.getByTestId('field-debt-name').fill('Slipped card');
      await page.getByTestId('field-debt-balance').fill('5000');
      await page.getByTestId('field-debt-minimum').fill('150');
      await page.getByTestId('field-debt-apr').fill(apr);
    },
    submit: 'Add debt',
    stillOpen: 'field-debt-apr',
  },
  {
    label: "onboarding → the user's FIRST debt",
    /**
     * ⛔ **A GENUINE PRE-ONBOARDING STORE — no income, no obligations.** A full `scenario()` with the flag
     * flipped is a **contradictory fixture**: `runMigrations` PROMOTES a store carrying income AND an
     * obligation to onboarded (a v1.6 backup file cannot express the flag, and the restored portfolio was
     * being hidden behind this very gate), so the route guard correctly renders Today and the step under
     * test is never reached. ⚠️ `earlyjourney.spec.ts` records this from 2026-08-19 and my first cut
     * walked into it anyway — the suite caught it by timing out on "Get started" over a Today screen.
     */
    seed: scenario({ paycheck: { amount: '' }, debts: [], requiredExpenses: [], prefs: { onboardingComplete: false } }),
    open: async (page) => {
      await page.goto('/onboarding');
      await page.getByRole('button', { name: 'Get started' }).click();
      await page.getByTestId('field-paycheck-amount').fill('2000');
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.getByTestId('field-onboarding-apr')).toBeVisible({ timeout: 10_000 });
    },
    fill: async (page, apr) => {
      await page.getByTestId('field-onboarding-name').fill('Slipped card');
      await page.getByTestId('field-onboarding-balance').fill('5000');
      await page.getByTestId('field-onboarding-minimum').fill('150');
      await page.getByTestId('field-onboarding-apr').fill(apr);
    },
    submit: 'Add & Continue',
    stillOpen: 'field-onboarding-apr',
  },
];

for (const path of APR_ENTRY_PATHS) {
  test(`A-F5 · ${path.label} — an APR above 100 is REFUSED, nothing is written`, async ({ page }) => {
    await seedStore(page, path.seed);
    await path.open(page);
    const before = (await readStore(page)).debts?.length ?? 0;
    await path.fill(page, '2599');
    await page.getByRole('button', { name: path.submit }).click();
    // ⛔ The honest state by name: the form stays put on an error that names the range.
    await expect(page.getByText('Enter an APR between 0 and 100.')).toBeVisible();
    // ⛔ …and the form really is still the thing on screen. This is the DETERMINISTIC half: a path that
    // accepted the value advances (the onboarding step) or closes (the sheet), so this locator's own
    // timeout is what carries the row rather than the store read below.
    await expect(page.getByTestId(path.stillOpen)).toBeVisible();
    /**
     * ⛔ **AND WHAT LANDED — WITH A SETTLE, BECAUSE WITHOUT ONE THIS ASSERTION WAS VACUOUS.** Measured:
     * with the onboarding bound deleted and the error assertion relaxed, `readStore` immediately after the
     * click reported **0 debts** and the row PASSED; the same read after two seconds reported **1, named
     * "Slipped card"**. The write lands — the assertion was racing it, which is
     * `absence-assertions-pass-before-render` in its timing form. The wait is justified by that
     * measurement, not by taste.
     */
    await page.waitForTimeout(2_000);
    const after = await readStore(page);
    expect(after.debts?.length ?? 0).toBe(before);
    expect(after.debts?.some((d: { name: string }) => d.name === 'Slipped card')).toBeFalsy();
  });

  test(`A-F5 control · ${path.label} — a real APR still lands`, async ({ page }) => {
    // ⭐ Or a path that had simply stopped accepting debts would satisfy the row above.
    await seedStore(page, path.seed);
    await path.open(page);
    await path.fill(page, '25.99');
    await page.getByRole('button', { name: path.submit }).click();
    await expect
      .poll(async () => (await readStore(page)).debts?.find((d: { name: string }) => d.name === 'Slipped card')?.apr)
      .toBe(25.99);
  });
}

test('B2 control · a real APR still goes in, and 100 is still allowed', async ({ page }) => {
  await seedStore(page, scenario());
  await openAddDebt(page);

  await page.getByTestId('field-debt-name').fill('Real card');
  await page.getByTestId('field-debt-balance').fill('5000');
  await page.getByTestId('field-debt-minimum').fill('150');
  await page.getByTestId('field-debt-apr').fill('25.99');
  await page.getByRole('button', { name: 'Add debt' }).click();

  await expect
    .poll(async () => (await readStore(page)).debts?.find((d: { name: string }) => d.name === 'Real card')?.apr)
    .toBe(25.99);
  // ⚠️ The boundary itself, because "greater than 100" and "100 or more" are one keystroke apart and the
  // three paths that already enforce this all accept exactly 100.
  await openAddDebt(page);
  await page.getByTestId('field-debt-name').fill('Edge card');
  await page.getByTestId('field-debt-balance').fill('5000');
  await page.getByTestId('field-debt-minimum').fill('150');
  await page.getByTestId('field-debt-apr').fill('100');
  await page.getByRole('button', { name: 'Add debt' }).click();
  await expect
    .poll(async () => (await readStore(page)).debts?.find((d: { name: string }) => d.name === 'Edge card')?.apr)
    .toBe(100);
});
