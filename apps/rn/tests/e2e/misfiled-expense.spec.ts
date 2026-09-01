import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * 3.7.A10.2 [D22b/c] — the recovery path, for a mistake that has ALREADY been made.
 *
 * A10.1's chooser only helps someone who has not filed anything yet. This is the half that reaches
 * backward — and it is the half that matters most, because v1.6's app offered "Credit Card Payment" and
 * "Loan Payment" as one-tap BILL presets, so migrating users arrive already mis-filed.
 *
 * The assertions are on the STORE, not the screen: the defect is that a mis-filed obligation is missing
 * from `debts`, and only `debts` reaches the payoff plan.
 */
test.use({ viewport: { width: 402, height: 874 } });

const MORTGAGE = { id: 'e-mortgage', name: 'Mortgage', amount: 1600, dueDate: day(1), recurrence: 'monthly', category: 'housing' };
const RENT = { id: 'e-rent', name: 'Rent', amount: 1600, dueDate: day(1), recurrence: 'monthly', category: 'housing' };

const seeded = (expenses: unknown[]) => scenario({ requiredExpenses: expenses, prefs: { onboardingComplete: true } });

async function openExpenses(page: import('@playwright/test').Page) {
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();
}

test('a mis-filed mortgage is offered a way out — and rent beside it is not accused', async ({ page }) => {
  // Both are housing, monthly, and $1,600. The ONLY thing separating them is the name, which is exactly
  // the claim the detector makes — so they are tested together or the precision claim is untested.
  await seedStore(page, seeded([MORTGAGE, RENT]));
  await openExpenses(page);

  await expect(page.getByTestId('misfiled-convert-e-mortgage')).toBeVisible();
  await expect(page.getByTestId('misfiled-convert-e-rent')).toHaveCount(0);
});

test('"Move to Debts" converts it in ONE write — the expense is gone and the debt exists', async ({ page }) => {
  await seedStore(page, seeded([MORTGAGE]));
  await openExpenses(page);
  await page.getByTestId('misfiled-convert-e-mortgage').click();

  // It lands in Debts, on the form, prefilled with everything the expense already knew.
  await expect(page.getByText('APR %')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByPlaceholder('Visa, Car Loan')).toHaveValue('Mortgage');
  await expect(page.getByPlaceholder('e.g. 65')).toHaveValue('1600');

  // ⛔ AND IT DOES NOT CLAIM A SCAN HAPPENED. This test covered the conversion's DATA and never its
  // WORDS, which is how the sheet shipped headed "Add from scan" / "Review the scanned details, then
  // add." on a path where nothing was scanned — `DebtSheet` keyed that copy on `prefill`, and A10 made
  // this a second producer of it. The negative assertion is the load-bearing half: the positive one
  // would still pass if the scan copy came back alongside it.
  await expect(page.getByText('Add from scan')).toHaveCount(0);
  await expect(page.getByText('Review the scanned details, then add.')).toHaveCount(0);
  await expect(page.getByText(/Moving this from Expenses/)).toBeVisible();

  // The two fields an expense cannot carry — and the reason this is a form, not a silent re-file.
  await page.getByPlaceholder('e.g. 2400').fill('240000');
  await page.getByPlaceholder('e.g. 22.99').fill('6.5');
  await page.getByText('Add debt', { exact: true }).click();

  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const s = JSON.parse(raw ?? '{}');
      return {
        debts: (s.debts ?? []).map((d: { name: string; balance: number }) => `${d.name}:${d.balance}`),
        expenses: (s.requiredExpenses ?? []).map((e: { name: string }) => e.name),
      };
    }, { timeout: 10_000 })
    // The money moved exactly once. Reserved as an expense AND projected as a debt would be worse than
    // the mistake being corrected.
    .toEqual({ debts: ['Card:5000', 'Mortgage:240000'], expenses: [] });
});

test('"Not a debt" is remembered — a suggestion that cannot be silenced is an accusation', async ({ page }) => {
  await seedStore(page, seeded([MORTGAGE]));
  await openExpenses(page);
  await page.getByTestId('misfiled-dismiss-e-mortgage').click();
  await expect(page.getByTestId('misfiled-convert-e-mortgage')).toHaveCount(0);

  // And it survives a relaunch — asserted through the PERSISTED pref, because the in-memory state would
  // hide a write that never reached storage.
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      return JSON.parse(raw ?? '{}').prefs?.notDebtExpenseIds ?? [];
    }, { timeout: 10_000 })
    .toEqual(['e-mortgage']);
});

