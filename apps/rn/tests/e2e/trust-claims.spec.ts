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

/**
 * ⛔ **S1.11.5.5 [pass-4 `C4-8`] — THE SINGULAR, WHICH IS THIS LINE'S FIRST RENDER FOR EVERY USER.**
 * The headline shows as soon as `paidDown > 0`, i.e. the first rollover in which anything was paid — so
 * *"paid down across **1 cycles**"* was what everybody met before they ever saw the plural.
 * ⚠️ The control above (two cycles) is what keeps this from being satisfied by a line that lost its count.
 */
test('C4-8 · the History headline says "1 cycle", not "1 cycles"', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [{ id: 'd0', name: 'Chase card', balance: 5000, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' }],
      cycleHistory: [{ cycleEndDate: day(-14), totalDebtBalance: 7800, totalPaidThisCycle: 200 }],
    }),
  );
  await page.goto('/history');
  await expect(page.getByText(/paid down across 1 cycle$/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1 cycles/)).toHaveCount(0);
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
  // ⚠️ S1.11.4.4 [C4-1] — the wording moved to `FIELD_LABEL`'s own words ("the scheduled payment"), the
  // same map Money's row caption reads. It was a hand-written "the payment amount", which was true only
  // while the filter asked about one field; naming the field that was actually lost is the whole point.
  await expect(page.getByText(/Affirm — the scheduled payment could not be read/)).toBeVisible();
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

// ── C4-7 · the in-app card the outer surfaces left behind ────────────────────────────────────────

/**
 * ⛔ **S1.11.4.2 [pass-4 blocker `C4-7`] — THE RENDER HALF.** `requiredPlanTrust.test.ts` walks every
 * surface that must refuse over an unread obligation and proves this mount ASKS its claim — `'paycheck-plan'`
 * since `.5.4d`; a passed prop is not a suppressed figure, so the screen itself is asserted here.
 *
 * ⚡ **The store is one variable from its own control.** The debt's `minimumPayment` is a value the
 * reader cannot parse — `migrations.ts` repairs it to `$0` and records the loss — so the obligation
 * leaves the plan entirely and the card computed a spare that is the whole missing minimum too large.
 * ⛔ `D3-2` had already closed this sentence on the Lock Screen and in Siri, which on this very store
 * refuse to say anything, while Today went on saying it.
 */
test('C4-7 · the Payday Guardian card states nothing over a minimum the app could not read', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 'n/a', apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/');
  await expect(page.getByTestId('payday-guardian-card')).toBeVisible({ timeout: 15_000 });
  // ⛔ THE HONEST STATE BY NAME, FIRST. A card that merely dropped its figures would satisfy every
  // absence assertion below while telling the user nothing about why the read is missing — and an
  // absence assertion is also satisfied by a page that never rendered, which the visibility check above
  // and this positive one together rule out.
  await expect(page.getByTestId('guardian-unread-inputs')).toBeVisible();
  await expect(page.getByText('One amount is missing')).toBeVisible();
  // ⚠️ Scoped to the CARD, not to the page. An unscoped `getByText(/could not be read/)` was a strict-mode
  // violation the moment the fix landed — three honest banners say it on this screen at once, and the
  // required-actions one below says the very same sentence. A page-wide locator for this wording proves
  // some card is honest, never that THIS one is.
  await expect(page.getByTestId('guardian-unread-inputs')).toContainText('could not be read');
  // ⭐ …and it still names the line the user set THEMSELVES, which the reader never lost. A card that
  // withheld even that would be indistinguishable from a broken one.
  await expect(page.getByTestId('guardian-unread-inputs')).toContainText('$200');
  // ⛔ THE VERDICT, which is the loudest claim on the card and the one the two outer surfaces suppress.
  await expect(page.getByText('Looks clear this paycheck')).toHaveCount(0);
  // ⛔ …and the figures. "To debt" is the stat label the invented spare renders under, and the safe-move
  // sentence is the app telling someone to go and spend it.
  await expect(page.getByText('To debt')).toHaveCount(0);
  await expect(page.getByText(/Apply the spare/)).toHaveCount(0);
});

