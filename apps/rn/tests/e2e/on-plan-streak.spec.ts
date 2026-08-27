import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.7.B.3 (F10.3) [D27] — the free on-plan streak, on the Progress hero.
 *
 * The port that mattered was the READ, not the badge: the Capacitor app showed a flame and a count, this
 * shows a caption in the same voice as the line above it. The second test is the load-bearing one — the
 * claim has a floor, and below it the app says nothing rather than celebrating a single cycle.
 */

const cycles = (onPlan: boolean[]) =>
  onPlan.map((allRequiredMet, i) => ({ cycleEndDate: `2026-0${i + 1}-01`, allRequiredMet }));

test('an on-plan run reads as a caption on the Progress hero', async ({ page }) => {
  await seedStore(page, scenario({ cycleHistory: cycles([true, true, true]) }));
  await page.goto('/progress');

  await expect(page.getByText('3 paychecks on plan')).toBeVisible();
});

test('one cycle is below the floor — the app makes no claim at all', async ({ page }) => {
  await seedStore(page, scenario({ cycleHistory: cycles([true]) }));
  await page.goto('/progress');

  // ⛔ **THE POSITIVE FIRES FIRST.** [S1.10.6.7.1 · pass-3 D3-5] `toHaveCount(0)` is satisfied by a page
  // that has not rendered yet, so on its own this test passed over a Progress screen returning `null` —
  // the auditor measured exactly that with a `if (true) return null` plant. The hero renders in BOTH
  // branches, so waiting for it makes the absence assertion mean something.
  // ⚠️ Do NOT "fix" this class by adding a second absence assertion.
  await expect(page.getByTestId('progress-hero-journey')).toBeVisible();
  await expect(page.getByText('paychecks on plan')).toHaveCount(0);
});

test('a broken run ends the streak rather than shrinking it', async ({ page }) => {
  // Most recent cycle off-plan → nothing, however long the run before it was.
  await seedStore(page, scenario({ cycleHistory: cycles([true, true, true, false]) }));
  await page.goto('/progress');

  // The same positive-first rule as the test above — see the note there.
  await expect(page.getByTestId('progress-hero-journey')).toBeVisible();
  await expect(page.getByText('paychecks on plan')).toHaveCount(0);
});
