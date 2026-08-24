import { expect, test, type Page } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7g.4 (audit P1-3 / [D58]) — the Payoff Trajectory's x-axis belongs to the user's own plan.
 *
 * ⛔ **The defect failed in the direction of the user doing WELL.** The domain was the extent of every
 * curve drawn, and the minimums ghost is by definition the longest — so the closer someone got to
 * debt-free, the more their own line collapsed toward the left edge, with the axis running years past
 * their payoff date and the debt-free pill stranded outside the first tick.
 *
 * ⚠️ **The arithmetic is unit-tested in `trajectoryDomain.test.ts`, with plants.** These two assert the
 * RENDERED consequence — that the axis a user actually sees is labelled, and does not run past their own
 * payoff — because a correct domain that never reaches the ticks would satisfy the unit test alone.
 */
test.use({ viewport: { width: 402, height: 874 } });

/** A plan that clears quickly: one small debt against a healthy paycheck. */
const nearPayoff = () =>
  scenario({
    debts: [{ id: 'd0', name: 'Card', balance: 1200, minimumPayment: 40, apr: 19.99, dueDate: day(7), type: 'debt', recurrence: 'monthly' }],
    requiredExpenses: [],
    goals: [],
  });

async function ticks(page: Page) {
  await page.goto('/progress');
  const chart = page.getByTestId('trajectory-x-tick');
  // The chart measures itself before it can place ticks, so wait for the first one rather than reading
  // an empty list off a chart that has not laid out yet.
  await expect(chart.first()).toBeVisible({ timeout: 15_000 });
  return (await chart.allTextContents()).map((t) => t.trim()).filter(Boolean);
}

test('the axis is labelled — a clamped domain must not hand back a BLANK axis', async ({ page }) => {
  // ⛔ This is the regression the fix itself could introduce: clamping to a few months can span no
  // January at all, and year-only ticks would then render nothing. Below two year marks the axis
  // labels months instead.
  await seedStore(page, nearPayoff());
  const labels = await ticks(page);
  expect(labels.length).toBeGreaterThan(0);
});

test('the axis does not run years past the user’s own payoff date', async ({ page }) => {
  await seedStore(page, nearPayoff());
  const labels = await ticks(page);

  // Any 4-digit label is a year mark. The finding's headline was that the FIRST one landed *after* the
  // payoff — so on a plan clearing within a year there should be at most one, and never a run of nine.
  const years = labels.filter((l) => /^\d{4}$/.test(l)).map(Number);
  expect(years.length).toBeLessThanOrEqual(1);

  const thisYear = new Date().getFullYear();
  for (const y of years) {
    // ⚠️ Asserting a BOUND, not an exact year: the seed's payoff month moves with the run date, so a
    // pinned year would rot the way the fixture dates this suite already got burned by did.
    expect(y).toBeLessThanOrEqual(thisYear + 1);
  }
});
