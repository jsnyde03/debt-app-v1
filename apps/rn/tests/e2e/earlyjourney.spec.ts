import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.3.6.2 — the early Progress hero leads FORWARD: before any payment (0% paid), the sub-line reads
 * "{remaining} to go" (a goal) instead of a deflating "$0 of $X paid".
 */

test.use({ viewport: { width: 402, height: 874 } });

for (const theme of ['light', 'dark'] as const) {
  test(`§3.3.6.3 Welcome leads with the Guardian job (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: false, themeMode: theme } }));
    await page.goto('/onboarding');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/welcome-${theme}.png` });
    await expect(page.getByText('Will you make it to payday?')).toBeVisible();
    await expect(page.getByText('A guardian for every payday')).toBeVisible();
  });

  test(`early Progress hero leads forward (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({
      subscriptionPlan: 'premium',
      paycheck: { amount: '2400', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
      // A fresh debt: balance === originalBalance → 0% paid (the deflating case the reframe fixes).
      debts: [{ id: 'd', name: 'Card', balance: 5000, originalBalance: 5000, minimumPayment: 120, apr: 12, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
      prefs: { onboardingComplete: true, guardianIntroSeen: true, themeMode: theme },
    }));
    await page.goto('/progress');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `test-results/early-progress-${theme}.png` });
    await expect(page.getByText(/to go/)).toBeVisible();
    await expect(page.getByText(/of .* paid/)).toHaveCount(0); // the deflating phrasing is gone
  });
}
