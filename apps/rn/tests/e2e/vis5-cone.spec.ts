import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * VIS-5 (closeout) — the variable-income debt-free CONE. A variable earner sees TWO dated edges: the
 * typical plan (headline) + the lean "Safe-floor" (later). A fixed-income earner sees one date, no band.
 */
test('VIS-5: variable income surfaces a Safe-floor date on the trajectory', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      paycheck: { amount: '3000', payCycle: 'monthly', currentDate: '2026-08-01', incomeVaries: true, leanAmount: 2400 },
      debts: [{ id: 'd0', name: 'Visa', balance: 9000, minimumPayment: 220, apr: 21, dueDate: '2026-08-05', type: 'debt', recurrence: 'monthly', originalBalance: 11000, balanceAsOfDate: '2026-08-01' }],
      requiredExpenses: [
        { id: 'e0', name: 'Rent', amount: 1500, dueDate: '2026-08-01', recurrence: 'monthly' },
        { id: 'e1', name: 'Car', amount: 400, dueDate: '2026-08-10', recurrence: 'monthly' },
      ],
      prefs: { onboardingComplete: true },
    }),
  );
  await page.goto('/progress');
  await expect(page.getByText('PAYOFF TRAJECTORY')).toBeVisible();
  await expect(page.getByText(/Safe-floor/i)).toBeVisible();
});

test('VIS-5: fixed income shows no Safe-floor band', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      paycheck: { amount: '3000', payCycle: 'monthly', currentDate: '2026-08-01', incomeVaries: false, leanAmount: 0 },
      debts: [{ id: 'd0', name: 'Visa', balance: 9000, minimumPayment: 220, apr: 21, dueDate: '2026-08-05', type: 'debt', recurrence: 'monthly', originalBalance: 11000, balanceAsOfDate: '2026-08-01' }],
      requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 1500, dueDate: '2026-08-01', recurrence: 'monthly' }],
      prefs: { onboardingComplete: true },
    }),
  );
  await page.goto('/progress');
  await expect(page.getByText('PAYOFF TRAJECTORY')).toBeVisible();
  await expect(page.getByText(/Safe-floor/i)).toHaveCount(0);
});
