import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * ⛔ **S1.10.6.2 · pass-3 `C-1`…`C-6` — the trust rule reaching the claim sites the table never covered.**
 *
 * ⚡ **Pass 2 closed *"the rule is wired to a SUBSET of claim sites and a SUBSET of fields"* by adding a
 * claim TABLE, and pass 3 measured the table's own `'row-figures'` route at ZERO production consumers** —
 * three grep hits, all the declaration or its own test. The FIELDS were widened; the CLAIM SITES were
 * re-declared. Money went on printing *"0% APR"* on a card charging 22% and *"$0.00/mo"* on one demanding
 * $150 — the two strings that route's docblock names as the reason it exists.
 *
 * ⚠️ **`lint:trust-claims` is the structural half of this closure and these are the behavioural half, and
 * they fail in different directions.** The gate cannot tell whether a site asks the RIGHT question; an
 * e2e cannot tell a declared route from a called one. `data-recovery.spec.ts` holds pass 2's `C1`–`C4`
 * guards on the same shape; these are their siblings, kept separate because they close a different pass.
 *
 * ⛔ **Every test here asserts the HONEST replacement by name BEFORE asserting the falsehood is absent.**
 * Suppressing a false sentence can produce a different false one — that is how [B1]'s first cut replaced
 * *"Every balance paid off"* with *"Add a debt"* over debts still owed — and an absence assertion is
 * satisfied by a page that never rendered.
 */
test.use({ viewport: { width: 402, height: 874 } });

// ── C-1 · a row restating its own money ──────────────────────────────────────────────────────────

test('C-1 · a debt row does not restate an APR and a minimum the app never read', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Chase card', balance: 5000, originalBalance: 5000, minimumPayment: 'n/a', apr: 'n/a', dueDate: day(4), type: 'debt', recurrence: 'monthly' },
        { id: 'd1', name: 'Visa', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/money');
  const row = page.getByRole('button', { name: /^Chase card,/ });
  await expect(row).toBeVisible({ timeout: 15_000 });
  // ⛔ THE HONEST STATE BY NAME, FIRST — a row that merely dropped the figures would satisfy the absence
  // assertions below while telling the user nothing about why its numbers are missing.
  // ⚠️ Each field named separately rather than as one sentence: the order follows the REPAIR RECORDS, not
  // the render, so pinning the phrasing would pin `migrations.ts`'s iteration order by accident.
  await expect(row).toHaveAccessibleName(/the interest rate/i);
  await expect(row).toHaveAccessibleName(/the minimum payment/i);
  await expect(row).toHaveAccessibleName(/could not be read/i);
  // ⛔ The two false figures by name. Both are what a repaired `0` renders as — and the spelling is
  // `formatCurrency`'s, which emits cents ONLY when there are cents. (The finding's write-up quoted
  // "$0.00/mo" from its own probe's format string; the screen renders "$0/mo". Measured, not assumed.)
  await expect(row).not.toHaveAccessibleName(/0% APR/);
  await expect(row).not.toHaveAccessibleName(/\$0\/mo/);
  // …and the balance it DID read still stands: per FIELD, never per row.
  await expect(row).toHaveAccessibleName(/\$5,000/);
  // ⭐ PER ROW, NOT PER SCREEN: the healthy card beside it states everything.
  const visa = page.getByRole('button', { name: /^Visa,/ });
  await expect(visa).toHaveAccessibleName(/19% APR/);
  await expect(visa).toHaveAccessibleName(/\$80\/mo/);
});

test('C-1 control · a debt whose figures ALL read still states every one of them', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [{ id: 'd0', name: 'Chase card', balance: 5000, originalBalance: 5000, minimumPayment: 150, apr: 22, dueDate: day(4), type: 'debt', recurrence: 'monthly' }],
    }),
  );
  await page.goto('/money');
  const row = page.getByRole('button', { name: /^Chase card,/ });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toHaveAccessibleName(/22% APR/);
  await expect(row).toHaveAccessibleName(/\$150\/mo/);
  await expect(row).not.toHaveAccessibleName(/could not be read/i);
});

// ── C-2 · a total missing an unknown addend ──────────────────────────────────────────────────────

