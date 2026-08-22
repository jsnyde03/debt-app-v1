import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * §12.7.1 — and what this file pins INVERTED at [M1-8], 2026-08-21.
 *
 * It used to assert that More's "Share anonymous usage" switch was present and ON by default. The switch
 * is gone, because it governed nothing: `track()` forwards to a sink, `setFunnelSink` has no production
 * caller, and so the control offered the user a choice about data that never left the device — on the one
 * screen whose entire job is to be believed.
 *
 * ⚠️ **The direction was measured, not assumed.** The instinct is to wire a sink so the control becomes
 * true. R2 checked the live privacy page: it states "no behavioral analytics" in the affirmative, it is
 * linked from the paywall under Guideline 3.1.2, and a sink would make that claim false. Collect nothing,
 * claim nothing, show nothing.
 *
 * ⛔ **The hazard this file now guards is the OPPOSITE of the old one.** `analyticsOptOut` is absent by
 * default, which reads as opted-IN. With no row on any screen, the day a sink is attached telemetry would
 * begin flowing with no control anywhere. `funnel.test.ts` fails the moment `setFunnelSink` gains a
 * production caller and says to restore this row; this spec is the other half — it fails if the row comes
 * back WITHOUT that, so the two cannot drift apart in either direction.
 */

// COVERS: §12.7.1 — More carries no analytics control, because nothing is collected
test('More offers no "Share anonymous usage" control while no sink exists', async ({ page }) => {
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/more');

  // ⛔ A sibling row FIRST. An absence assertion on its own is satisfied by a page that never rendered —
  // the single most common way a "passing" negative test means nothing. App Lock sits directly above the
  // row that was removed, so this proves the Preferences section is on screen and populated.
  await expect(page.getByLabel('App Lock')).toBeVisible({ timeout: 15_000 });

  await expect(page.getByLabel('Share anonymous usage')).toHaveCount(0);
  await expect(page.getByText('Which screens get used', { exact: false })).toHaveCount(0);
});
