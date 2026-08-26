import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * ⛔ **S1.5.3 [B3] — TWO ONE-TAP MONEY MOVES, ONE RECORD.** The store logic is proven in
 * `storeActions.test.ts`; this pins the WIRING, which nothing covered at all.
 *
 * ⚠️ **A tested helper is not a used helper.** `applyTightTopUp` now takes a `source`, and both call
 * sites typecheck perfectly while passing the WRONG one — the affordability card saying `'guardian'`
 * would re-create the blocker exactly, with every unit test still green. The cover-from-savings path had
 * no end-to-end coverage before this file: `affordability.spec.ts` drives the comfortable and short
 * verdicts and never the tight one.
 */
test.use({ viewport: { width: 402, height: 874 } });

// Measured, not guessed: at this plan a $400 purchase is TIGHT and offers $100 from Trip.
// ⚠️ The emergency fund is deliberately larger and must NOT be the one offered — a discretionary
// purchase never raids it, and a fixture with only one goal could not tell the two rules apart.
const TIGHT = () =>
  scenario({
    paycheck: { amount: '1200', currentDate: day(0), nextPaycheckDate: day(31) },
    debts: [{ id: 'd0', name: 'Card', balance: 8000, minimumPayment: 100, apr: 22, dueDate: day(2), type: 'debt', recurrence: 'monthly' }],
    requiredExpenses: [{ id: 'rent', name: 'Rent', amount: 600, dueDate: day(3), recurrence: 'monthly', category: 'housing' }],
    goals: [
      { id: 'S1', name: 'Trip', type: 'savings', currentAmount: 400, targetAmount: 2000 },
      { id: 'EF', name: 'Emergency Fund', type: 'emergency', currentAmount: 900, targetAmount: 5000 },
    ],
    prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: true },
  });

const goals = async (page: import('@playwright/test').Page) => {
  const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
  const s = JSON.parse(raw ?? '{}');
  return Object.fromEntries((s.goals ?? []).map((g: { id: string; currentAmount: number }) => [g.id, g.currentAmount]));
};

test('B3 · the affordability cover draws from its own goal, and its Undo returns exactly that', async ({ page }) => {
  await seedStore(page, TIGHT());
  await page.goto('/');
  await expect(page.getByText('CAN I AFFORD IT?')).toBeVisible({ timeout: 15_000 });

  await page.getByPlaceholder('e.g. 400').fill('400');
  // ⛔ Offered from the SAVINGS goal, never the (larger) emergency fund.
  const cover = page.getByRole('button', { name: /from Trip & apply/ });
  await expect(cover).toBeVisible();
  await expect(page.getByRole('button', { name: /Emergency Fund & apply/ })).toHaveCount(0);

  await cover.click();
  await expect.poll(() => goals(page), { timeout: 10_000 }).toEqual({ S1: 300, EF: 900 });

  await page.getByRole('button', { name: 'Undo' }).first().click();
  // ⛔ Back to exactly where it started — not more, which is what a second undo used to invent, and not
  // into a different goal, which is where the Guardian's undo used to send it.
  await expect.poll(() => goals(page), { timeout: 10_000 }).toEqual({ S1: 400, EF: 900 });

  // …and the cycle record is spent, so nothing is left to hand back a second time.
  const rec = await page.evaluate(() => JSON.parse(window.localStorage.getItem('debtPlanner.rnStore') ?? '{}').cycleTopUp);
  expect(rec?.amount ?? 0).toBe(0);
});
