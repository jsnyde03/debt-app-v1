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
 * so the calendar's forward schedule is deterministic — while nothing here can expire.
 *
 * ⛔ **THIS BLOCK USED TO END "the assertions are about installment COUNTS and copy, which don't depend
 * on the calendar at all". That was TRUE when written (2026-08-03) and false from 2026-08-27**, when
 * `19d33732` added the per-month subtotal assertion below and did not revisit this sentence. It went red
 * 16 days later. ⚠️ Anchoring removes the EXPIRY, not the time dependence: the dates no longer go stale,
 * but how they GROUP still moves with the run date. Deleted rather than qualified — a false comment is
 * corrected by removing it.
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
    // ⛔ **THE MONEY HALF IS ASSERTED.** [S1.10.6.7.1 · pass-3 D3-8] The old assertion was
    // `getByText(/payments/).first()`, which pinned the WORD and not the NUMBER — the half of the line
    // that is about money was the half not asserted. `/payments/` also matches `DebtSheet.tsx`, so
    // `.first()` could resolve to a different element entirely.
    //
    // ⚠️ **The finding's own proposed regex was `/\$\d[\d,.]* · \d+ payments/`, and it does not hold.**
    // Two of the three failure modes it names are impossible — `formatCurrency` is defensive and can
    // return neither `""` nor `"$NaN"` (`packages/core/utils/formatCurrency.ts:42`) — while the one that
    // IS reachable, a subtotal of `$0.00`, matches `\$\d[\d,.]*` and would have passed. Hence `[1-9]`:
    // the amount must be present AND non-zero. `payments?` because the line is singular at one payment.
    // ⛔ **AND IT ASSERTED ONE MATCH OVER A LIST WHOSE LENGTH IS THE RUN DATE'S.** [S1.13.7.12.6.5.2]
    // `toBeVisible()` on an unscoped locator is a strict-mode violation the moment a SECOND month group
    // renders — and the group count is a function of today. The fixture anchors to the run date (`day()`),
    // Affirm's two remaining installments are biweekly, and `groupByMonth` keys on `YYYY-MM`, so they
    // straddle a month boundary for most of any month. ⚡ Measured: green 2026-09-06 (Sep 10 · Sep 15 ·
    // Sep 29 — one group), red 2026-09-13 (`$97.56 · 2 payments` + `$78.86 · 1 payment`). Reproduced
    // locally and in CI. **Two groups is CORRECT app behaviour; the assertion was the defect** — the
    // fourth measured instance here of an unscoped `getByText` that only violates strict mode once the
    // data is healthy.
    //
    // ⭐ So it ITERATES the class rather than picking a member: EVERY subtotal the calendar renders must
    // carry a non-zero amount, whatever the run date makes the group count. Strictly stronger than the
    // single match it replaces, and run-date independent.
    //
    // ⚠️ **The locator is permissive about the leading digit and the assertion is not, deliberately.**
    // `[1-9]` in the locator would make a `$0.00` subtotal simply NOT FOUND — and with another group
    // present the count would still be non-zero, so the zero would pass unnoticed. That is exactly the
    // hole `D3-8` added `[1-9]` to close. Permissive find, strict assert keeps it closed.
    //
    // The `^…$` anchors are safe: the subtotal is its own `<Text>` (`BnplCalendarSection.tsx:124-126`),
    // while the per-row line reads "payment i of N" and the amount cell carries no ` · `.
    const subtotals = page.getByText(/^\$[\d,]+(\.\d{2})? · \d+ payments?$/);
    const groupCount = await subtotals.count();
    expect(groupCount).toBeGreaterThan(0);
    for (let i = 0; i < groupCount; i++) {
      await expect(subtotals.nth(i)).toHaveText(/^\$[1-9][\d,]*(\.\d{2})? · \d+ payments?$/);
    }
  });
});
