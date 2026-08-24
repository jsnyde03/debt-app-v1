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
