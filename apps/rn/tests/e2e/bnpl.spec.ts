import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 2.7.3 — BNPL-native capture/display (web). The core suite proves the installment model
 * (bnplInstallment); this proves the Money → Debts ROW wiring: an installment-native BNPL reads as
 * its plan ("2 of 4 paid · interest-free") with a provider pill, while a fallback BNPL (no installment
 * fields) still reads "interest-free" under a generic "BNPL" pill. Assertions target visible text.
 */

// A mid-plan installment-native Affirm BNPL (2 of 4 paid: originalBalance 315.44 / 78.86 = 4 total,
// balance 157.72 → 2 left) + a fallback Klarna BNPL (no installment fields) + a regular card.
const BNPL_DEBTS = [
  { id: 'd0', name: 'Capital One', balance: 1420, minimumPayment: 75, apr: 24.99, dueDate: '2026-07-08', type: 'debt', recurrence: 'monthly' },
  { id: 'd1', name: 'Affirm — Furniture', balance: 157.72, originalBalance: 315.44, minimumPayment: 78.86, apr: 0, dueDate: '2026-07-10', type: 'bnpl', bnplProvider: 'Affirm', scheduledPaymentAmount: 78.86, remainingPayments: 2, recurrence: 'biweekly' },
  { id: 'd2', name: 'Klarna — Order', balance: 56.09, originalBalance: 56.09, minimumPayment: 18.70, apr: 0, dueDate: '2026-07-05', type: 'bnpl', recurrence: 'monthly' },
];

async function openDebts(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByText('Money', { exact: true }).click();
  await expect(page.getByText(/2 of 4 paid/)).toBeVisible(); // Debts is the default Money view; unique to the BNPL row
}

test.describe('BNPL — first-class row display', () => {
  test('installment-native BNPL reads as its plan; fallback BNPL stays interest-free', async ({ page }) => {
    await seedStore(page, scenario({ debts: BNPL_DEBTS, prefs: { onboardingComplete: true } }));
    await openDebts(page);

    // Installment-native Affirm: provider pill + "X of N paid" + interest-free (never a meaningless APR).
    await expect(page.getByText('Affirm', { exact: true })).toBeVisible();
    await expect(page.getByText(/2 of 4 paid/)).toBeVisible();

    // Fallback Klarna (no installment fields): generic BNPL pill, still interest-free.
    await expect(page.getByText('BNPL', { exact: true })).toBeVisible();

    // A BNPL never shows an APR read; the regular card still does.
    await expect(page.getByText(/interest-free/).first()).toBeVisible();
    await expect(page.getByText(/24\.99% APR/)).toBeVisible();
  });
});
