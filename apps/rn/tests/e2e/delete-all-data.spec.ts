import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7d.2 [C9] — the FIRST e2e coverage "Delete all data" has ever had.
 *
 * ⛔ That sentence is the finding, not a preamble — the same one `backup.spec.ts` opens with, one screen
 * over. A destructive, irreversible, user-facing flow shipped through a 117-finding audit gate and a
 * 13-lens sweep with **no test that ever tapped it**, and d.2 then changed it: the handler became async,
 * gained a refusal branch and gained a second destructive button. Changing an untested destructive flow
 * and leaving it untested is how the last two items produced false greens.
 *
 * ⚠️ **Web can only prove the LOCAL half.** `CLOUD_BACKUP_SUPPORTED` is false here, so the iCloud delete
 * is skipped by construction and the blocked branch is unreachable — that half ships with a P6.14 device
 * row, not with a green tick. What web CAN prove is that the wipe reaches the persisted blob and the
 * quarantined copy, and that is precisely the half that used to be silently incomplete.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';
const QUARANTINE_KEY = 'debtPlanner.rnStore.__quarantine__.migration-failed.1750000000000';

/**
 * ⛔ Every assertion below waits for something that renders in BOTH branches first.
 * `expect(x).toHaveCount(0)` is satisfied by a blank page, and two consecutive items in this phase
 * shipped a spec that stayed GREEN with the defect planted back for exactly that reason.
 */
test('deleting all data erases the plan AND the quarantined copy', async ({ page }) => {
  await seedStore(page, scenario());
  // A quarantined blob is a FULL copy of a portfolio, set aside by the corrupt-store path. `adapter.ts`
  // claimed "called from reset all data" — it never was, so this survived the wipe.
  await page.addInitScript(
    (arg) => {
      window.localStorage.setItem(arg.key, JSON.stringify({ debts: [{ name: 'Quarantined Visa' }] }));
    },
    { key: QUARANTINE_KEY },
  );

  // ⛔ PUSHED from the tabs, never `goto('/more')` — and this is a real property of the flow, not test
  // etiquette. `handleDeleteAll` dismisses to the still-mounted tabs FIRST and resets once the pop
  // settles (Freedom RN lesson #6: resetting while More is pushed orphans it on a dead back stack). Land
  // on /more directly and `router.back()` has nothing to pop, so the reset never runs — which is exactly
  // what this spec did on its first draft, and it read as a broken wipe rather than a broken fixture.
  await page.goto('/');
  await page.getByTestId('more-button').click();
  // The both-branches marker: the screen is up and the row exists before anything is asserted absent.
  const deleteRow = page.getByText('Delete all data', { exact: true });
  await expect(deleteRow).toBeVisible();

  // The seed really is there — a wipe test that starts from an empty store proves nothing.
  expect(await page.evaluate((k) => window.localStorage.getItem(k), KEY)).toContain('Card');
  expect(await page.evaluate((k) => window.localStorage.getItem(k), QUARANTINE_KEY)).toContain('Quarantined Visa');

  await deleteRow.click();
  // The confirm names iCloud now, because the code finally erases it. The old copy promised "permanently
  // erased… cannot be undone" while two copies survived.
  await expect(page.getByText('in your iCloud backup', { exact: false })).toBeVisible();
  await page.getByTestId('delete-all-confirm').click();

  // Onboarding is where a wiped store lands (`onboardingComplete: false`), and it renders — so the
  // absence checks below are running against a live page rather than a blank one.
  await expect(page.getByText('Card', { exact: true })).toHaveCount(0);
  await expect(async () => {
    const blob = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
    expect(blob).not.toContain('Card');
  }).toPass({ timeout: 5_000 });

  await expect(async () => {
    const held = await page.evaluate((k) => window.localStorage.getItem(k), QUARANTINE_KEY);
    expect(held).toBeNull();
  }).toPass({ timeout: 5_000 });
});

/**
 * ⛔ COLD ENTRY — the case the spec above was written wrong for, kept as the regression.
 *
 * `handleDeleteAll` sequences the wipe AFTER dismissing to the tabs, so a bare `router.back()` on a
 * screen with nothing beneath it made **"Delete everything" silently do nothing.** The repo had already
 * written this shape down twice — `paywall.tsx` tags it `[C9]`, `schedule/[id].tsx` fixed it at 3.7.A0 —
 * and More, the one screen carrying an irreversible control, still had the bare call.
 */
test('the wipe still happens when More is the only screen on the stack', async ({ page }) => {
  await seedStore(page, scenario());
  await page.goto('/more');

  const deleteRow = page.getByText('Delete all data', { exact: true });
  await expect(deleteRow).toBeVisible();
  expect(await page.evaluate((k) => window.localStorage.getItem(k), KEY)).toContain('Card');

  await deleteRow.click();
  await page.getByTestId('delete-all-confirm').click();

  await expect(async () => {
    const blob = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
    expect(blob).not.toContain('Card');
  }).toPass({ timeout: 5_000 });
});