test('C4-7 control · the same card with the minimum readable still states the whole read', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 1500, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/');
  await expect(page.getByTestId('payday-guardian-card')).toBeVisible({ timeout: 15_000 });
  // ⭐ THE CONTROL THAT MAKES THE ABSENCES ABOVE MEAN ANYTHING: one variable apart, the card speaks in
  // full. Without it, a card that had simply stopped rendering its read would pass the test above.
  await expect(page.getByText('Looks clear this paycheck')).toBeVisible();
  await expect(page.getByText('To debt')).toBeVisible();
  await expect(page.getByTestId('guardian-unread-inputs')).toHaveCount(0);
});

// ── .5.4d · the claims the Guardian card and the plan hero ask since the rewire ─────────────────────

/**
 * ⛔ **S1.13.7.12.6.5.4d [DECISION 🎯 2026-09-13] — THE GUARDIAN CARD OVER A GOAL TARGET THE APP COULD NOT READ.**
 *
 * The card asked `'required-plan'`, which never routed a goal. A priority goal funds BEFORE the snowball, so a target
 * repaired to `$0` reads as already funded, the goal leaves the allocation, and the spare it held reappears as money
 * to put toward debt. Measured on 22 plan shapes: the brief moves on every goal field. It asks `'paycheck-plan'` now.
 *
 * ⚠️ Planting the card back onto `'required-plan'` must turn this red — that plant, not this pass, is the proof.
 */
test('.5.4d · the Payday Guardian card states nothing over a goal target the app could not read', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 1500, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
      // `targetAmount: ''` is the one unreadable field, and it is a GOAL field — nothing an obligation reads.
      goals: [{ id: 'g0', name: 'Trip', targetAmount: '', currentAmount: 100, priorityPerPaycheck: 150, priority: true, type: 'savings' }],
    }),
  );
  await page.goto('/');
  await expect(page.getByTestId('payday-guardian-card')).toBeVisible({ timeout: 15_000 });
  // The honest state BY NAME first — scoped to the card, never page-wide.
  await expect(page.getByTestId('guardian-unread-inputs')).toBeVisible();
  await expect(
    page.getByTestId('guardian-unread-inputs'),
    'a goal target is not an amount this paycheck has to cover — the lead must say what is actually true',
  ).toContainText('An amount your plan is built from could not be read');
  await expect(page.getByText('Looks clear this paycheck')).toHaveCount(0);
  await expect(page.getByText('To debt')).toHaveCount(0);
});

/**
 * ⛔ **S1.13.7.12.6.5.4d [pass-7 `C1-5`] — THE PLAN HERO OVER AN APR THE APP COULD NOT READ.**
 *
 * The hero prints a debt-free DATE, which moves on a lost APR, and it asked `'required-plan'`, which never routed one.
 * It asks `'solved-projection'` now. ⛔ And `C1-5`: over an unread input it withheld its verdict while still drawing
 * the Required / Spoken-for / Flexible split — every segment carved from the allocation the unread figure corrupted.
 *
 * ⭐ Both directions: the control below is the same store with the rate readable, which still states the date and split.
 */
/**
 * ⛔ **[class 5 R2 `L3-4`] …and ONLY the date.** On snowball a lost APR moves no segment of the split and no part of the
 * verdict — measured on 22 plan shapes — so those ask `'paycheck-plan'` and stay. The date is withheld, and said so by name.
 * ⚠️ The split assertion comes FIRST: it is the finding's subject, and a throw-based runner proves nothing behind a red.
 */
