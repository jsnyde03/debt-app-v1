import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.4.2.3 — the premium Cash Runway ("Breathing room") gains drag-select: sweeping a finger across the
 * chart moves the selected cycle continuously, and the detail receipt below follows (it IS the readout).
 */

test.use({ viewport: { width: 402, height: 874 } });

const PLAN = scenario({
  cushionFloor: 400,
  paycheck: { amount: '1650', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ],
  prefs: { onboardingComplete: true, guardianIntroSeen: true },
});

for (const theme of ['light', 'dark'] as const) {
  test(`§3.4.2.3 Cash Runway drag-select moves the selection (${theme})`, async ({ page }) => {
    await seedStore(page, { ...PLAN, prefs: { ...(PLAN.prefs as object), themeMode: theme } });
    await page.goto('/cushion-forecast');

    const eyebrow = page.getByText('BREATHING ROOM');
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
