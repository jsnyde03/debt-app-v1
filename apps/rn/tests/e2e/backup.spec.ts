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
  // ⛔ **WHEN it was saved, on the screen before an irreversible overwrite.** [P6.8.9.7.11.12 · B-J2-2]
  // The counts alone read identically for a backup made this morning and one made in March, and
  // `exportedAt` was dropped inside `readBackup` before it could reach any renderer — while its own
  // docstring said it was surfaced here.
  await expect(page.getByTestId('backup-found-summary')).toContainText('Saved');

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

/**
 * [P6.8.9.7.11.14.2 · audit P1-5] The export sheet's FACE.
 *
 * ⛔ The finding called this *"the worst single frame in the matrix"* — a monospace box reading
 * `"format": "debt-planner-backup", "formatVersion": 1, "storeVersion": 7 …` inside the app's most
 * important trust interaction. Secondary, same frame: **`Done` was the filled primary while
 * `Copy to clipboard` — the only control that backs anything up — was secondary.**
 *
 * ⚠️ Both assertions here are about what is on screen BEFORE any tap. The raw text still exists and the
 * round-trip test above still reads it; what this pins is which one the sheet leads with.
 */
test('P1-5 · the export sheet leads with what the backup HOLDS, and its primary action backs up', async ({ page }) => {
  await seedStore(page, scenario({
    debts: [{ id: 'a', name: 'Card', balance: 1200, minimumPayment: 40, apr: 19, dueDate: '2026-09-01', type: 'debt', recurrence: 'monthly' }],
    goals: [],
  }));
  await page.goto('/more');
  await page.getByText('Export backup', { exact: true }).click();

  // ⚠️ The POSITIVE assertion runs first, deliberately. `toHaveCount(0)` is true of a sheet that never
  // opened — two specs in this repo stayed green with a defect planted for exactly that reason — so the
  // summary being on screen is what makes the next line mean "hidden" rather than "not rendered yet".
  await expect(page.getByTestId('backup-export-summary')).toContainText('1 debt');
  await expect(page.getByTestId('backup-export-text')).toHaveCount(0);

  // ⛔ The sticky primary is the action that puts the data somewhere. On web that is the clipboard
  // (`BACKUP_FILE_SUPPORTED` is false here); on iOS it is `Save as a file`. `Done` is never it.
  //
  // ⚠️ Asserted on the SUBMIT SLOT's own label, not on "a Copy button is visible" — that first draft was
  // vacuous, because a visible `Copy to clipboard` is true of the defect and the fix alike. The finding
  // is about which action is PRIMARY, so the assertion has to name the primary.
  await expect(page.getByTestId('form-sheet-submit')).toHaveText('Copy to clipboard');
  await expect(page.getByTestId('backup-export-done')).toBeVisible();

  // The raw data is reachable, not deleted — this is the whole copy/paste path on web.
  await page.getByTestId('backup-export-raw-toggle').click();
  expect(await page.getByTestId('backup-export-text').inputValue()).toContain('storeVersion');
});

// ── The round trip over the app's OWN export. ────────────────────────────────────────────────────
test('what the app exports is what the app can import', async ({ page }) => {
  await seedStore(page, scenario({ debts: [{ id: 'rt', name: 'Round Trip', balance: 999, minimumPayment: 25, apr: 10, dueDate: '2026-09-01', type: 'debt', recurrence: 'monthly' }] }));
  await page.goto('/more');
  await page.getByText('Export backup', { exact: true }).click();
  // [P6.8.9.7.11.14.2 · P1-5] The raw envelope is now behind a disclosure — the sheet leads with what the
  // backup CONTAINS, not with `"formatVersion": 1, "storeVersion": 7`. The text is still there.
  await page.getByTestId('backup-export-raw-toggle').click();
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

/**
 * P6.3.3.7 — the iCloud row, on the platform where iCloud does not exist.
 *
 * ⛔ **What this defends is the row the app shipped for months: "Automatic cloud backup — coming soon."**
 * (finding L1-29). A promise-shaped row is worse than no row, and the way it survived is that nothing
 * ever asserted on it. So the assertions below are that the promise is GONE and that what replaced it is
 * honest about the platform it is standing on.
 *
 * ⚠️ Web can only ever prove the unavailable branch — the provider is the stub here by construction. The
 * ready branch (toggle · Back up now · restore) is device-only, and P6.3.3.8 owes it a real pass. That
 * boundary is named rather than papered over: a green suite here is not evidence the feature works.
 */
test('the iCloud row no longer promises — and web says so honestly', async ({ page }) => {
  await seedStore(page, scenario());
  await page.goto('/more');

  // ⛔ The retired string, asserted gone. Grepping the source would not catch a second copy elsewhere in
  // the render tree; asserting on the rendered page does.
  await expect(page.getByText('coming soon', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Soon', { exact: true })).toHaveCount(0);

  await page.getByText('iCloud backup', { exact: true }).click();

  // On web the provider is `unavailableCloudBackupProvider`, so the sheet must offer NO controls at all —
  // not a disabled toggle, not a greyed button. Same call `BACKUP_FILE_SUPPORTED` makes above.
  await expect(page.getByTestId('cloud-backup-unavailable')).toBeVisible();
  await expect(page.getByTestId('cloud-backup-toggle')).toHaveCount(0);
  await expect(page.getByTestId('cloud-backup-now')).toHaveCount(0);
  await expect(page.getByTestId('cloud-restore')).toHaveCount(0);
});

/**
 * ⛔ And the store is not touched by any of it. The one thing a backup feature must never do is change
 * the user's data on the way to being unavailable.
 */
test('opening the iCloud sheet on web changes nothing', async ({ page }) => {
  await seedStore(page, scenario());
  await page.goto('/more');
  // ⚠️ Read AFTER navigating. `readStore` evaluates `window.localStorage`, and on `about:blank` — where
  // the page sits before the first `goto` — that throws `SecurityError`, not "empty".
  const before = await readStore(page);
  await page.getByText('iCloud backup', { exact: true }).click();
  await expect(page.getByTestId('cloud-backup-unavailable')).toBeVisible();
  const after = await readStore(page);
  expect(after.debts?.[0]?.name).toBe(before.debts?.[0]?.name);
  expect(after.prefs?.cloudBackupEnabled).toBeUndefined();
});
