import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.4.3 — the frosted glass (BlurView) tab bar + sheet scrims are decorative, so this guards the one
 * behavioral risk: the `<SheetScrim>` (`pointerEvents none`) must NOT swallow the backdrop tap — the
 * dismiss Pressable layered on top of it still has to close the sheet.
 */

test.use({ viewport: { width: 402, height: 874 } });

const SEED = scenario({
  debts: [{ id: 'd0', name: 'Existing Card', balance: 500, minimumPayment: 25, apr: 19, dueDate: '2026-08-01', type: 'debt', recurrence: 'monthly' }],
  prefs: { onboardingComplete: true },
});

for (const theme of ['light', 'dark'] as const) {
  test(`§3.4.3 frosted sheet scrim still dismisses on backdrop tap (${theme})`, async ({ page }) => {
    await seedStore(page, { ...SEED, prefs: { ...(SEED.prefs as object), themeMode: theme } });
    await page.goto('/');
    await page.getByText('Money', { exact: true }).click();
    await page.getByText('Scan a statement').click();
    await expect(page.getByText('Add from scan')).toBeVisible();
    await page.waitForTimeout(500); // let the slide-up settle so the backdrop is at its final position

    // Tap the backdrop above the slide-up sheet — the scrim (pointerEvents none) must not intercept it.
    await page.mouse.click(200, 40);
    await expect(page.getByText('Add from scan')).toHaveCount(0);
  });
}
