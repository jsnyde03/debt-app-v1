import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.7.A0 — reaching the payoff schedule.
 *
 * History: this feature was reported dead on device THREE times. It was a sheet opened from inside the
 * debt edit sheet, which on iOS meant either a nested Modal (never presented) or an absolute overlay
 * rendered as a SIBLING of the presented Modal (so it sat behind it). Both were invisible on device and
 * both passed on web, where everything is one DOM tree.
 *
 * So be honest about what this file can and cannot prove. It covers the JOURNEY and the wiring — the
 * entry exists, it navigates, the route renders the right debt's numbers. It CANNOT prove the device
 * presentation, because the web has no native Modal. That proof lives in the Maestro flow (iOS
 * Simulator, real UIKit presentation) and finally on hardware. The redesign is what makes the class
 * unreachable: there is no nested presentation left to fail.
 */
/**
 * The same tap resolves differently by layout, so both paths are locked. On compact it PUSHES the
 * route; on expanded it fills the master-detail pane, because a push would cover the split.
 */
test.describe('payoff schedule — compact (3.7.A0)', () => {
  test.use({ viewport: { width: 402, height: 874 } });

  test('the edit sheet offers a schedule entry that navigates to the route', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/money');

    // Open the seeded debt's editor.
    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();

    // The entry lives in the sheet BODY now, not the header (the header button was the dead one).
    const entry = page.getByTestId('debt-view-schedule');
    await expect(entry).toBeVisible();
    await entry.click();

    // It NAVIGATES — it does not open a sheet on top of a sheet.
    await expect(page).toHaveURL(/\/schedule\/d0/);
    await expect(page.getByText('Payoff schedule')).toBeVisible();
    // …and the sheet it came from is gone, so nothing can occlude the schedule.
    await expect(page.getByText('Edit debt')).toHaveCount(0);
  });
});

test.describe('payoff schedule — expanded/iPad (3.7.A0)', () => {
  test.use({ viewport: { width: 1194, height: 834 } });

  test('the schedule fills the DETAIL PANE instead of pushing a route over the split', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/money');

    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();
    await page.getByTestId('debt-view-schedule').click();

    // Stays on /money — the split is preserved, the schedule renders beside the list…
    await expect(page).toHaveURL(/\/money/);
    await expect(page.getByText(/debt-free ·/)).toBeVisible();
    // …and the pane has ONE owner: the editor it replaced is gone.
    await expect(page.getByText('Edit debt')).toHaveCount(0);
    // The master list is still there next to it — that's the point of not pushing.
    await expect(page.getByText('Card', { exact: true }).first()).toBeVisible();
  });
});

test.describe('payoff schedule route (3.7.A0)', () => {
  test.use({ viewport: { width: 402, height: 874 } });

  test('the route renders the schedule for the requested debt', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/schedule/d0');

    await expect(page.getByText('Payoff schedule')).toBeVisible();
    await expect(page.getByText('Card', { exact: true }).first()).toBeVisible();
    // A real derived schedule: the debt-free echo + at least one month row with a balance.
    await expect(page.getByText(/debt-free ·/)).toBeVisible();
    await expect(page.getByText(/interest ·/).first()).toBeVisible();
  });

  test('an unknown debt id degrades gracefully instead of crashing the route', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/schedule/does-not-exist');

    await expect(page.getByText('Payoff schedule')).toBeVisible();
    await expect(page.getByText('No schedule to show.')).toBeVisible();
  });
});
