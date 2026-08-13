import { test, expect } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 4.1.5.5.3 — does the `trajectory-scrub` coach mark lie across the iPad SIDEBAR RAIL?
 *
 * ⚠️ Observed, not diagnosed, on the iPad run `31705617155`: in `ipad-04-progress` the callout starts at
 * the window's left edge and runs under the rail, while its subject — the payoff-trajectory chart — sits
 * entirely inside the content column. That is §11.15's coordinate-space failure wearing a different
 * component's name, and `CoachMarkLayer` is NOT covered by 4.1.5.2's ring audit.
 *
 * ⚡ **Run at an iPad viewport on WEB, deliberately, because it costs seconds instead of a 22-minute
 * native cycle** — the same reason the route-push defect fell out in Chrome. `phase35-themes.shot.ts`
 * already shoots this app at 1194×834, so the width is a known-good surface.
 *
 * ⛔ WHAT THIS CANNOT SETTLE, stated up front so a green is not over-read: §11.15 measured the tutorial
 * overlay's origin as {0,0} on a real 1032pt iPad, and RN-web puts every overlay origin at 0 too — so if
 * the defect is an ORIGIN error this probe may be blind to it in exactly the way the walkthrough's was.
 * What it CAN settle is the geometry question that does not depend on origin: is the callout's box inside
 * its subject's COLUMN, or does it span the rail? A frame is a frame at any origin.
 */
test('the coach mark stays inside its subject column at iPad width', async ({ page }) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/progress');

  const mark = page.getByText('Drag the curve', { exact: false });
  await mark.waitFor({ timeout: 15000 });

  const markBox = await mark.boundingBox();
  const subjectBox = await page.getByTestId('tutorial-target-trajectory-scrub').boundingBox();
  if (!markBox || !subjectBox) throw new Error('mark or subject did not measure — the probe cannot answer');

  console.log(`  subject column: x=${subjectBox.x.toFixed(0)}..${(subjectBox.x + subjectBox.width).toFixed(0)}`);
  console.log(`  mark          : x=${markBox.x.toFixed(0)}..${(markBox.x + markBox.width).toFixed(0)}`);
  console.log(`  ⇒ mark starts ${(subjectBox.x - markBox.x).toFixed(0)}px LEFT of its subject`);

  // The rail is the band to the left of the content column. A callout about something in the content
  // column has no business starting left of it — that is the observation from `ipad-04`, as a number.
  // ⚠️ A few px of intentional inset is fine; a rail is ~200px+, so the tolerance is generous on purpose
  // and still cannot pass the defect.
  expect(
    markBox.x,
    'the callout starts left of its subject column — it is lying across the sidebar rail',
  ).toBeGreaterThanOrEqual(subjectBox.x - 24);
});
