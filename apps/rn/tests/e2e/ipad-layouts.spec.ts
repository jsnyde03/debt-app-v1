import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * TEST-2 (closeout) — the 3.6 iPad adaptive layouts, exercised at an EXPANDED (≥1024pt) viewport. Every
 * other spec pins the phone width, so the whole master-detail + two-column + hover block was regression-
 * unprotected on web (where the `useLayout` breakpoints DO apply). Real pointer/keyboard/Split-View FEEL
 * stays device-QA; the layout reflow + hover state machine are web-verifiable and locked here.
 */
test.use({ viewport: { width: 1194, height: 834 } });

const DEBTS = scenario({
  debts: [
    { id: 'd0', name: 'Visa', balance: 2400, minimumPayment: 65, apr: 22.99, dueDate: '2026-08-01', type: 'debt', recurrence: 'monthly', originalBalance: 4200 },
    { id: 'd1', name: 'Car Loan', balance: 8200, minimumPayment: 240, apr: 6.5, dueDate: '2026-08-05', type: 'debt', recurrence: 'monthly', originalBalance: 12000 },
  ],
  prefs: { onboardingComplete: true },
});

const seedTheme = (theme: 'light' | 'dark') => ({ ...DEBTS, prefs: { ...(DEBTS.prefs as object), themeMode: theme } });

for (const theme of ['light', 'dark'] as const) {
  test(`iPad Money = master-detail: list + detail pane at once (${theme})`, async ({ page }) => {
    await seedStore(page, seedTheme(theme));
    await page.goto('/money');
    // Both panes render simultaneously on the expanded canvas: the list (a debt) + the detail placeholder.
    await expect(page.getByText('Visa').first()).toBeVisible();
    await expect(page.getByText('Select a debt to edit, or add one.')).toBeVisible();
    // Selecting a row fills the detail pane with the INLINE edit form (no modal) → the placeholder is gone.
    await page.getByText('Car Loan').first().click();
    await expect(page.getByText('Select a debt to edit, or add one.')).toHaveCount(0);
  });
}

test('iPad row hover flips the row surface (pointer affordance)', async ({ page }) => {
  await seedStore(page, seedTheme('dark'));
  await page.goto('/money');
  const row = page.getByText('Visa').first().locator('xpath=ancestor::*[@role="button"][1]');
  await expect(row).toBeVisible();
  const before = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
  await row.hover();
  await page.waitForTimeout(150);
  const after = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(after, 'row background should change on hover').not.toBe(before);
});

test('iPad Today renders wide (Guardian present at expanded width)', async ({ page }) => {
  await seedStore(page, seedTheme('dark'));
  await page.goto('/');
  await page.waitForTimeout(600);
  await expect(page.getByText('PAYDAY GUARDIAN').first()).toBeVisible();
  const len = await page.evaluate(() => (document.body.innerText || '').length);
  expect(len).toBeGreaterThan(60);
});
