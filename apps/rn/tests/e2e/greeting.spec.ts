import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.7.B.2 (F10.1) — Today's header greets by time of day, and by name once one is set.
 *
 * The clock is pinned with `clock.setFixedTime`, NOT `clock.install`: install fakes the timer queue too,
 * and this app's Motion/CountUp layer would sit unrendered waiting for a tick. Fixing only the wall clock
 * is exactly what a `new Date().getHours()` read needs, and it keeps the suite from behaving differently
 * at 4pm than at 9am — the failure mode `helpers/seed.ts` already carries a scar about.
 */

test('Today greets by name, in the right band for the hour', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-11T09:30:00'));
  await seedStore(page, scenario({ prefs: { onboardingComplete: true, displayName: 'Jason' } }));
  await page.goto('/');

  await expect(page.getByText('Good morning, Jason')).toBeVisible();
});

test('the greeting follows the clock, not the calendar', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-11T19:05:00'));
  await seedStore(page, scenario({ prefs: { onboardingComplete: true, displayName: 'Jason' } }));
  await page.goto('/');

  await expect(page.getByText('Good evening, Jason')).toBeVisible();
});

test('with no name set, the header is the bare greeting — never a dangling comma', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-11T14:00:00'));
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/');

  await expect(page.getByText('Good afternoon', { exact: true })).toBeVisible();
  await expect(page.getByText('Good afternoon,')).toHaveCount(0);
});