test('C-2 · Everyday Spending does not headline a reserve missing an unknown addend', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      livingExpenses: [
        { id: 'l1', name: 'Groceries', amount: 'n/a', enabled: true },
        { id: 'l2', name: 'Gas', amount: 120, enabled: true },
      ],
    }),
  );
  await page.goto('/living-expenses');
  const row = page.getByRole('button', { name: /^Groceries,/ });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toHaveAccessibleName(/the amount could not be read/i);
  await expect(row).not.toHaveAccessibleName(/\$0/);
  // The headline is a SUM, so it goes with the addend rather than standing short at $120.
  // ⚠️ Asserted on the headline's OWN testID: "$120" is also the Gas row's amount, and a page-wide text
  // assertion cannot tell a suppressed headline from a surviving row.
  await expect(page.getByText(/set them again and your total comes back/)).toBeVisible();
  await expect(page.getByTestId('living-reserve-headline')).not.toHaveText('$120');
  // ⭐ The row the app DID read still states its own number.
  await expect(page.getByRole('button', { name: /^Gas,/ })).toHaveAccessibleName(/\$120/);
});

test('C-2 control · an Everyday Spending list the app fully read still headlines its total', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      livingExpenses: [
        { id: 'l1', name: 'Groceries', amount: 400, enabled: true },
        { id: 'l2', name: 'Gas', amount: 120, enabled: true },
      ],
    }),
  );
  await page.goto('/living-expenses');
  await expect(page.getByRole('button', { name: /^Gas,/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('living-reserve-headline')).toHaveText('$520');
  await expect(page.getByText(/set them again and your total comes back/)).toHaveCount(0);
});

test('C-2 · the Expenses hero does not RECOMMEND a figure missing a bill it could not read', async ({ page }) => {
  /**
   * ⚠️ **The direction is why this is not merely a wrong readout.** The suppressed figure is a
   * RECOMMENDATION, and a dropped bill makes it SMALLER — the app telling a household whose rent is
   * $1,400 to hold back $55 a paycheck.
   */
  await seedStore(
    page,
    scenario({
      requiredExpenses: [
        { id: 'e1', name: 'Rent', amount: 'n/a', dueDate: day(4), recurrence: 'monthly', category: 'housing' },
        { id: 'e2', name: 'Phone', amount: 60, dueDate: day(6), recurrence: 'monthly', category: 'utilities' },
      ],
    }),
  );
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();
  const row = page.getByRole('button', { name: /^Rent,/ });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toHaveAccessibleName(/the amount could not be read/i);
  await expect(page.getByText(/A bill amount could not be read, so there is no recommendation yet/)).toBeVisible();
  await expect(page.getByText(/recommended each paycheck/)).toHaveCount(0);
});

test('C-2 control · a bills list the app fully read still states its recommendation', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [
        { id: 'e1', name: 'Rent', amount: 1400, dueDate: day(4), recurrence: 'monthly', category: 'housing' },
        { id: 'e2', name: 'Phone', amount: 60, dueDate: day(6), recurrence: 'monthly', category: 'utilities' },
      ],
    }),
  );
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();
  await expect(page.getByRole('button', { name: /^Rent,/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/recommended each paycheck/)).toBeVisible();
  await expect(page.getByText(/A bill amount could not be read/)).toHaveCount(0);
});

// ── C-3 · the sentence and the quantity ──────────────────────────────────────────────────────────

test('C-3 · History does not credit the user with a DELETED debt as money they paid', async ({ page }) => {
  /**
   * ⛔ **DEBT REDUCTION AND MONEY PAID ARE DIFFERENT QUANTITIES**, and the headline printed the first under
   * the second one's name. The fixture is the measured one: two finished cycles in which NOTHING was paid,
   * and a balance that fell only because a $3,000 debt was removed between them. The old expression read
   * `max(0, 8000 − 5077.22)` = **$2,923 paid down**, in success green.
   */
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [{ id: 'd0', name: 'Chase card', balance: 5000, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' }],
      cycleHistory: [
        { cycleEndDate: day(-28), totalDebtBalance: 8000, totalPaidThisCycle: 0 },
        { cycleEndDate: day(-14), totalDebtBalance: 5077.22, totalPaidThisCycle: 0 },
      ],
    }),
  );
  await page.goto('/history');
  // ⛔ The honest state SAID: with nothing paid there is no anchor, and the screen says so rather than
  // inventing a smaller number. This also renders in both branches, so the absence assertion below cannot
  // pass against a page that never drew.
  await expect(page.getByText(/See how far you/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('$2,923')).toHaveCount(0);
});

