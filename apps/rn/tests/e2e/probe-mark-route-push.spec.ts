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
 * ✅ **FIXED 2026-08-13 (4.1.5.4) — this is now the regression gate.** It carried `test.fail()` for the
 * few hours the defect was open, and Playwright reported *"Expected to fail, but passed"* the moment
 * `useCoachMark` gained its focus gate, which is exactly what that marker is for: a `skip` rots silently
 * and an unmarked failure reds the gate and gets muted, while this shape cannot become a lie in either
 * direction. The marker is deleted; the assertion is unchanged.
 */
test('a coach mark does not survive navigating to More', async ({ page }) => {
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/progress');

  const mark = page.getByText('Drag the curve', { exact: false });
  const subject = page.getByTestId('tutorial-target-trajectory-scrub');
  await mark.waitFor({ timeout: 15000 });
  const beforeBox = await mark.boundingBox();
  const subjectBefore = await subject.count();
  console.log(`  ✅ on Progress — mark @ y=${beforeBox?.y.toFixed(0)} · subject nodes=${subjectBefore}`);

  await page.getByTestId('more-button').click();
  await page.getByText('Export backup').waitFor({ timeout: 15000 });
  console.log('  ✅ More has rendered (Export backup is visible)');

  const stillThere = await mark.isVisible().catch(() => false);
  const afterBox = stillThere ? await mark.boundingBox() : null;
  const subjectAfter = await subject.count();
  console.log(`  ⇒ on More    — mark visible=${stillThere} @ y=${afterBox?.y.toFixed(0) ?? '—'} · subject nodes=${subjectAfter}`);

  // ── WHICH STAGE? The layer renders on two things: `active` (the store still says a mark is up) and
  // `rect` (the last successful measurement of its subject). This distinguishes them WITHOUT reading the
  // store, and without adding app-side instrumentation to a component that has already had five
  // mechanisms asserted at it and four refuted:
  //
  //   subject gone + mark at the SAME y  → the rect is STALE. Nothing re-measured or invalidated when the
  //                                        subject left, so the layer is drawing at coordinates for a
  //                                        screen that is no longer mounted.
  //   subject gone + mark MOVED          → something did re-measure and produced a new rect anyway, which
  //                                        would refute the stale-rect story and point at `measure`.
  //   subject still present              → More does not unmount Progress, and the question is instead why
  //                                        the mark is drawn above the pushed route.
  if (stillThere && beforeBox && afterBox) {
    const moved = Math.abs(afterBox.y - beforeBox.y) > 1;
    console.log(`  ⇒ STAGE: subject ${subjectAfter === 0 ? 'GONE' : 'STILL PRESENT'} · rect ${moved ? 'MOVED' : 'UNCHANGED'}`);
  }

  // The assertion states the CORRECT behaviour, so a red here IS the reproduction.
  expect(stillThere, 'a coach mark about the Progress chart is showing over More').toBe(false);
});
