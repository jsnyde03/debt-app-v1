import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * [S1 · pass 1 · M1] Money's grouped Expenses list and its "where it goes" receipt were both built by
 * `BILL_CATEGORY_ORDER.map()` + `filter(e => e.category === category)` — an ENUMERATION of a menu, not a
 * PARTITION of the input. A bill whose `category` was absent or unrecognised matched no bucket and
 * rendered nowhere: not viewable, editable or deletable, and absent from search too (`match` is applied
 * INSIDE each bucket) — **while still being reserved from every paycheck.**
 *
 * ⛔ The assertions are on the SCREEN, not on the resolver. A unit test of `resolveBillCategory` passes
 * whether or not either list calls it, and the missing CALL was the entire defect.
 *
 * ⚠️ Both classes are asserted, because the fix sorts bills into two of them. A categorised bill must
 * stay under its own heading (planting "everything is Other" reds that row) and an uncategorised one must
 * appear under Other (planting the original `e.category ===` reds that row). Either assertion alone
 * leaves the other half unfalsifiable.
 */
test.use({ viewport: { width: 402, height: 874 } });

const bill = (id: string, name: string, amount: number, category?: string) => ({
  id,
  name,
  amount,
  dueDate: day(6),
  recurrence: 'monthly',
  ...(category === undefined ? {} : { category }),
});

/**
 * Nine recurring bills — one over `BILL_GROUPING_THRESHOLD` (8), which is the only branch the defect
 * lives in; below it Money renders one flat list and every bill shows. Two of the nine are the classes
 * the import doors can produce: `NO_CATEGORY` has no `category` KEY at all (`raw-v17` hands arbitrary
 * JSON straight to `runMigrations`, and no migration backfills the field), and `UNKNOWN_CATEGORY` carries
 * a string outside `BILL_CATEGORY_ORDER` (a straight key copy validates nothing).
 */
const EXPENSES = [
  bill('e-rent', 'Rent', 1200, 'housing'),
  bill('e-power', 'Power', 90, 'utilities'),
  bill('e-water', 'Water', 40, 'utilities'),
  bill('e-car-ins', 'Car insurance', 110, 'insurance'),
  bill('e-stream', 'Streaming', 16, 'subscriptions'),
  bill('e-gym', 'Gym', 35, 'discretionary'),
  bill('e-scripts', 'Prescriptions', 25, 'medical'),
  bill('e-nocat', 'Storage unit', 50), // no `category` key at all
  { ...bill('e-unknown', 'Allotment rent', 30), category: 'groceries' }, // a value the app does not know
];

const seeded = () => scenario({ requiredExpenses: EXPENSES, paycheck: { amount: '2000' } });

async function openExpenses(page: import('@playwright/test').Page) {
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();
  // ⛔ Waits on a ROW, not a category heading. Waiting on "Housing" would make this helper red first
  // under the "everything resolves to Other" plant, so the in-test heading assertions below would never
  // run — the plant would look sound while proving only that the helper works.
  await expect(page.getByText('Rent', { exact: true })).toBeVisible({ timeout: 10_000 });
}

test('a bill the app cannot categorise still renders — under Other, in the grouped list', async ({ page }) => {
  await seedStore(page, seeded());
  await openExpenses(page);

  // The honest state, asserted BY NAME. "Storage unit is not missing" would also be satisfied by a
  // heading that says nothing, or by the row landing in the wrong group.
  await expect(page.getByText('Other', { exact: true })).toBeVisible();
  await expect(page.getByText('Storage unit', { exact: true })).toBeVisible();
  await expect(page.getByText('Allotment rent', { exact: true })).toBeVisible();

  // The OTHER class: a bill the app does know keeps its own heading. This is the assertion an
  // "everything resolves to Other" plant reds, and without it that direction is unfalsifiable.
  await expect(page.getByText('Rent', { exact: true })).toBeVisible();
  await expect(page.getByText('Housing', { exact: true })).toBeVisible();
  await expect(page.getByText('Utilities', { exact: true })).toBeVisible();
});

test('search reaches it — the row was absent from results too, because match ran inside each bucket', async ({ page }) => {
  await seedStore(page, seeded());
  await openExpenses(page);

  await page.getByPlaceholder('Search expenses').fill('Storage');
  await expect(page.getByText('Storage unit', { exact: true })).toBeVisible();
  // And search still EXCLUDES what does not match — otherwise "everything renders" would pass this.
  await expect(page.getByText('Rent', { exact: true })).toHaveCount(0);
});

test('editing it does not write the unreadable value back — the third site of the same shape', async ({ page }) => {
  // Found by M1's after-scan, and reachable ONLY because of M1: before the lists partitioned, there was
  // no row to tap. `ExpenseSheet` seeded its picker from `editing?.category ?? 'other'`, which catches an
  // ABSENT category and not an UNRECOGNISED one — so `Select` fell to its `?? 'Select'` fallback and the
  // form showed an existing bill as if its category had never been set.
  await seedStore(page, seeded());
  await openExpenses(page);

  await page.getByText('Allotment rent', { exact: true }).click();
  await expect(page.getByText('Edit expense', { exact: true })).toBeVisible({ timeout: 10_000 });

  // The honest state by name. ⛔ NOT `expect('Select').toHaveCount(0)` — that is also true of a sheet
  // that failed to open, and of a Category row that vanished.
  // Scoped to the sheet — unscoped, the "Other" GROUP HEADING behind it satisfies this.
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Other', { exact: true })).toBeVisible();

  await page.getByText('Save', { exact: true }).click();
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const s = JSON.parse(raw ?? '{}');
      return (s.requiredExpenses ?? []).find((e: { id: string }) => e.id === 'e-unknown')?.category;
    }, { timeout: 10_000 })
    // Saving an untouched form used to round-trip 'groceries' straight back into the store.
    .toBe('other');
});

test('the "where it goes" receipt accounts for it — the same drop, one sheet over', async ({ page }) => {
  await seedStore(page, seeded());
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();

  // The hero opens the receipt; it is pressable whenever there is a recurring bill.
  await page.getByTestId('money-hero-expenses-value').click();

  // ⛔ Scoped to the sheet. Unscoped, every one of these also matches the list BEHIND it — the receipt
  // could render empty and all three would pass on the rows the previous test already covers.
  const receipt = page.getByRole('dialog');
  await expect(receipt.getByText('Storage unit', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(receipt.getByText('Allotment rent', { exact: true })).toBeVisible();
  await expect(receipt.getByText('Other', { exact: true })).toBeVisible();
  // The known-category half of the receipt. ⛔ The HEADING, not the row: "Rent is in the receipt" is
  // true under the "everything resolves to Other" plant too, so it cannot falsify that direction.
  await expect(receipt.getByText('Housing', { exact: true })).toBeVisible();
  await expect(receipt.getByText('Rent', { exact: true })).toBeVisible();
});