/**
 * ⛔ **S1.5.3 [B4] — THE FLAG THAT OUTLIVED ITS FLOW.**
 *
 * `convertingExpenseId` was a `useState` in `money.tsx` set by the conversion effect and cleared by
 * NOTHING — `grep -n setConverting` returned exactly one line, the setter. It was handed to every
 * subsequent `DebtSheet` in the Debts section, and `DebtSheet:213` routes to `convertExpenseToDebt`
 * whenever it is present, which unconditionally deletes that expense.
 *
 * So: tap "Move to Debts", change your mind, close the form, then add any ordinary debt without leaving
 * the section — and the bill you backed out of converting is deleted. No confirmation, no message, no
 * undo, and the per-paycheck reserve silently drops by its amount.
 *
 * ⚠️ The window is ordinary, not exotic: "Move to Debts" NAVIGATES the user to the Debts section, and
 * the Add row sits in that list's footer.
 */
test('B4 · backing out of a conversion does not arm the next debt to delete that bill', async ({ page }) => {
  await seedStore(page, seeded([MORTGAGE, RENT]));
  await openExpenses(page);

  // 1 · arm it — start the conversion, which lands us in Debts on the prefilled form.
  await page.getByTestId('misfiled-convert-e-mortgage').click();
  await expect(page.getByText(/Moving this from Expenses/)).toBeVisible({ timeout: 10_000 });

  // 2 · change your mind. Nothing was typed, so this closes without the dirty-guard.
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText(/Moving this from Expenses/)).toHaveCount(0);

  // 3 · add an ORDINARY debt, without leaving the Debts section.
  await page.getByTestId('money-add').click();
  await page.getByTestId('add-choice-debt').click();
  await expect(page.getByText('APR %')).toBeVisible({ timeout: 10_000 });
  // ⛔ And this sheet must not be wearing the conversion's clothes either — the copy is keyed on the
  // same flag, so it is a second, cheaper witness to the same state.
  await expect(page.getByText(/Moving this from Expenses/)).toHaveCount(0);

  await page.getByPlaceholder('Visa, Car Loan').fill('New Visa');
  await page.getByPlaceholder('e.g. 2400').fill('900');
  await page.getByPlaceholder('e.g. 65').fill('40');
  await page.getByPlaceholder('e.g. 22.99').fill('19.9');
  await page.getByText('Add debt', { exact: true }).click();

  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const s = JSON.parse(raw ?? '{}');
      return {
        debts: (s.debts ?? []).map((d: { name: string }) => d.name).sort(),
        expenses: (s.requiredExpenses ?? []).map((e: { name: string }) => e.name).sort(),
      };
    }, { timeout: 10_000 })
    // ⛔ BOTH bills still there. Asserted positively rather than as "Mortgage is present": the defect
    // deletes exactly one, so a fixture with one bill cannot tell deletion from a fixture that never
    // had it, and naming both states what the plan should look like instead of what it should not.
    .toEqual({ debts: ['Card', 'New Visa'], expenses: ['Mortgage', 'Rent'] });
});

/**
 * ⛔ **The same flag's SECOND consequence — the debt is stored wrong.** `convertExpenseToDebt` was a
 * reduced copy of `addDebt` that skipped `normalizeBnplInstallment`, and its comment said why: *"a
 * conversion never arrives in that shape."* Measured false twice over — the misroute sent plain adds
 * down it, AND `DebtSheet`'s type picker is on screen during a real conversion.
 *
 * A BNPL's balance is DERIVED (installment × payments remaining), so an un-normalised one stores as
 * **$0** — which drops it out of `view.order` and files it under PAID OFF on the screen the user just
 * added it from.
 */
