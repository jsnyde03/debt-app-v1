import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

test.use({ viewport: { width: 402, height: 874 } });

/**
 * VIS-6 Windfall Autopilot (web). The marginal split math is app-tested; this proves the Today wiring:
 * the "Add extra income" affordance opens the sheet, and a premium user entering an amount sees the
 * itemized routing preview before confirming. The split rows live inside a FormSheet Modal (RN-web
 * Playwright can't reliably query modal internals — see affordability.spec), so the routing itemization
 * is verified via both-theme screenshots; the assertions cover the reachable wiring.
 */

// A scenario that routes a windfall across multiple buckets: the base paycheck only partly reaches the
// starter emergency fund, so a windfall spills into the EF AND extra debt (the multi-row autopilot split).
function windfallScenario(themeMode?: 'light' | 'dark') {
  return scenario({
    debts: [{ id: 'd0', name: 'Card', balance: 8000, minimumPayment: 200, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly' }],
    goals: [{ id: 'g0', name: 'Emergency fund', targetAmount: 3000, currentAmount: 0, type: 'emergency' }],
    livingExpenses: [{ id: 'l0', name: 'Living', amount: 800, enabled: true }],
    paycheck: { amount: '1500', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    prefs: { onboardingComplete: true, guardianIntroSeen: true, ...(themeMode ? { themeMode } : {}) },
  });
}

test('premium: add-extra-income opens the sheet with the routing preview', async ({ page }) => {
  await seedStore(page, windfallScenario());
  await page.goto('/');
  await page.getByText('Add extra income').click();
  await expect(page.getByText('Extra income', { exact: true })).toBeVisible(); // sheet title
  await page.getByPlaceholder('e.g. 500').fill('1000');
  // The premium routing eyebrow + a Confirm button appear once the split resolves.
  await expect(page.getByText(/HERE'S HOW THE APP WILL ROUTE/)).toBeVisible();
  // T2 — actually CONFIRM and prove it took effect: the sheet closes and the Plan hero now shows the
  // windfall ("$1,000 extra this paycheck"), so a no-op Confirm can't pass.
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Extra income', { exact: true })).toHaveCount(0); // sheet dismissed
  await expect(page.getByText(/\$1,000 extra this paycheck/)).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`windfall routing preview (${theme})`, async ({ page }) => {
    await seedStore(page, windfallScenario(theme));
    await page.goto('/');
    await page.getByText('Add extra income').click();
    await page.getByPlaceholder('e.g. 500').fill('1000');
    await expect(page.getByText(/HERE'S HOW THE APP WILL ROUTE/)).toBeVisible();
    await page.waitForTimeout(400); // let the sheet settle
    await page.screenshot({ path: `test-results/windfall-${theme}.png` });
  });
}
