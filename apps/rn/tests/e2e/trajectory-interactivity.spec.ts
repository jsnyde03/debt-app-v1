import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.4.1 — Wave C trajectory interactivity. The payoff chart reads its debt-free date off the bead (a
 * gold date pill) at rest, and a finger drag scrubs the curve → a floating date/balance/months readout.
 */

test.use({ viewport: { width: 402, height: 874 } });

const PLAN = scenario({
  paycheck: { amount: '2600', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
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

    // Release → the readout clears, the resting pill returns.
    await page.mouse.up();
    await page.waitForTimeout(150);
    await expect(page.getByTestId('traj-scrub-readout')).toHaveCount(0);
    await expect(page.getByTestId('traj-endpoint-pill')).toBeVisible();
  });
}
