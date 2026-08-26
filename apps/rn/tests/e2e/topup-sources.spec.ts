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

/**
 * ⛔ **S1.9.1 [D2-2] — THE AMOUNT THE CARD SAYS IT MOVED IS THE AMOUNT ITS UNDO RETURNS.**
 *
 * The store keeps ONE ENTRY PER SOURCE and accumulates into it ([B3], deliberately, and pinned in
 * `storeActions.test.ts`), while this card's sentence comes from `useState` — cleared by any remount, of
 * which an app relaunch is one and the walkthrough swapping the tree is another. A second cover therefore
 * made the two disagree: the card said *"moved $50"* and `undoTightTopUp('affordability')` handed back the
 * cycle's $150, silently un-covering the earlier purchase with nothing on screen saying so.
 *
 * ⚠️ **The store fix alone cannot be trusted here** — `undoTightTopUp` now takes an optional draw, and this
 * call site typechecks perfectly while omitting it, which IS the defect. This is the only assertion that
 * could red on that; the header above says the same thing about `source`, one fix ago.
 *
 * ⛔ **The fixture is the SECOND launch, seeded directly, not two covers driven through one page.**
 * `seedStore` re-injects on every navigation, so a `page.reload()` would restore the pristine blob and
 * quietly test nothing — the entry the defect needs is exactly what the reload throws away.
 */
const COVERED_ONCE = () => {
  const s = TIGHT();
  return {
    ...s,
    // $400 couch, already applied, its $100 cover already drawn — Trip is down to $300.
    // ⚠️ `requiredExpenses`, because that is where `addExpense` puts an applied purchase — seeding it into
    // `livingExpenses` instead left Flexible at $500 and the card offered no cover at all.
    requiredExpenses: [
      { id: 'e0', name: 'Rent', amount: 600, dueDate: day(3), recurrence: 'monthly', category: 'housing' },
      { id: 'p1', name: 'Couch', amount: 400, dueDate: day(0), recurrence: 'one-time', category: 'discretionary' },
    ],
    goals: [
      { id: 'S1', name: 'Trip', type: 'savings', currentAmount: 300, targetAmount: 2000 },
      { id: 'EF', name: 'Emergency Fund', type: 'emergency', currentAmount: 900, targetAmount: 5000 },
    ],
    cycleTopUp: { forCycle: day(31), amount: 100, goalId: 'S1', entries: [{ source: 'affordability', goalId: 'S1', amount: 100 }] },
  };
};

test('D2-2 · the card’s Undo returns ITS OWN cover, not the source’s accumulated entry', async ({ page }) => {
  await seedStore(page, COVERED_ONCE());
  await page.goto('/');
  await expect(page.getByText('CAN I AFFORD IT?')).toBeVisible({ timeout: 15_000 });
  const rec = () => page.evaluate(() => JSON.parse(window.localStorage.getItem('debtPlanner.rnStore') ?? '{}').cycleTopUp?.amount ?? 0);
  expect(await rec()).toBe(100);

  // ── a $50 lamp, covered by $50 from Trip. The ENTRY accumulates to $150; the card knows only its $50. ──
  await page.getByPlaceholder('e.g. 400').fill('50');
  await page.getByPlaceholder('e.g. New couch').fill('Lamp');
  await page.getByRole('button', { name: /Cover \$50 from Trip & apply/ }).click();
  await expect.poll(() => goals(page), { timeout: 10_000 }).toEqual({ S1: 250, EF: 900 });
  await expect.poll(rec, { timeout: 10_000 }).toBe(150);
  // ⛔ The SENTENCE is half the finding — it is the number the Undo below is judged against.
  await expect(page.getByText(/moved \$50 from Trip to hold your line/)).toBeVisible();

  await page.getByRole('button', { name: 'Undo' }).first().click();
  // ⛔ $50 back, not $150. Trip returns to where THIS cover found it…
  await expect.poll(() => goals(page), { timeout: 10_000 }).toEqual({ S1: 300, EF: 900 });
  // …and the couch's $100 cover is still standing, which is the half that used to vanish in silence.
  await expect.poll(rec, { timeout: 10_000 }).toBe(100);
});
