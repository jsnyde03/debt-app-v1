import { expect, test, type Page } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 5.8.6 — the FIRST e2e coverage this surface has ever had.
 *
 * ⛔ That sentence is the finding, not a preamble. Before 5.8 the importer accepted ANY JSON object and
 * handed it to `importStore`, which replaces the user's entire portfolio — and it survived a seven-lens
 * audit gate with 117 findings, because **not one of the 39 RN specs imported anything.** The only backup
 * test in the repo drives the LEGACY surface that 5.5.1 deletes. A defect nothing exercises is invisible
 * to any number of reviewers.
 *
 * So the assertions here are deliberately about the DESTRUCTIVE direction: that a bad file cannot reach
 * the store, and that a good one needs two deliberate taps. A spec that only proved "a valid backup
 * restores" would pass just as happily against the version that ate people's data.
 *
 * ⚠️ Assertions are on the STORE, not only the screen. The screen can look correct while the persisted
 * blob is wrong — which is exactly what the pre-5.8 v1.6 import did (it rendered a plausible plan with
 * the income silently blanked).
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

/** Field-for-field from `origin/v1.6-dev`'s `buildBackupData()` — a real v1.6 export, not the subset. */
const V16_BACKUP = {
  version: 1,
  exportedAt: '2026-05-23T14:02:11.000Z',
  amount: '3456',
  payCycle: 'monthly',
  monthlyPayDay: 12,
  currentDate: '2026-05-23',
  nextPaycheckDate: '2026-06-05',
  requiredExpenses: [{ id: 'e1', name: 'Rent', amount: 1200, dueDate: '2026-06-01', recurrence: 'monthly', category: 'housing' }],
  livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 400 }],
  debts: [{ id: 'd1', name: 'Restored Visa', balance: 1200, minimumPayment: 35, apr: 19.99, dueDate: '2026-09-01', type: 'debt', recurrence: 'monthly' }],
  goals: [],
  completedRecommendedActions: [],
  payoffStrategy: 'avalanche',
  lastSavedAt: '2026-05-23T14:00:00.000Z',
  cycleHistory: [],
};

async function readStore(page: Page) {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), KEY);
  return JSON.parse(raw ?? '{}');
}

async function openImport(page: Page) {
  await page.goto('/more');
  await page.getByText('Import backup', { exact: true }).click();
}

async function pasteAndCheck(page: Page, text: string) {
  await page.getByTestId('backup-import-input').fill(text);
  await page.getByRole('button', { name: 'Check backup' }).click();
}

// ── ⛔ THE DEFECT: foreign JSON is refused, and the store is UNTOUCHED. ───────────────────────────
for (const [label, payload] of [
  ['an empty object', '{}'],
  ['a package.json', JSON.stringify({ name: 'some-pkg', version: '1.0.0', dependencies: {} })],
  ["another app's export", JSON.stringify({ userProfile: { onboardingComplete: true }, assets: [] })],
  ['prose', 'this is definitely my backup'],
] as [string, string][]) {
  test(`refuses ${label} — and the portfolio survives`, async ({ page }) => {
    await seedStore(page, scenario());
    const before = await (async () => {
      await page.goto('/more');
      return readStore(page);
    })();

    await openImport(page);
    await pasteAndCheck(page, payload);

    await expect(page.getByTestId('backup-import-error')).toBeVisible();
    // ⛔ The confirm screen must never have been reached. Its absence is the assertion — if a refusal
    // still offered "Replace my data", one more tap would finish what the old importer did in one.
    await expect(page.getByTestId('backup-found-summary')).toHaveCount(0);

    const after = await readStore(page);
    expect(after.debts).toHaveLength(before.debts.length);
    expect(after.paycheck.amount).toBe(before.paycheck.amount);
  });
}

