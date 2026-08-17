import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 4.1.10 — §12.7.1, and it was MIS-FILED for as long as it has existed.
 *
 * The row sits under "§12 — the bounded demo" and has nothing to do with the demo: it is the analytics
 * opt-out in More → Preferences. 4.1.10's routing found it by reading the fifteen rows rather than by
 * running anything — *"it sits in the scripted section for no reason anyone wrote down"* — and it needs no
 * demo run of any kind. Hence its own file rather than a lodger in `demo-containment.spec.ts`.
 *
 * ⚠️ THE DEFAULT IS THE LOAD-BEARING HALF. The pref is stored INVERTED (`analyticsOptOut`), so "ON by
 * default" means the absence of a stored value has to read as opted-IN. A default that silently flipped
 * would be a privacy regression that no crash and no visual check could ever surface — the switch would
 * simply be off, and look deliberate.
 */

// COVERS: §12.7.1 — the "Share anonymous usage" row is present, ON by default, and toggling it persists
test('the analytics opt-out is present, ON by default, and its toggle persists', async ({ page }) => {
  // No `analyticsOptOut` in the seed — the point is what happens when nothing has been stored.
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/more');

  const toggle = page.getByLabel('Share anonymous usage');
  await expect(toggle).toBeVisible({ timeout: 15_000 });

  // ON by default, from an absent pref.
  await expect(toggle).toBeChecked();

  await toggle.click();
  await expect(toggle).not.toBeChecked();

  // ⛔ ASSERTED IN THE STORE, not only in the UI. A switch that moves on screen and writes nothing is the
  // exact shape of this defect class, and it looks correct in a screenshot.
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      return JSON.parse(raw ?? '{}').prefs?.analyticsOptOut;
    }, { timeout: 5_000 })
    .toBe(true);

  // …and back, because a one-way toggle would satisfy everything above.
  await toggle.click();
  await expect(toggle).toBeChecked();
});
