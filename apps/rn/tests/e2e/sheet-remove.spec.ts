import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.5.6b — the entity sheets' own **Remove** confirms before it destroys anything.
 *
 * It used to be a direct action, deliberately. The native lane retired that: a Maestro tap aimed at the
 * sheet's "View payoff schedule" row landed on the sticky action bar underneath it and deleted a $2,400
 * debt in one touch, with no dialog and no undo — while the swipe and the long-press menu, the same
 * destructive act on the same debt, both guarded. This is the regression test for the guard, and it
 * covers the CANCEL direction too: a confirm the user declines must leave the plan untouched.
 */

test.use({ viewport: { width: 402, height: 874 } });

const SEED = scenario({
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ],
  prefs: { onboardingComplete: true, guardianIntroSeen: true },
});

test('the debt sheet asks before removing, and declining keeps the debt', async ({ page }) => {
  await seedStore(page, SEED);
  await page.goto('/money');

  await page.getByText('Visa', { exact: true }).first().click();
  await expect(page.getByText('Edit debt')).toBeVisible();

  // Decline → the debt survives and the sheet is still open on it.
  page.once('dialog', (d) => void d.dismiss());
  await page.getByText('Remove', { exact: true }).click();
  await expect(page.getByText('Edit debt')).toBeVisible();

  // Accept → it goes, and only it.
  page.once('dialog', (d) => void d.accept());
  await page.getByText('Remove', { exact: true }).click();
  await expect(page.getByText('Visa', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Car', { exact: true })).toBeVisible();
});
