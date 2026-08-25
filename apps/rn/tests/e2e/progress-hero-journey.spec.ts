import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * ⛔ **THE PROGRESS HERO TOLD A USER THEY OWED LESS THAN THEY DO.** [P6.8.9.7.11.12.10 · C-D]
 *
 * The subhead under the ring reads *"$X to go"* early on, and X was **`totalOriginal`** — the sum of each
 * debt's balance *when it was first entered*. `originalBalance` is stamped once at creation and **no edit
 * path updates it**, so a user who revises a balance upward — interest, new spending, the ordinary life of
 * revolving debt — is shown their old, smaller total under a label that means *remaining*.
 *
 * ⚡ **The clamp is what routes them into that branch.** `totalPaid = max(0, original − current)` is `0`
 * for a portfolio that has grown, and `0` selects the "to go" wording. So the understatement and the branch
 * that commits it have one cause.
 *
 * ⚠️ **Money contradicts it one tab away, on the same store** — its hero sums the current balances and says
 * *"remaining across N debts"*. Both halves are asserted here: a number is only wrong relative to the truth,
 * and this repo has shipped a figure that looked right until the screen beside it was read.
 *
 * ⚠️ **This spec pins the CALL, not the arithmetic.** `journeySelectors.test.ts` owns the matrix;
 * `.11.11` shipped a defect whose helper was already written, already correct and already tested, because
 * what was missing was the call.
 */
test.use({ viewport: { width: 402, height: 874 } });

/** Entered at $5,000, revised up to $5,400, and nothing paid yet — the shape C-D describes. */
const GROWN = () =>
  scenario({
    genuineCycleCount: 6,
    prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] },
    debts: [
      {
        id: 'd0',
        name: 'Card',
        balance: 5400,
        originalBalance: 5000,
        minimumPayment: 100,
        apr: 20,
        dueDate: '2026-07-01',
        type: 'debt',
        recurrence: 'monthly',
      },
    ],
  });

test('C-D — a portfolio that has grown is told what it owes now, not what it owed at entry', async ({ page }) => {
  await seedStore(page, GROWN());
  await page.goto('/progress');

  const journey = page.getByTestId('progress-hero-journey');
  // ⛔ The element first, and by testID. An absence assertion over "$5,000" is satisfied by a blank page,
  // and a text lookup for "$5,400" could match the debt row rather than the hero.
  await expect(journey).toBeVisible({ timeout: 15_000 });
  await expect(journey).toHaveText('$5,400 to go');
});

/**
 * The other half of the same claim: the two tabs now agree. Without this the fix could be "print any
 * bigger number" and the spec above would still pass.
 */
test('C-D — and Money, on the same store, states the same remaining total', async ({ page }) => {
  await seedStore(page, GROWN());
  await page.goto('/money');
  await expect(page.getByText('$5,400', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('remaining across 1 debt')).toBeVisible();
});

/**
 * ⚠️ **The case where the defect was invisible, kept as a guard.** A user who has paid nothing and revised
 * nothing has `original === current`, so the wrong figure and the right one are the same number — which is
 * the only shape anyone pictured, and why this shipped. A fix that broke it would be trading one wrong
 * sentence for another.
 */
test('a fresh portfolio still leads forward with its full balance', async ({ page }) => {
  await seedStore(page, scenario({ prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] } }));
  await page.goto('/progress');
  await expect(page.getByTestId('progress-hero-journey')).toHaveText('$5,000 to go', { timeout: 15_000 });
});

/**
 * ⛔ **THE SECOND HALF OF C-D, WHICH THE FINDING DID NOT NAME.** The hero's debt-free date is computed from
 * the PROJECTED balances (`withProjectedBalances`), and its "to go" figure read the stored anchors — one
 * line of one hero, two balance sets. Money's hero has projected since it was built (*"so the hero
 * reconciles with the rows"*), so Progress was the odd surface out.
 *
 * ⚠️ **Asserted as an EQUALITY between the two screens, not against a literal.** The projected figure is a
 * function of today's date and an APR, so a hardcoded amount would be a spec that expires; what the claim
 * actually is — *the two tabs state the same remaining total* — needs no constant at all.
 */
test('C-D — a premium estimate does not split the two heroes apart', async ({ page }) => {
  const STALE = scenario({
    genuineCycleCount: 6,
    prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] },
    debts: [
      {
        id: 'd0',
        name: 'Card',
        balance: 5000,
        originalBalance: 5000,
        minimumPayment: 100,
        apr: 24,
        dueDate: day(20),
        type: 'debt',
        recurrence: 'monthly',
        // Verified three months ago, so premium projection has something to project.
        balanceAsOfDate: day(-90),
        lastVerifiedDate: day(-90),
      },
    ],
  });

  await seedStore(page, STALE);
  await page.goto('/money');
  const moneyHero = page.getByTestId('money-hero-debts-value');
  await expect(moneyHero).toBeVisible({ timeout: 15_000 });
  const remaining = (await moneyHero.innerText()).trim();

  // ⛔ The projection has to have MOVED the number, or this test compares two copies of the anchor and
  // proves nothing — the vacuity guard, failing rather than passing.
  expect(remaining, 'the premium projection did not move the balance, so the two tabs cannot disagree here').not.toBe('$5,000');

  await page.goto('/progress');
  await expect(page.getByTestId('progress-hero-journey')).toHaveText(`${remaining} to go`, { timeout: 15_000 });
});
