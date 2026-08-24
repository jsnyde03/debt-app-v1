import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * P6.8.9.7.3 [V2-6] — **a coach mark must not land on the card next to its subject.**
 *
 * ⛔ **This is the audit's one WRONG-REMEDY, and the shipped fix made the finding WORSE.** Cluster f
 * corrected a hardcoded height estimate (132 → 144), which is a true fix for the self-occlusion the
 * refuter added — and because the above-branch subtracts that height, it moved the callout **22 px further
 * into the neighbour** (y437 → y415). V2-6 named the real cure in its own last line: *"the vertical axis
 * still has no neighbour-awareness."*
 *
 * ⚡ **Repositioning could never have delivered it.** Measured at 402×874: the subject (`trajectory-scrub`,
 * the whole trajectory card) starts at y≈570 and runs off the bottom; the cash-flow card ends at y≈560. A
 * 144 pt callout has **no position on that screen that covers nothing** — below is off-screen, above is the
 * cash-flow card, the top is the hero. So the page scrolls to make room instead.
 *
 * ⛔ **THE ASSERTION IS GEOMETRIC, AND IT HAS TO BE.** Occlusion is invisible to `toBeVisible()`: the
 * covered date axis, legend and verdict are all still in the DOM with non-zero boxes. Only comparing the
 * two rects can tell the fixed state from the broken one.
 */
test.use({ viewport: { width: 402, height: 874 } });

/** An established plan with the mark UNSEEN — the state a real user meets it in. */
const UNSEEN = () =>
  scenario({
    genuineCycleCount: 6,
    prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: [] },
  });

test('V2-6 — the trajectory coach mark does not cover the cash-flow card', async ({ page }) => {
  await seedStore(page, UNSEEN());
  await page.goto('/progress');

  const mark = page.getByTestId('coach-mark');
  const neighbour = page.getByTestId('cash-flow-section');

  // ⛔ BOTH must be present before anything is compared. A non-intersection assertion is trivially true of
  // a page where one of them never rendered — the absence-passes-before-render trap this repo has been
  // bitten by twice. Proving the mark is up is also what proves the fix is being exercised at all.
  await expect(mark).toBeVisible({ timeout: 15_000 });
  await expect(neighbour).toBeVisible();

  // The scroll is animated, so let it come to rest before measuring — and measure the SETTLED rects.
  await page.waitForTimeout(1_200);

  const markBox = await mark.boundingBox();
  const neighbourBox = await neighbour.boundingBox();
  expect(markBox, 'the coach mark has a measurable box').not.toBeNull();
  expect(neighbourBox, 'the cash-flow card has a measurable box').not.toBeNull();

  const m = markBox!;
  const n = neighbourBox!;
  const overlap = Math.max(0, Math.min(m.y + m.height, n.y + n.height) - Math.max(m.y, n.y));

  expect(
    overlap,
    `the callout (y ${Math.round(m.y)}..${Math.round(m.y + m.height)}) overlaps the cash-flow card ` +
      `(y ${Math.round(n.y)}..${Math.round(n.y + n.height)}) by ${Math.round(overlap)}px — it hides that ` +
      "card's date axis, its “your $200 line” legend and its verdict",
  ).toBe(0);
});
