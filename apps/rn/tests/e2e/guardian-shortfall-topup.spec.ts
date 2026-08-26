import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * [S1 · pass 1 · M3] The Payday Guardian card drew a calm good-standing shield over a shortfall, with the
 * amount short suppressed, whenever a top-up was on record for the cycle.
 *
 * `buildGuardianBrief` derived the band from `computeState(discretionary, …)` on the recorded premise
 * that *"a shortfall drives `discretionary` to 0 → at-risk, so it needs no separate branch here."*
 * `selectDiscretionary` is 0 on any shortfall — but the seam passes
 * `selectDiscretionary(allocation) + appliedTopUp(store)`, and the top-up term is not.
 *
 * ⛔ **THIS FILE EXISTS BECAUSE THE SELECTOR TEST CANNOT PIN IT.** The copy branch sets `detail` from
 * `shortfall > 0` regardless of the band, so the sentence is present on the brief either way — measured
 * under the plant: `state: 'clear'` with `detail` still the shortfall sentence. What the defect changed is
 * whether `PaydayGuardianCard` RENDERS it, and its gate (`stale || pausedDeploy || state === 'at-risk'`)
 * has never had a test of any kind.
 *
 * ⚠️ `selectTightTopUp` refuses to OFFER a top-up while `shortfall > 0`, so this state is reached by going
 * short AFTER the move — an ordinary sequence, not an exotic one.
 */
test.use({ viewport: { width: 402, height: 874 } });

const GOAL = { id: 'g-vac', name: 'Vacation', targetAmount: 3000, currentAmount: 1000, type: 'savings' };

/** $2,000 in, $2,400 of bills due → $400 short, with $200 already moved from the goal this cycle. */
const shortStore = (withTopUp: boolean) =>
  scenario({
    subscriptionPlan: 'premium',
    paycheck: { amount: '2000', nextPaycheckDate: day(10) },
    debts: [],
    requiredExpenses: [
      { id: 'e-rent', name: 'Rent', amount: 2000, dueDate: day(3), recurrence: 'monthly', category: 'housing' },
      { id: 'e-surprise', name: 'Vet bill', amount: 400, dueDate: day(4), recurrence: 'one-time', category: 'other' },
    ],
    goals: [GOAL],
    ...(withTopUp
      ? {
          // Keyed to `nextPaycheckDate`, exactly as `applyTightTopUp` writes it — `appliedTopUp` returns 0
          // for any other `forCycle`, so a record keyed to the wrong day would silently test nothing.
          cycleTopUp: { forCycle: day(10), amount: 200, entries: [{ source: 'guardian', goalId: 'g-vac', amount: 200 }] },
        }
      : {}),
  });

test('a shortfall states its amount on the card even with a top-up on record', async ({ page }) => {
  await seedStore(page, shortStore(true));
  await page.goto('/');

  const card = page.getByTestId('payday-guardian-card');
  await expect(card).toBeVisible({ timeout: 10_000 });

  // ⛔ THE GUARDIAN'S OWN SENTENCE, not "the card mentions a figure somewhere". Measured under the plant:
  // the defective card still contained `$400` — the `RecoveryPlanSection` prints *"cover the $400 gap
  // from savings"* — so a bare `/\$400/` assertion PASSED with the defect present. That surviving figure
  // is exactly why this finding is a major and not a blocker, and it is also what makes the loose
  // assertion vacuous. `brief.detail` is the only place the Guardian states it in its own voice.
  //
  // ⛔ **S1.9.3 [pass-2 A1] — $200, WHICH IS THE RESIDUAL, and the change is deliberate.** M3's protection
  // is what this test exists for and it is intact: the band is still `at-risk` and the sentence is still
  // RENDERED. What moved is the figure inside it. The user is $400 short and has already moved $200 into
  // checking, so $400 over-states the gap by money they have already provided — the top-up is applied to
  // the shortfall before the shortfall is reported.
  //
  // ⚡ **The pair below now DISCRIMINATES, which it did not before.** Both rows used to assert `$400`, so
  // the recorded top-up — the only variable between them — made no difference to any asserted value.
  await expect(card).toContainText(/about \$200 short/);
  // …and never the pre-netting figure, which is the false statement the residual replaces.
  await expect(card).not.toContainText(/about \$400 short/);
});

test('the control — the same store with no top-up on record already behaved', async ({ page }) => {
  // Without this row the test above cannot distinguish "the fix works" from "this store was never the
  // defect's shape". The recorded top-up is the ONLY difference between the two.
  // ⚠️ S1.9.3 [A1] — and it is now the row that pins the UN-netted figure: nothing has been moved here, so
  // the residual IS the whole $400. If the netting ever ran on a cycle with no top-up, this reds.
  await seedStore(page, shortStore(false));
  await page.goto('/');

  const card = page.getByTestId('payday-guardian-card');
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card).toContainText(/about \$400 short/);
});

test('a COVERED cycle with a top-up keeps its calm read — the fix moves one branch, not the card', async ({ page }) => {
  // The other direction. `state = "at-risk"` unconditionally would pass both tests above; only this one
  // reds it, and without it the fix's scope claim is unfalsifiable.
  await seedStore(
    page,
    scenario({
      subscriptionPlan: 'premium',
      paycheck: { amount: '2000', nextPaycheckDate: day(10) },
      debts: [{ id: 'd0', name: 'Card', balance: 5000, minimumPayment: 100, apr: 20, dueDate: day(3), type: 'debt', recurrence: 'monthly' }],
      requiredExpenses: [{ id: 'e-rent', name: 'Rent', amount: 400, dueDate: day(3), recurrence: 'monthly', category: 'housing' }],
      goals: [GOAL],
      cycleTopUp: { forCycle: day(10), amount: 200, entries: [{ source: 'guardian', goalId: 'g-vac', amount: 200 }] },
    }),
  );
  await page.goto('/');

  const card = page.getByTestId('payday-guardian-card');
  await expect(card).toBeVisible({ timeout: 10_000 });
  // ⛔ The honest calm state BY NAME, because the absence assertion below cannot falsify anything on its
  // own: a clear cycle's `detail` is not the shortfall sentence, so `/short of the/` is missing whether
  // the band is right or forced. Measured at HEAD, this card reads "Your line's held" — that is the
  // string a "force at-risk" plant destroys. (Apostrophe left unmatched: the app renders a curly one.)
  await expect(card).toContainText(/Your line.s held/);
  await expect(card).not.toContainText(/short of the/);
});
