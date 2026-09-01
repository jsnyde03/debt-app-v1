import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 3.4.2.3 — the premium Cash Runway ("Cushion by paycheck") gains drag-select: sweeping a finger across the
 * chart moves the selected cycle continuously, and the detail receipt below follows (it IS the readout).
 */

test.use({ viewport: { width: 402, height: 874 } });

const PLAN = scenario({
  cushionFloor: 400,
  paycheck: { amount: '1650', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ],
  prefs: { onboardingComplete: true },
});

for (const theme of ['light', 'dark'] as const) {
  test(`§3.4.2.3 Cash Runway drag-select moves the selection (${theme})`, async ({ page }) => {
    await seedStore(page, { ...PLAN, prefs: { ...(PLAN.prefs as object), themeMode: theme } });
    await page.goto('/cushion-forecast');

    const eyebrow = page.getByText('CUSHION BY PAYCHECK', { exact: true });
    await expect(eyebrow).toBeVisible();
    await page.waitForTimeout(2000); // CanvasKit lazy-load

    // No under-the-line cycle here → the selection defaults to cycle 0, whose receipt reads "This paycheck".
    await expect(page.getByText('This paycheck')).toBeVisible();

    // Sweep to the far right → the selection follows off cycle 0, so its receipt header changes.
    const box = await eyebrow.boundingBox();
    if (!box) throw new Error('no runway box');
    const cy = box.y + 70;
    await page.mouse.move(box.x + 30, cy);
    await page.mouse.down();
    await page.mouse.move(box.x + 320, cy, { steps: 14 });
    await page.waitForTimeout(200);
    await page.mouse.up();

    await expect(page.getByText('This paycheck')).toHaveCount(0);
    // The receipt still reconciles (it's the readout) — its bottom line is always present.
    await expect(page.getByText('Left after essentials')).toBeVisible();
  });
}

/**
 * [T5.3 · L1-13] The Guardian scorecard's DAY-ONE state — the branch every new user is in, and it had
 * ZERO e2e coverage. That gap was surfaced by T4.3 (which renamed "floor" to "line" here, unverified) and
 * filed to T9; T5.3 then renamed the claim itself, so deferring again would ship a SECOND unverified
 * rename on the one state everybody starts in. `scenario()` seeds no calibration history, so
 * `score.proven` is false and this is the branch that renders.
 */
test('the scorecard claims no record it has not earned [L1-13]', async ({ page }) => {
  await seedStore(page, PLAN);
  await page.goto('/cushion-forecast');

  await expect(page.getByText('GUARDIAN ACCURACY')).toBeVisible();

  // ⛔ The retired claim: "Protected since day one" / "protected from the start" asserted a RECORD under
  // an ACCURACY heading, with n = 0 measurements — while this same component names the failure direction
  // out loud once proven ("Under-warned — said you'd hold, you dipped below").
  await expect(page.getByText(/Protected since day one/)).toHaveCount(0);
  await expect(page.getByText(/protected from the start/)).toHaveCount(0);

  // What IS true from day one is the ACTION — the floor auto-protect is confidence-independent.
  await expect(page.getByText('Reserved since day one')).toBeVisible();
  await expect(page.getByText(/set your line aside on every paycheck since the first one/)).toBeVisible();
  // …and the record stays honestly unearned.
  await expect(page.getByText(/track record once I.ve seen a few more paychecks/)).toBeVisible();
});