test('.5.4d · the plan hero withholds its DATE over an APR the app could not read, and keeps its split', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      debts: [
        { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 150, apr: '', dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/');
  const hero = page.getByTestId('plan-hero');
  await expect(hero).toBeVisible({ timeout: 15_000 });
  await expect(hero.getByText('Flexible'), '⛔ L3-4 — the split reads no APR, so a lost one may not blank it').toBeVisible();
  await expect(hero, 'the honest state, by name').toContainText(/can.t give a debt-free date yet — set the interest rate on Visa again/);
  await expect(hero, 'a debt-free date solved from a rate the app could not read').not.toContainText('debt-free by');
  await expect(hero, 'the whole-plan refusal belongs to inputs the split reads').not.toContainText('An amount your plan is built from could not be read');
});

test('.5.4d control · the plan hero with the rate readable still states its date and its split', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      debts: [
        { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 150, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/');
  const hero = page.getByTestId('plan-hero');
  await expect(hero).toBeVisible({ timeout: 15_000 });
  await expect(hero).toContainText('debt-free by');
  await expect(hero.getByText('Flexible')).toBeVisible();
  await expect(hero).not.toContainText('could not be read');
});

/**
 * ⛔ **[class 5 R2 `L3-1a` blocker · `L3-1b` · `FX-2`] — THE SUGGESTED MOVE OVER A MINIMUM THE APP COULD NOT READ.**
 *
 * `C1-5` withheld the hero's split and its voice-over line and left the suggestion DRAWN: *"Suggested · $1,300"*, inflated by
 * exactly the lost $300 minimum, above the sentence refusing to say where the plan lands. `RecommendedActionsCard` drew the
 * same list with a "Mark Paid" control and asked no claim at all. ⭐ The control is the readable twin, at `$1,000`.
 */
const CAR_MINIMUM = (minimumPayment: number | string) =>
  scenario({
    debts: [
      { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 150, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      { id: 'd1', name: 'Car', balance: 9000, originalBalance: 12000, minimumPayment, apr: 6, dueDate: day(12), type: 'debt', recurrence: 'monthly' },
    ],
  });

test('class 5 R2 · the suggested move is withheld over a minimum the app could not read — the hero and the Recommended card', async ({ page }) => {
  await seedStore(page, CAR_MINIMUM(''));
  await page.goto('/');
  const hero = page.getByTestId('plan-hero');
  await expect(hero, 'the honest state, by name').toContainText('An amount your plan is built from could not be read', { timeout: 15_000 });
  await expect(page.getByTestId('recommended-unread-inputs'), '⛔ FX-2 — the card says why, naming the figure').toContainText('set the minimum payment on Car again');
  await expect(hero.getByText(/^Suggested ·/), '⛔ L3-1a — drawn over its own refusal, inflated by the lost minimum').toHaveCount(0);
  await expect(page.getByText('Suggested this paycheck'), '⛔ FX-2 — no suggested row survives on Today').toHaveCount(0);
});

test('class 5 R2 control · with the minimum readable both draw the suggested move', async ({ page }) => {
  await seedStore(page, CAR_MINIMUM(300));
  await page.goto('/');
  const hero = page.getByTestId('plan-hero');
  await expect(hero.getByText(/^Suggested · \$1,000 · /)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Suggested this paycheck').first()).toBeVisible();
  await expect(page.getByTestId('recommended-unread-inputs')).toHaveCount(0);
});

/**
 * ⛔ **[class 5 R2 `FX-1` · DECISION 🎯 2026-09-14] — ON AVALANCHE A LOST RATE RENAMES THE DEBT.** Avalanche ranks by APR, and
 * a repaired `0` sends a 22% Chase below an 18% Visa: the Guardian brief said *"apply the spare … toward Visa"* while
 * `'paycheck-plan'` said yes. `.5.4d`'s sweep never set a strategy, so it only ever measured snowball.
 */
const AVALANCHE = (chaseApr: number | string) =>
  scenario({
    payoffStrategy: 'avalanche',
    debts: [
      { id: 'd0', name: 'Chase', balance: 5000, originalBalance: 6000, minimumPayment: 150, apr: chaseApr, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      { id: 'd1', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
    ],
  });

test('class 5 R2 · FX-1 · on avalanche nothing names a debt ranked by a rate the app could not read', async ({ page }) => {
  await seedStore(page, AVALANCHE(''));
  await page.goto('/');
  await expect(page.getByTestId('guardian-unread-inputs'), 'the honest state, by name').toContainText('set the interest rate on Chase again', { timeout: 15_000 });
  await expect(page.getByTestId('recommended-unread-inputs')).toContainText('set the interest rate on Chase again');
  await expect(page.getByTestId('plan-hero').getByText('Flexible'), '⛔ L3-4 — the split reads no rate on either strategy, and stays').toBeVisible();
  await expect(page.getByText(/toward Visa/), '⛔ FX-1 — a lost 22% ranked Chase below an 18% Visa').toHaveCount(0);
  await expect(page.getByText(/Extra payment to Visa/)).toHaveCount(0);
});

test('class 5 R2 control · FX-1 · on avalanche with every rate readable the target is named', async ({ page }) => {
  await seedStore(page, AVALANCHE(22));
  await page.goto('/');
  await expect(page.getByText(/toward Chase/).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('guardian-unread-inputs')).toHaveCount(0);
  await expect(page.getByTestId('recommended-unread-inputs')).toHaveCount(0);
});

// ── C4-2 · the trophy shelf, and the heading Money put over the same row ─────────────────────────

/**
 * ⛔ **S1.11.4.2 [pass-4 blocker `C4-2`] — MEMBERSHIP, WHICH EVERY EXISTING GUARD LEFT OPEN.** A balance
 * the reader loses repairs to `0`, and `d.balance <= 0` is the one test that value passes. `C-4` guarded
 * the AMOUNT at both mount points; `originalBalance` had been read perfectly, so the figure printed.
 *
 * ⚡ Chase at $12,000 unreadable, beside an intact Amex, so the user is provably not debt-free. The unit
 * suite walks the producers; these two prove the SCREENS, which is where the sentence and the heading are.
 */
test('C4-2 · the trophy shelf does not file a debt the app could not read as paid off', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'c1', name: 'Chase', balance: 'twelve thousand', originalBalance: 12000, minimumPayment: 200, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
        { id: 'a1', name: 'Amex', balance: 4000, originalBalance: 6000, minimumPayment: 100, apr: 18, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/progress');
  // ⛔ The shelf renders `null` for an empty list, so the absence below could also mean "the page never
  // loaded". Anchor on something this screen always shows first.
  await expect(page.getByTestId('progress-hero-date')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/DEBTS PAID OFF/)).toHaveCount(0);
  await expect(page.getByText(/\$12,000 paid off/)).toHaveCount(0);
});

test('C4-2 · Money keeps the row and drops the PAID OFF heading over it', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'c1', name: 'Chase', balance: 'twelve thousand', originalBalance: 12000, minimumPayment: 200, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
        { id: 'a1', name: 'Amex', balance: 4000, originalBalance: 6000, minimumPayment: 100, apr: 18, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/money');
  await expect(page.getByRole('button', { name: /^Amex,/ })).toBeVisible({ timeout: 15_000 });
  // ⛔ THE ROW MUST STILL BE ON THE SCREEN. The finding's own stated remedy — apply the same exclusion
  // here — would have deleted it: it is not in `active` either, which is the "in neither list" failure
  // `migrations.ts:99` already records. This assertion is the reason the producer is a partition.
  await expect(page.getByRole('button', { name: /^Chase,/ })).toBeVisible();
  // …under an honest heading, and not under the false one.
  await expect(page.getByText('BALANCE UNREAD')).toBeVisible();
  await expect(page.getByText('PAID OFF')).toHaveCount(0);
});

test('C4-2 control · a genuinely cleared debt is still on the shelf, at its real figure', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'c1', name: 'Chase', balance: 0, originalBalance: 12000, minimumPayment: 200, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-3) },
        { id: 'a1', name: 'Amex', balance: 4000, originalBalance: 6000, minimumPayment: 100, apr: 18, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/progress');
  // ⭐ The half that stops this being a blanket suppression: the trophy the user actually earned.
  await expect(page.getByText(/DEBTS PAID OFF/)).toBeVisible({ timeout: 15_000 });
  // ⚠️ `.first()` because the tombstone says this TWICE by design — the visible caption carries the date
  // ("$12,000 paid off · Aug 2026") and the row's collapsed a11y label says it without one. Asserting an
  // unscoped match here is a strict-mode violation that only exists in the GREEN state, which is the
  // second one this sub-step produced: no plant can see it, because under a plant the text is absent.
  await expect(page.getByText(/\$12,000 paid off/).first()).toBeVisible();
});

// ── C4-1 · the installment COUNT, which is not a dollar figure and was gated nowhere ─────────────

/** A Klarna 4-pay with two installments already made, whose `originalBalance` the reader lost. */
const klarnaHalfPaid = (originalBalance: unknown) => ({
  id: 'k1', name: 'Klarna', balance: 200, originalBalance, minimumPayment: 100, apr: 0,
  dueDate: day(6), type: 'bnpl', recurrence: 'biweekly', bnplProvider: 'Klarna',
  scheduledPaymentAmount: 100, remainingPayments: 2,
});

/**
 * ⛔ **S1.11.4.4 [pass-4 blocker `C4-1`] — `B1`'s RULE, MISSING A FOURTH DIRECTION.** Pass 1→2 widened the
 * claim SITES, 2→3 the FIELDS, 3→4 the SURFACES — all three about dollar figures. The count is not a
 * dollar figure, and it is derived from `originalBalance`: `repairMoneyFields` drops the unreadable value
 * and `raiseOriginalBalance` stamps it from `balance` on the next line, so the total collapses to the
 * remaining count.
 */
test('C4-1 · the BNPL row does not state a count derived from a starting balance nobody read', async ({ page }) => {
  await seedStore(page, scenario({ requiredExpenses: [], debts: [klarnaHalfPaid('four hundred')] }));
  await page.goto('/money');
  const row = page.getByRole('button', { name: /^Klarna,/ });
  await expect(row).toBeVisible({ timeout: 15_000 });
  // ⛔ THE HONEST STATE FIRST — the row still says everything the app really did read.
  await expect(row).toHaveAccessibleName(/interest-free/);
  await expect(row).toHaveAccessibleName(/the starting balance could not be read/i);
  // ⛔ …and the false count by name. "0 of 2 paid" over a plan two payments into four.
  await expect(row).not.toHaveAccessibleName(/0 of 2 paid/);
  await expect(row).not.toHaveAccessibleName(/of 2 paid/);
  // ⛔ The calendar's ordinal is the same claim through the other door, and its caption must name the
  // field that was ACTUALLY lost — a plan dropped for a starting balance told the user to re-enter a
  // payment amount that was never missing.
  await expect(page.getByText(/payment 1 of 2/)).toHaveCount(0);
  await expect(page.getByText(/Klarna — the starting balance could not be read/)).toBeVisible();
});

test('C4-1 control · the same plan with a readable starting balance states 2 of 4', async ({ page }) => {
  await seedStore(page, scenario({ requiredExpenses: [], debts: [klarnaHalfPaid(400)] }));
  await page.goto('/money');
  const row = page.getByRole('button', { name: /^Klarna,/ });
  await expect(row).toBeVisible({ timeout: 15_000 });
  // ⭐ The half that stops this being a blanket suppression: the true count, which the app CAN read.
  await expect(row).toHaveAccessibleName(/2 of 4 paid/);
  await expect(row).not.toHaveAccessibleName(/could not be read/i);
  await expect(page.getByText(/payment 3 of 4/)).toBeVisible();
});