test('C-3 control · History still anchors on money that WAS paid', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [{ id: 'd0', name: 'Chase card', balance: 5000, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' }],
      cycleHistory: [
        { cycleEndDate: day(-28), totalDebtBalance: 8000, totalPaidThisCycle: 200 },
        { cycleEndDate: day(-14), totalDebtBalance: 7800, totalPaidThisCycle: 150 },
      ],
    }),
  );
  await page.goto('/history');
  await expect(page.getByText(/paid down across 2 cycles/)).toBeVisible({ timeout: 15_000 });
  // 200 + 150 — the money they actually paid, not the $200 the balances happened to move.
  await expect(page.getByText('$350')).toBeVisible();
});

// ── C-4 · the trophy shelf ───────────────────────────────────────────────────────────────────────

test('C-4 · the trophy shelf does not file a cleared debt as "$0 paid off"', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Chase card', balance: 0, originalBalance: 'n/a', minimumPayment: 100, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-30) },
        { id: 'd1', name: 'Visa', balance: 0, originalBalance: 400, minimumPayment: 80, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-10) },
      ],
    }),
  );
  await page.goto('/progress');
  await expect(page.getByText(/DEBTS PAID OFF/)).toBeVisible({ timeout: 15_000 });
  // ⛔ The false figure by name…
  await expect(page.getByText('$0 paid off')).toHaveCount(0);
  // …and the honest replacement: the shelf still lists the debt and says only what it knows.
  await expect(page.getByText('Chase card')).toBeVisible();
  // ⭐ The debt the app DID read keeps its figure — per row, never per screen.
  await expect(page.getByText('$400 paid off')).toBeVisible();
});

test('C-4 control · a shelf whose starting balances all read still states each one', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Chase card', balance: 0, originalBalance: 12000, minimumPayment: 100, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-30) },
        { id: 'd1', name: 'Visa', balance: 0, originalBalance: 400, minimumPayment: 80, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-10) },
      ],
    }),
  );
  await page.goto('/progress');
  await expect(page.getByText('$12,000 paid off')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('$400 paid off')).toBeVisible();
});

// ── C-6 · a short list presented as a whole one ──────────────────────────────────────────────────

test('C-6 · the BNPL calendar says what it could not read instead of listing a short schedule', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Affirm plan', balance: 315.44, originalBalance: 315.44, minimumPayment: 78.86, apr: 0, dueDate: day(4), type: 'bnpl', recurrence: 'biweekly', bnplProvider: 'Affirm', scheduledPaymentAmount: 'n/a', remainingPayments: 4 },
      ],
    }),
  );
  await page.goto('/money');
  await expect(page.getByText('UPCOMING BNPL INSTALLMENTS')).toBeVisible({ timeout: 15_000 });
  // ⛔ The honest state, by NAME and by plan…
  await expect(page.getByText(/Affirm — the payment amount could not be read/)).toBeVisible();
  // …and the shortened schedule is gone rather than standing as the month's whole BNPL load.
  await expect(page.getByText(/1 payment/)).toHaveCount(0);
});

test('C-6 control · a BNPL plan the app read still lists every installment', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Affirm plan', balance: 315.44, originalBalance: 315.44, minimumPayment: 78.86, apr: 0, dueDate: day(4), type: 'bnpl', recurrence: 'biweekly', bnplProvider: 'Affirm', scheduledPaymentAmount: 78.86, remainingPayments: 4 },
      ],
    }),
  );
  await page.goto('/money');
  await expect(page.getByText('UPCOMING BNPL INSTALLMENTS')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/payment 1 of 4/)).toBeVisible();
  await expect(page.getByText(/could not be read/)).toHaveCount(0);
});
