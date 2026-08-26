import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7e.3 [C5 / M2-9] — **the two zero states that rendered the same sentence.**
 *
 * Onboarding takes one debt **OR** one bill, and `PlanState` has a `'no-debts'` member with no `'no-bills'`
 * counterpart. So a debt-first user who never entered rent was shown *"You're caught up for this paycheck."*
 * in success green. ⚡ R3: **"that is worse than the absence of a prompt — it actively affirms them for a
 * paycheck they have not told the app about."** Their first Guardian read is computed as if rent does not
 * exist, and free deploys undampened, so it is also the most over-confident number they will ever see.
 *
 * ⚠️ `scenario()` seeds a bill by default — deliberately, since 25 of 39 specs once drove an app whose whole
 * bills half was in its empty branch. So the no-bills case has to be asked for **explicitly**, which is
 * exactly why nothing had ever driven it.
 */
test.use({ viewport: { width: 402, height: 874 } });

const NO_BILLS = () => scenario({ requiredExpenses: [], prefs: { onboardingComplete: true, guardianIntroSeen: true } });

/**
 * ⛔ **THE DEBT-FIRST USER — and the finding's stated harm was WRONG about them.**
 *
 * R3 said this user is shown *"You're caught up for this paycheck"* in success green. **Measured: they are
 * not.** `minimum_debt` is a REQUIRED category, so their debt's minimum is a row, `outstanding > 0`, and no
 * zero-branch renders at all. The observation (there is no no-bills branch) survives; the explanation does
 * not — the standing result of this whole audit, landing again.
 *
 * So their real harm is the **absence of a prompt**: nothing on Today ever asks for rent, and every number
 * they see is computed without it.
 */
test('a debt-first user with no bills is PROMPTED for them', async ({ page }) => {
  await seedStore(page, NO_BILLS());
  await page.goto('/');

  // Both-branches marker: the card itself is up before anything is asserted present or absent.
  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText('Add your bills', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add a bill' }).first()).toBeVisible();
});

/**
 * The zero-state half: nothing due at all AND no bills configured. Rarer than the finding claimed, but it
 * is the case where the app genuinely does make a false statement about money.
 */
test('with nothing due and no bills, the app does not claim they are caught up', async ({ page }) => {
  await seedStore(page, scenario({ requiredExpenses: [], debts: [], prefs: { onboardingComplete: true, guardianIntroSeen: true } }));
  await page.goto('/');

  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByTestId('required-no-bills')).toBeVisible();
  // ⛔ The false affirmation, asserted gone. This is the finding's surviving half.
  await expect(page.getByText('caught up for this paycheck', { exact: false })).toHaveCount(0);
});

/**
 * ⛔ And the honest "caught up" case must SURVIVE. A fix that simply deleted the green line would pass the
 * assertion above while removing a true, reassuring statement from every user who has bills and paid them.
 */
test('a user WITH bills, all handled, is still told they are caught up', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      // ⚠️ `debts: []` too. A debt's minimum is a REQUIRED row (`minimum_debt`), so leaving the default
      // debt in place keeps `outstanding > 0` and neither zero-branch renders — which is exactly the
      // measurement that showed the finding's stated harm was wrong.
      debts: [],
      // A bill that exists but falls outside this cycle → nothing outstanding, yet the plan HAS bills.
      requiredExpenses: [
        { id: 'e9', name: 'Rent', amount: 350, dueDate: '2027-01-01', recurrence: 'monthly', category: 'housing' },
      ],
      prefs: { onboardingComplete: true, guardianIntroSeen: true },
    }),
  );
  await page.goto('/');

  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('caught up for this paycheck', { exact: false })).toBeVisible();
  await expect(page.getByTestId('required-no-bills')).toHaveCount(0);
});

/**
 * ⚠️ `rows.length === 0` is NOT the signal, and this is the case that proves it: bills exist, none is due
 * this cycle. That user genuinely IS caught up, and telling them they have added no bills would be a new
 * false statement replacing the old one. Covered by the test above — this one pins the store shape it rests
 * on, so a future refactor to `rows`-based detection fails here rather than in front of a user.
 */
test('the no-bills branch keys off the PLAN, not this cycle’s rows', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [
        { id: 'e9', name: 'Rent', amount: 350, dueDate: '2027-01-01', recurrence: 'monthly', category: 'housing' },
      ],
      prefs: { onboardingComplete: true, guardianIntroSeen: true },
    }),
  );
  await page.goto('/');

  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });
  // No row for this cycle…
  await expect(page.getByText('Rent', { exact: true })).toHaveCount(0);
  // …and still not the no-bills state.
  await expect(page.getByTestId('required-no-bills')).toHaveCount(0);
});

/**
 * ⛔ **S1.5.2 [B5] — THE SHORTFALL HALF, WHICH THIS SUITE COULD NOT REACH.**
 *
 * Every store above has `allocation.shortfall === 0`. That is not a gap in taste, it is the gap that
 * mattered: `selectRecoveryPlan` returns `null` at zero shortfall, so `index.tsx`'s
 * `unfunded={recovery ? [] : …}` branch was **never once taken by the suite written for this exact
 * sentence**. A four-test suite aimed at *"You're caught up for this paycheck"* stayed green while a
 * premium user in a $200 shortfall read it in success green over two unpaid bills.
 *
 * ⚠️ `scenario()` already defaults to `subscriptionPlan: 'premium'`, so the tier was never the missing
 * ingredient — the STATE was. The fixtures below are the members of the class that fail.
 */

