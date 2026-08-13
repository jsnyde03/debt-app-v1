import { test, expect } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * PROBE (throwaway) — does a coach mark survive a route push?
 *
 * Observed on the iPad run `31705617155`: the `trajectory-scrub` mark is on screen in `ipad-04-progress`
 * (subject present) AND still on screen in `ipad-05-more-two-column`, lying across the More settings list
 * where its subject does not exist.
 *
 * ⚠️ Recorded as an OBSERVATION with no mechanism. `CoachMarkLayer` is the component in which five
 * mechanisms were asserted and four refuted, so the standing rule is probe it, do not reason at it.
 *
 * ⚡ Why this can be a web probe at all: `trajectory-scrub` is offered UNCONDITIONALLY
 * (`progress.tsx:73`) with no `Platform.OS` gate — unlike `debt-row-actions`, whose iOS-only gate is what
 * made it cost five CI cycles. If the defect reproduces here it costs seconds, not a 22-minute run.
 */
/**
 * ⛔ `test.fail()` — REPRODUCED 2026-08-13, and this marks a defect that is still open, not a test that is
 * broken. The assertion below states the CORRECT behaviour, so the suite stays green while the defect
 * exists and **this test starts failing the moment somebody fixes it** — at which point delete this line
 * and it becomes the regression gate. A `skip` would rot silently; an unmarked failure would red the gate
 * and get muted. This is the one shape that cannot become a lie in either direction.
 */
test.fail();
test('does the trajectory-scrub mark survive navigating to More?', async ({ page }) => {
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/progress');

  const mark = page.getByText('Drag the curve', { exact: false });
  await mark.waitFor({ timeout: 15000 });
  console.log('  ✅ mark is up on Progress');

  await page.getByTestId('more-button').click();
  await page.getByText('Export backup').waitFor({ timeout: 15000 });
  console.log('  ✅ More has rendered (Export backup is visible)');

  const stillThere = await mark.isVisible().catch(() => false);
  console.log(`  ⇒ mark still visible on More: ${stillThere ? 'YES — REPRODUCED' : 'no'}`);

  // The assertion states the CORRECT behaviour, so a red here IS the reproduction.
  expect(stillThere, 'a coach mark about the Progress chart is showing over More').toBe(false);
});
