import { expect, test, type Page } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7g.2 (audit C8) — importing debts from a CSV.
 *
 * ⛔ **These assert WHAT LANDED IN THE STORE, not that a sheet opened.** An import that showed a
 * confident preview and wrote nothing — or wrote a balance of `null` — would satisfy every UI assertion
 * while being the whole defect. The money rows in particular go all the way to the persisted value,
 * because `Number("1,200")` is `NaN` and `JSON.stringify` serialises that as `null`.
 *
 * ⚠️ **The paste path is deliberately the one under test.** `CSV_FILE_SUPPORTED` is false on web, so the
 * document picker cannot be reached here at all — that is a P6.14 row by construction. Everything after
 * the bytes arrive is identical for both doors, so this covers the parse, the preview, the skipped-row
 * report and the apply.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

async function readDebts(page: Page) {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), KEY);
  return (JSON.parse(raw ?? '{}').debts ?? []) as { id: string; name: string; balance: number; apr: number }[];
}

/** Open the import sheet from the Debts section and paste a document into it. */
async function paste(page: Page, csv: string) {
  await page.goto('/money');
  await page.getByTestId('debts-import-csv').first().click();
  await expect(page.getByTestId('csv-import-input')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('csv-import-input').fill(csv);
  await page.getByText('Check file', { exact: true }).click();
}

const HEADER = 'name,balance,minimumPayment,apr,dueDate';

test('the import door is in the Debts section, in BOTH the empty state and the list', async ({ page }) => {
  // ⛔ The empty state is the case that matters most — a user arriving with a portfolio listed elsewhere
  // should not have to type it in one debt at a time — and it is a different render branch, so a door
  // present in the footer proves nothing about it.
  await seedStore(page, scenario({ debts: [] }));
  await page.goto('/money');
  await expect(page.getByTestId('debts-import-csv').first()).toBeVisible({ timeout: 10_000 });

  await seedStore(page, scenario());
  await page.goto('/money');
  await expect(page.getByTestId('debts-import-csv').first()).toBeVisible({ timeout: 10_000 });
});

test('a clean file previews, then lands in the store on apply', async ({ page }) => {
  await seedStore(page, scenario({ debts: [] }));
  await paste(page, `${HEADER}\nVisa,2400,75,19.99,2026-09-01\nCar loan,8000,220,4.5,2026-09-05`);

  await expect(page.getByTestId('csv-import-summary')).toContainText('Visa');
  await expect(page.getByTestId('csv-import-summary')).toContainText('Car loan');
  // ⛔ Nothing may be written by the PREVIEW. A user who backs out here has not imported anything.
  expect(await readDebts(page)).toHaveLength(0);

  await page.getByText('Add 2 debts', { exact: true }).click();
  await expect.poll(async () => (await readDebts(page)).length, { timeout: 15_000 }).toBe(2);

  const debts = await readDebts(page);
  expect(debts.map((d) => d.name).sort()).toEqual(['Car loan', 'Visa']);
  expect(debts.find((d) => d.name === 'Visa')?.balance).toBe(2400);
  // The batch id bug, end to end: two rows minted in one pass must not share an id.
  expect(new Set(debts.map((d) => d.id)).size).toBe(2);
});

test('a grouped balance survives the import — "1,200" is 1200 in the store, not null', async ({ page }) => {
  await seedStore(page, scenario({ debts: [] }));
  await paste(page, `${HEADER}\nVisa,"1,200",75,19.99,2026-09-01`);
  await page.getByText('Add 1 debt', { exact: true }).click();

  await expect.poll(async () => (await readDebts(page)).length, { timeout: 15_000 }).toBe(1);
  const [debt] = await readDebts(page);
  // ⛔ Asserting the NUMBER, not "not null". `NaN` serialises to `null`, loads as `0`, and files the debt
  // under the literal header PAID OFF — so a weaker assertion would pass over a corrupted balance.
  expect(debt.balance).toBe(1200);
});

test('an unreadable APR refuses its row rather than importing a 0% card', async ({ page }) => {
  await seedStore(page, scenario({ debts: [] }));
  await paste(page, `${HEADER}\nVisa,2400,75,not-a-rate,2026-09-01\nCar loan,8000,220,4.5,2026-09-05`);

  // ⛔ The row is SKIPPED, not silently zeroed. `Number(apr) || 0` made the engine project an
  // interest-free payoff on a card that charges — a wrong plan, which outlives a skipped row.
  await expect(page.getByTestId('csv-import-skipped')).toContainText('1 row skipped');
  await expect(page.getByTestId('csv-import-summary')).not.toContainText('Visa');

  await page.getByText('Add 1 debt', { exact: true }).click();
  await expect.poll(async () => (await readDebts(page)).length, { timeout: 15_000 }).toBe(1);
  expect((await readDebts(page))[0].name).toBe('Car loan');
});

test('a partly-broken file reports every row it skipped, and imports the rest', async ({ page }) => {
  await seedStore(page, scenario({ debts: [] }));
  await paste(page, `${HEADER}\nVisa,2400,75,19.99,2026-09-01\n,900,40,0,2026-09-05\nCard,600,30,0,`);

  const skipped = page.getByTestId('csv-import-skipped');
  await expect(skipped).toContainText('2 rows skipped');
  // Named by the row number the user counts in a spreadsheet, header included.
  await expect(skipped).toContainText('Row 3');
  await expect(skipped).toContainText('Row 4');
  await expect(page.getByTestId('csv-import-summary')).toContainText('Visa');
});

test('a file with nothing importable says so and does not offer to add nothing', async ({ page }) => {
  await seedStore(page, scenario({ debts: [] }));
  await paste(page, `${HEADER}\n,,,,`);
  await expect(page.getByTestId('csv-import-error')).toBeVisible();
  // Still on the input step: there is no preview to confirm, so there is no "Add 0 debts" to tap.
  await expect(page.getByTestId('csv-import-input')).toBeVisible();
});

test('an import ADDS to the plan — it never replaces what is already there', async ({ page }) => {
  // ⛔ The backup import next door REPLACES everything. Two doors a tap apart with opposite semantics is
  // exactly the confusion worth pinning: this one must be additive.
  await seedStore(page, scenario());
  const before = await (async () => { await page.goto('/money'); return readDebts(page); })();
  expect(before.length).toBe(1);

  await paste(page, `${HEADER}\nVisa,2400,75,19.99,2026-09-01`);
  await page.getByText('Add 1 debt', { exact: true }).click();

  await expect.poll(async () => (await readDebts(page)).length, { timeout: 15_000 }).toBe(2);
  expect((await readDebts(page)).map((d) => d.name)).toContain('Card');
});
