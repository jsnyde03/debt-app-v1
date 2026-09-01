import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 3.4.1 — Wave C trajectory interactivity. The payoff chart reads its debt-free date off the bead (a
 * gold date pill) at rest, and a finger drag scrubs the curve → a floating date/balance/months readout.
 */

test.use({ viewport: { width: 402, height: 874 } });

// A modest-extra, multi-year plan so multiple debts clear at spread-out months (waypoints have room).
// ⚠️ `requiredExpenses: []` is DELIBERATE, not an oversight: this spec shapes a curve out of debts alone,
// and the fixture's default bill compresses the timeline until the waypoints overlap. Stated explicitly
// so the opt-out reads as a choice — which is the whole point of the default carrying a bill (2026-08-18).
const PLAN = scenario({
  requiredExpenses: [],
  paycheck: { amount: '1650', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
    { id: 'd1', name: 'Klarna', balance: 900, originalBalance: 1200, minimumPayment: 75, apr: 0, dueDate: '2026-08-14', type: 'bnpl', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ],
  prefs: { onboardingComplete: true, guardianIntroSeen: true },
});

for (const theme of ['light', 'dark'] as const) {
  test(`§3.4.1 trajectory: endpoint date pill at rest, scrub readout on drag (${theme})`, async ({ page }) => {
    await seedStore(page, { ...PLAN, prefs: { ...(PLAN.prefs as object), themeMode: theme } });
    await page.goto('/progress');

    const eyebrow = page.getByText('PAYOFF TRAJECTORY');
    await expect(eyebrow).toBeVisible();
    await eyebrow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000); // CanvasKit lazy-load + draw-on

    // At rest: the debt-free date pill is on the bead, no scrub readout.
    await expect(page.getByTestId('traj-endpoint-pill')).toBeVisible();
    await expect(page.getByTestId('traj-scrub-readout')).toHaveCount(0);

    // 3.4.2.1 — the ring's next milestone reads as a clean caption in the hero (22% paid → next 25%).
    await expect(page.getByText(/Next milestone:/)).toBeVisible();

    // Per-debt waypoints — intermediate debts (not the endpoint) get a bead + NAME label where they clear.
    // COH-5: the label is the debt name only — NO "✓" (a future projected clear-month isn't "done"; ✓ = done).
    await expect(page.getByTestId('traj-waypoint').first()).toBeVisible();
    await expect(page.getByText('Klarna')).toBeVisible();
    await expect(page.getByText(/✓/)).toHaveCount(0);

    // Drag across the plot → the scrub readout appears (date · balance · months).
    const box = await eyebrow.boundingBox();
    if (!box) throw new Error('no chart box');
    const cy = box.y + 90;
    await page.mouse.move(box.x + 220, cy);
    await page.mouse.down();
    await page.mouse.move(box.x + 110, cy, { steps: 10 });
    await page.waitForTimeout(150);
    const readout = page.getByTestId('traj-scrub-readout');
    await expect(readout).toBeVisible();
    await expect(readout).toContainText(/mo|now/);
    await expect(readout).toContainText('$');

    // 3.4.2.2 — sweep to the endpoint: the last debt clears there, so the readout names it.
    await page.mouse.move(box.x + 360, cy, { steps: 12 });
    await page.waitForTimeout(150);
    await expect(readout).toContainText(/cleared/);

    // Release → the readout clears, the resting pill returns.
    await page.mouse.up();
    await page.waitForTimeout(150);
    await expect(page.getByTestId('traj-scrub-readout')).toHaveCount(0);
    await expect(page.getByTestId('traj-endpoint-pill')).toBeVisible();
  });
}

/**
 * TEST-4 (closeout): the What-If UI path. Typing an extra payment opens the tool and surfaces the
 * faster-payoff outcome in the legend.
 *
 * ⛔ **S1.13.7.10 [pass-6 `A1-9`] — THIS ASSERTED NOTHING ABOUT THE WHAT-IF.** Its only check was
 * `getByText(/sooner|saved|less interest/).first()`, and the legend's **"Your plan"** row emits those same
 * words from the same `deltaSuffix` helper, **at rest and earlier in the DOM**. So `.first()` resolved to a
 * row that is on screen before the tool is opened: deleting the entire What-If legend row, or making the
 * extra-payment field a no-op, left this test green.
 *
 * ⚡ **The control is the half that makes it an assertion.** Asserting the row is visible AFTER typing
 * proves nothing on its own — it has to be **absent before**, which is what ties the row to the tool.
 */
test('§3.4.1 What-If: typing an extra payment surfaces the faster-payoff readout', async ({ page }) => {
  await seedStore(page, PLAN);
  await page.goto('/progress');
  await page.getByText('PAYOFF TRAJECTORY').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500); // CanvasKit lazy-load + draw-on

  // ⛔ THE CONTROL, before anything is typed: the What-If's own row does not exist yet. Without this the
  // assertion below is satisfied by a legend that never changed.
  await expect(page.getByTestId('traj-legend-with-extra')).toHaveCount(0);

  await page.getByText('What if you paid extra?').click();
  await page.getByLabel('Extra monthly payment amount').fill('300');
  await page.waitForTimeout(300);

  // The outcome lands in the What-If's OWN legend row — not the plan-vs-minimums row above it, which
  // renders the same words unconditionally.
  const withExtra = page.getByTestId('traj-legend-with-extra');
  await expect(withExtra).toBeVisible();
  // …and it carries a real outcome: a payoff date plus the delta that extra payment bought.
  await expect(withExtra).toHaveText(/\d{4}/);
  await expect(withExtra).toHaveText(/sooner|less interest/);
});