/**
 * The auditor's measured case. Rent is marked paid and consumed the whole paycheck, so Electric and Phone
 * get no allocation row at all — they exist ONLY in `unfundedRequiredItems`, which the premium branch used
 * to empty. `rows` is `[Pay Rent (handled)]`, so `rows.filter(unhandled).length` is 0 too, and the zero
 * state fired with nothing left to contradict it.
 */
const SHORTFALL = (over: Record<string, unknown> = {}) =>
  scenario({
    paycheck: { amount: '1000' },
    debts: [],
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 1000, dueDate: '2026-07-01', recurrence: 'monthly', category: 'housing', isPaidThisCycle: true },
      { id: 'elec', name: 'Electric', amount: 120, dueDate: '2026-07-01', recurrence: 'monthly', category: 'utilities' },
      { id: 'phone', name: 'Phone', amount: 80, dueDate: '2026-07-01', recurrence: 'monthly', category: 'utilities' },
    ],
    prefs: { onboardingComplete: true, guardianIntroSeen: true },
    ...over,
  });

test('PREMIUM in a shortfall is NOT told they are caught up', async ({ page }) => {
  await seedStore(page, SHORTFALL());
  await page.goto('/');

  // Both-branches marker: the card is up before anything is asserted absent.
  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });

  // ⛔ The blocker, asserted gone.
  await expect(page.getByText('caught up for this paycheck', { exact: false })).toHaveCount(0);
  // ⛔ And asserted gone for the RIGHT reason — the two unpaid bills are counted, not merely un-affirmed.
  // (`assert the honest state by name`: suppressing a false sentence can leave a different false state.)
  await expect(page.getByTestId('required-outstanding-count')).toHaveText('2');
});

/**
 * ⛔ The FREE control, and it is the direction the fix's justification runs in: free was always correct,
 * because `recovery` is `isPremium ? … : null` so its unfunded array was never emptied. If this test and
 * the one above ever disagree again, the tier is deciding what the user owes.
 */
test('FREE in the identical shortfall behaves the same — the tier does not change what is owed', async ({ page }) => {
  await seedStore(page, SHORTFALL({ subscriptionPlan: 'free' }));
  await page.goto('/');

  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('caught up for this paycheck', { exact: false })).toHaveCount(0);
  await expect(page.getByTestId('required-outstanding-count')).toHaveText('2');
});

/**
 * ⛔ **The preserved property MF.6 was built for.** The fix must not re-create the competing plan of
 * action: with the premium Recovery Plan on screen, this card states the obligations without telling the
 * user what to do about them. A fix that simply deleted `shortfallAdviceOwnedElsewhere` would pass both
 * tests above and undo an earlier audit's finding.
 */
test('MF.6 preserved — premium gets the obligations WITHOUT a competing plan of action', async ({ page }) => {
  await seedStore(page, SHORTFALL());
  await page.goto('/');

  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });
  // The obligations are on screen and named…
  await expect(page.getByTestId('required-unfunded-note')).toBeVisible();
  await expect(page.getByText('Pay Electric', { exact: false }).first()).toBeVisible();
  // …and the advice belongs to the Recovery Plan, not to this card.
  await expect(page.getByText(/cover these from savings or your next paycheck/)).toHaveCount(0);
  await expect(page.getByTestId('required-unfunded-note')).toContainText('recovery plan below');
});

/**
 * ⛔ **The double-count, which is the same expression read the other way.** `$1,000` against
 * `Rent $900 · Electric $300 · Phone $80 · Water $60 · Visa min $50`: Rent funds, Electric funds $100 of
 * $300, the rest fund nothing. That is **five** obligations — but Electric produces TWO list entries
 * (`Pay Electric (partial)` in `allocations`, `Finish Electric` in `unfundedRequiredItems`), so
 * `rows.length + unfunded.length` read **6**.
 *
 * ⛔ **WATER IS NOT SPARE — IT IS WHAT MAKES THE FIXTURE ABLE TO FAIL.** With only ONE fully-unfunded
 * bill the two error modes CANCEL: strip `targetId` off the engine's unfunded items and every expense
 * remainder collapses to the same `e:undefined` key, so `Finish Electric` merging with Phone (wrong)
 * exactly offsets `Finish Electric` no longer merging with its own row (also wrong) — measured, and both
 * spellings return 4. A second fully-unfunded bill separates them: 5 with the id, 4 without.
 *
 * ⚠️ Free deliberately, so this is a pure count assertion with the emptied-array bug out of the picture —
 * it fails on the arithmetic alone.
 */
test('the count is of OBLIGATIONS — a partially-funded bill is not counted twice', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      subscriptionPlan: 'free',
      paycheck: { amount: '1000' },
      debts: [{ id: 'visa', name: 'Visa', balance: 5000, minimumPayment: 50, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }],
      requiredExpenses: [
        { id: 'rent', name: 'Rent', amount: 900, dueDate: '2026-07-01', recurrence: 'monthly', category: 'housing' },
        { id: 'elec', name: 'Electric', amount: 300, dueDate: '2026-07-01', recurrence: 'monthly', category: 'utilities' },
        { id: 'phone', name: 'Phone', amount: 80, dueDate: '2026-07-01', recurrence: 'monthly', category: 'utilities' },
        { id: 'water', name: 'Water', amount: 60, dueDate: '2026-07-01', recurrence: 'monthly', category: 'utilities' },
      ],
      prefs: { onboardingComplete: true, guardianIntroSeen: true },
    }),
  );
  await page.goto('/');

  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });
  // Rent · Electric · Phone · Water · the Visa minimum. Five obligations, six list entries.
  await expect(page.getByTestId('required-outstanding-count')).toHaveText('5');
});