test('B4 · a BNPL added right after a backed-out conversion still derives its balance', async ({ page }) => {
  await seedStore(page, seeded([MORTGAGE]));
  await openExpenses(page);

  await page.getByTestId('misfiled-convert-e-mortgage').click();
  await expect(page.getByText(/Moving this from Expenses/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByTestId('money-add').click();
  await page.getByTestId('add-choice-debt').click();
  await expect(page.getByText('APR %')).toBeVisible({ timeout: 10_000 });

  // The Type select: open it, then pick BNPL. Its trigger's accessible name is the current option.
  await page.getByRole('button', { name: 'Debt / loan' }).click();
  await page.getByText('BNPL (buy now, pay later)').click();
  await page.getByPlaceholder('Affirm — Sofa').fill('Affirm Sofa');
  await page.getByPlaceholder('e.g. 100').fill('50');
  await page.getByPlaceholder('e.g. 4').fill('4');
  await page.getByText('Add debt', { exact: true }).click();

  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const s = JSON.parse(raw ?? '{}');
      const d = (s.debts ?? []).find((x: { name: string }) => x.name === 'Affirm Sofa');
      return { balance: d?.balance ?? null, expenses: (s.requiredExpenses ?? []).map((e: { name: string }) => e.name) };
    }, { timeout: 10_000 })
    // 50 × 4, and the Mortgage untouched.
    .toEqual({ balance: 200, expenses: ['Mortgage'] });
});

/**
 * ⛔ **B4's third consequence — the prefill that was silently discarded.** `money.tsx` prefills
 * `recurrence` from the expense, and `DebtSheet` seeded that one field from `editing?.recurrence ??
 * 'monthly'` while `name`, `minimumPayment` and `dueDate` all honoured the prefill. `editing` is `null`
 * on a conversion, so converting a QUARTERLY bill filed its amount as a MONTHLY minimum — a four-fold
 * overstatement of what that obligation costs per month, inside the plan's debt-free date.
 */
test('B4 · converting a QUARTERLY bill keeps its cadence, it does not become monthly', async ({ page }) => {
  await seedStore(
    page,
    // ⚠️ The name must be one `looksLikeDebt` flags, or there is no convert affordance to tap at all —
    // "Insurance" was tried first and the row simply had no button. A quarterly LOAN is the realistic
    // member of the class: an obligation whose cadence is not monthly and which belongs in Debts.
    seeded([{ id: 'e-loan', name: 'Equipment Loan', amount: 600, dueDate: day(1), recurrence: 'quarterly', category: 'other' }]),
  );
  await openExpenses(page);
  await page.getByTestId('misfiled-convert-e-loan').click();
  await expect(page.getByText(/Moving this from Expenses/)).toBeVisible({ timeout: 10_000 });

  // The prefill is honoured across the board, not on three fields out of four.
  await expect(page.getByPlaceholder('Visa, Car Loan')).toHaveValue('Equipment Loan');
  await expect(page.getByPlaceholder('e.g. 65')).toHaveValue('600');
  // The Recurrence select's trigger carries the current option as its accessible name.
  await expect(page.getByRole('button', { name: 'Quarterly' })).toBeVisible();
});

/**
 * ⛔ **S1.13.7.8 [pass-6 blocker `C2-3`] — THE BILL'S AUTOPAY SETTING SURVIVES THE MOVE.**
 *
 * A bill on autopay converted to a debt with `isAutopay: false`. From the next cycle on
 * `isAutopayPresumedPaid` no longer suppresses it — it requires `isAutopay === true` — so the payday
 * check-in asks the user to pay, and the required-actions list shows as outstanding, **money their bank
 * has already taken.** The sheet HAS an Autopay switch; it was seeded `false` from a bill that had it on,
 * and nothing on the screen said the setting had been dropped.
 *
 * ⚡ **This test exists because the unit test could not see the defect.** `debtPrefill.test.ts` proves
 * the producer and the sheet's seeding; measured, it stays **fully green** with `money.tsx` reverted to
 * its four-field literal, because nothing in it asserts that the convert path CALLS the producer. That
 * is `tested-helper-is-not-a-used-helper` exactly — the helper existed, was correct and was tested while
 * the defect shipped. This pins the user-facing path.
 *
 * ⚠️ The cadence is asserted in the same run, on the same debt, deliberately: `recurrence` is the field
 * `S1.5.3 [B4]` lost at these same two hops, and a fix that carries one field and drops the other is the
 * whole shape of this round.
 */