// ── ⛔ Checking is NOT replacing. One tap cannot destroy anything. ────────────────────────────────
test('the check step alone does not touch the store', async ({ page }) => {
  await seedStore(page, scenario());
  await openImport(page);
  await pasteAndCheck(page, JSON.stringify(V16_BACKUP));

  // ⚠️ The STORE is read FIRST, deliberately. Ordered the other way round, planting a one-tap replace
  // reds this test on the summary's visibility — because writing the store re-renders and the sheet
  // disappears — and the store assertion never runs at all. The test still fails, which is why the
  // ordering looks harmless; but it would be failing on a side effect rather than on the thing it claims
  // to check, and the day the re-render stops closing the sheet it would go quietly green.
  const after = await readStore(page);
  expect(after.debts?.[0]?.name).toBe('Card');
  expect(after.paycheck.amount).toBe('2000');
  // …and only then: the file WAS accepted, so this is a two-step flow rather than a silent refusal.
  await expect(page.getByTestId('backup-found-summary')).toBeVisible();
});

// ── ⭐ A real v1.6 backup restores, and its INCOME lands. ─────────────────────────────────────────
test('a v1.6 backup restores — and the income is not silently blanked', async ({ page }) => {
  await seedStore(page, scenario());
  await openImport(page);
  await pasteAndCheck(page, JSON.stringify(V16_BACKUP));

  // The summary describes what will actually land, so it is worth asserting on: it is the user's only
  // chance to notice a restore that is about to arrive empty.
  await expect(page.getByTestId('backup-found-summary')).toContainText('1 debt');
  await expect(page.getByTestId('backup-found-summary')).toContainText('older version');

  await page.getByRole('button', { name: 'Replace my data' }).click();

  await expect
    .poll(async () => (await readStore(page)).debts?.[0]?.name)
    .toBe('Restored Visa');
  const after = await readStore(page);
  // ⭐ The measured pre-5.8 failure: income → blank, currentDate → today, payCycle right by coincidence.
  expect(after.paycheck.amount).toBe('3456');
  expect(after.paycheck.currentDate).toBe('2026-05-23');
  expect(after.paycheck.payCycle).toBe('monthly');
  expect(after.livingExpenses).toHaveLength(1);
});

// ── The round trip over the app's OWN export. ────────────────────────────────────────────────────
test('what the app exports is what the app can import', async ({ page }) => {
  await seedStore(page, scenario({ debts: [{ id: 'rt', name: 'Round Trip', balance: 999, minimumPayment: 25, apr: 10, dueDate: '2026-09-01', type: 'debt', recurrence: 'monthly' }] }));
  await page.goto('/more');
  await page.getByText('Export backup', { exact: true }).click();
  const exported = await page.getByTestId('backup-export-text').inputValue();

  // The export must carry the marker — an unmarked export is the format the importer has to guess at.
  expect(exported).toContain('debt-planner-backup');

  await page.getByRole('button', { name: 'Done' }).click();
  await openImport(page);
  await pasteAndCheck(page, exported);
  await expect(page.getByTestId('backup-found-summary')).toBeVisible();
  await page.getByRole('button', { name: 'Replace my data' }).click();

  await expect.poll(async () => (await readStore(page)).debts?.[0]?.name).toBe('Round Trip');
});

// ── A backup from a NEWER build is refused, not half-restored. ───────────────────────────────────
test('a backup from a newer version is refused with an honest reason', async ({ page }) => {
  await seedStore(page, scenario());
  await openImport(page);
  await pasteAndCheck(
    page,
    JSON.stringify({
      format: 'debt-planner-backup',
      formatVersion: 99,
      app: 'Debt Planner',
      exportedAt: '2027-01-01T00:00:00.000Z',
      storeVersion: 99,
      store: { storeVersion: 99, paycheck: {}, debts: [] },
    }),
  );
  await expect(page.getByTestId('backup-import-error')).toContainText('newer version');
  await expect(page.getByTestId('backup-found-summary')).toHaveCount(0);
});

// ── The file buttons are absent on web, not dead. ────────────────────────────────────────────────
// `BACKUP_FILE_SUPPORTED` is false here, and the paste path must remain complete without them. A dead
// button reads as a broken app; an absent one reads as a platform difference.
test('web offers the paste path and no dead file controls', async ({ page }) => {
  await seedStore(page, scenario());
  await openImport(page);
  await expect(page.getByTestId('backup-import-input')).toBeVisible();
  await expect(page.getByTestId('backup-import-file')).toHaveCount(0);
});
