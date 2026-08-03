import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 2.7.3 — BNPL-native capture/display (web). The core suite proves the installment model
 * (bnplInstallment); this proves the Money → Debts ROW wiring: an installment-native BNPL reads as
 * its plan ("2 of 4 paid · interest-free") with a provider pill, while a fallback BNPL (no installment
 * fields) still reads "interest-free" under a generic "BNPL" pill. Assertions target visible text.
 */

// A mid-plan installment-native Affirm BNPL (2 of 4 paid: originalBalance 315.44 / 78.86 = 4 total,
// balance 157.72 → 2 left) + a fallback Klarna BNPL (no installment fields) + a regular card.
/**
 * Dates are anchored to the RUN DATE, not written down.
 *
 * They used to be literals (`currentDate: '2026-07-01'`, `nextPaycheckDate: '2026-08-01'`), which made
 * this suite a time bomb: the moment the real clock passed that payday, `usePaydayCapture` saw a landed
 * paycheck and auto-opened the capture sheet, whose backdrop covered the tab bar — so the test failed
 * with "subtree intercepts pointer events" and looked for all the world like a UI regression. It went
 * off between one run and the next.
 *
 * Anchoring keeps what the fixture actually needs — the BNPL due dates all land on/after `currentDate`,
 * so the calendar's forward schedule is deterministic — while nothing here can expire. The assertions
 * are about installment COUNTS and copy, which don't depend on the calendar at all.
 */
const BNPL_DEBTS = [
  { id: 'd0', name: 'Capital One', balance: 1420, minimumPayment: 75, apr: 24.99, dueDate: day(7), type: 'debt', recurrence: 'monthly' },
  { id: 'd1', name: 'Affirm — Furniture', balance: 157.72, originalBalance: 315.44, minimumPayment: 78.86, apr: 0, dueDate: day(9), type: 'bnpl', bnplProvider: 'Affirm', scheduledPaymentAmount: 78.86, remainingPayments: 2, recurrence: 'biweekly' },
  { id: 'd2', name: 'Klarna — Order', balance: 56.09, originalBalance: 56.09, minimumPayment: 18.70, apr: 0, dueDate: day(4), type: 'bnpl', recurrence: 'monthly' },
];

async function openDebts(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Target the tab BUTTON, not its label. This spec runs at the default desktop viewport, which is the
  // regular (iPad) layout — a left rail using the `material` variant, whose ripple surface sits over the
  // label and intercepts the click ("subtree intercepts pointer events"). A real tap is unaffected: the
  // ripple belongs to the pressable and forwards the press. Every other spec already aims at the testID.
  await page.getByTestId('tab-money').click();
  await expect(page.getByText(/2 of 4 paid/)).toBeVisible(); // Debts is the default Money view; unique to the BNPL row
}

// `nextPaycheckDate` stays comfortably in the FUTURE relative to the run: a payday in the past is a
// LANDED payday, and Today auto-opens the capture sheet over everything when it sees one.
const SEED = scenario({
  debts: BNPL_DEBTS,
  paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(31) },
  prefs: { onboardingComplete: true },
});

test.describe('BNPL — first-class row display', () => {
  test('installment-native BNPL reads as its plan; fallback BNPL stays interest-free', async ({ page }) => {
    await seedStore(page, SEED);
    await openDebts(page);

    // Installment-native Affirm: provider pill + "X of N paid" + interest-free (never a meaningless APR).
    // (`.first()` — the provider name also appears below in the 2.7.5 calendar.)
    await expect(page.getByText('Affirm', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/2 of 4 paid/)).toBeVisible();

    // Fallback Klarna (no installment fields): generic BNPL pill, still interest-free.
    await expect(page.getByText('BNPL', { exact: true }).first()).toBeVisible();

    // A BNPL never shows an APR read; the regular card still does.
    await expect(page.getByText(/interest-free/).first()).toBeVisible();
    await expect(page.getByText(/24\.99% APR/)).toBeVisible();
  });

  // 2.7.5 — the consolidated BNPL calendar below the debt list.
  test('the BNPL calendar lists upcoming installments grouped by month', async ({ page }) => {
    await seedStore(page, SEED);
    await openDebts(page);

    await expect(page.getByText('UPCOMING BNPL INSTALLMENTS')).toBeVisible();
    // Affirm's next installment is #3 of 4 (2 paid); the calendar names the position.
    await expect(page.getByText(/payment 3 of 4/)).toBeVisible();
    // A month subtotal line renders ("$X · N payments").
    await expect(page.getByText(/payments/).first()).toBeVisible();
  });
});