test('C2-3 · converting a bill on AUTOPAY keeps its autopay — the app does not ask for money the bank took', async ({ page }) => {
  await seedStore(
    page,
    seeded([
      {
        id: 'e-loan',
        name: 'Equipment Loan',
        amount: 600,
        dueDate: day(1),
        recurrence: 'quarterly',
        category: 'other',
        isAutopay: true,
      },
    ]),
  );
  await openExpenses(page);
  await page.getByTestId('misfiled-convert-e-loan').click();
  await expect(page.getByText(/Moving this from Expenses/)).toBeVisible({ timeout: 10_000 });

  // ⛔ The switch is the disclosure: a user looking at this screen must see autopay ON, because that is
  // what their bill said. Seeded `false`, the screen was quietly asserting the opposite.
  await expect(page.getByRole('switch', { name: 'Autopay' })).toBeChecked();

  await page.getByPlaceholder('e.g. 2400').fill('4800');
  await page.getByPlaceholder('e.g. 22.99').fill('9.9');
  await page.getByText('Add debt', { exact: true }).click();

  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const s = JSON.parse(raw ?? '{}');
      const debt = (s.debts ?? []).find((d: { name: string }) => d.name === 'Equipment Loan');
      return { isAutopay: debt?.isAutopay, recurrence: debt?.recurrence, expenses: (s.requiredExpenses ?? []).length };
    }, { timeout: 10_000 })
    .toEqual({ isAutopay: true, recurrence: 'quarterly', expenses: 0 });
});

/**
 * ⛔ **S1.5.3 — CONVERTING A BILL INTO A BNPL DOUBLE-COUNTED IT. Found by a plant that did NOT red.**
 *
 * `DebtSheet.submit()`'s BNPL branch ended `else addDebt(…)` and **never consulted
 * `convertingExpenseId`**, so a conversion whose type the user switched to BNPL ADDED the debt and LEFT
 * the expense. Measured on the real app: a $1,600 Mortgage ended as
 * `debts: ["Mortgage:1600"]` **and** `requiredExpenses: ["Mortgage"]` — the same money reserved from
 * every paycheck as a bill *and* projected as a debt, permanently, with no message.
 *
 * ⚡ That is verbatim the window the non-BNPL branch's own comment says the one-write design exists to
 * prevent (*"two writes leave a window where the same money is reserved as an expense and projected as a
 * debt at the same time"*). One branch carried the guard; its neighbour never did.
 *
 * ⚠️ **How it surfaced is the point.** A plant restoring [B4]'s leaking flag failed to red the BNPL test
 * it should have — because this path never reads that flag. *A plant that fails to red is evidence about
 * the code, not only about the test.* Both branches now route through one `commit()`.
 */
test('B4 · converting a bill INTO a BNPL is still ONE write — not an add beside a surviving bill', async ({ page }) => {
  await seedStore(page, seeded([MORTGAGE]));
  await openExpenses(page);
  await page.getByTestId('misfiled-convert-e-mortgage').click();
  await expect(page.getByText(/Moving this from Expenses/)).toBeVisible({ timeout: 10_000 });

  // Stay ON the conversion and switch its type — a mis-filed "Mortgage" the user knows is really a
  // finance plan is exactly who does this.
  await page.getByRole('button', { name: 'Debt / loan' }).click();
  await page.getByText('BNPL (buy now, pay later)').click();
  await page.getByPlaceholder('e.g. 100').fill('400');
  await page.getByPlaceholder('e.g. 4').fill('4');
  await page.getByText('Add debt', { exact: true }).click();

  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const s = JSON.parse(raw ?? '{}');
      return {
        debts: (s.debts ?? []).map((d: { name: string; balance: number }) => `${d.name}:${d.balance}`),
        expenses: (s.requiredExpenses ?? []).map((e: { name: string }) => e.name),
      };
    }, { timeout: 10_000 })
    // 400 × 4 as a debt, and the bill GONE — the money is counted once. ⛔ The `expenses: []` half is the
    // load-bearing one: the debt appearing is what already worked.
    .toEqual({ debts: ['Card:5000', 'Mortgage:1600'], expenses: [] });
});
