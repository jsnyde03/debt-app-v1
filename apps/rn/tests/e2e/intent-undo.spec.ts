import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * ⛔ **S1.5.3 [B2] — THE UNDO THAT REVERTED THE WHOLE STORE.**
 *
 * `intentRollback` snapshots the ENTIRE `DebtStore` when a payment is logged (or a payday intent lands),
 * and `undoIntentAction` restores the whole thing. **Nothing ever cleared it** — seven references in
 * `store.ts` and they were the complete set: two writers, two clearers, the type, the initial value. So
 * everything the user did afterwards was silently and permanently deleted the moment they tapped an
 * **Undo** on a card whose text promises only to undo the payment. The loss persists: `persistence.ts`
 * schedules a write whenever `state.store` changes by reference.
 *
 * ⚠️ **This card had NO end-to-end coverage at all.** The only test was at the store layer, and it called
 * `logManualPayment` and `undoIntentAction` with nothing in between.
 *
 * ⛔ **Navigation here is by TAB, never `page.goto`.** `intentRollback` is transient by design — "resets
 * to null each launch" — and `page.goto` is a full reload, so a spec that navigated that way would find
 * the card missing and conclude the feature was broken.
 */
test.use({ viewport: { width: 402, height: 874 } });

const PLAN = () =>
  scenario({
    debts: [{ id: 'card', name: 'Chase Freedom', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19.9, dueDate: day(1), type: 'debt', recurrence: 'monthly' }],
    prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: true },
  });

async function logAPayment(page: import('@playwright/test').Page) {
  await page.goto('/money');
  await page.getByText('Chase Freedom', { exact: true }).first().click();
  await expect(page.getByText('Edit debt')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('debt-log-payment').click();
  await expect(page.getByText('Amount paid')).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Amount paid').fill('200');
  await page.getByRole('button', { name: 'Log payment' }).click();
  // Wait for the SAVE, not a duration — autosave is debounced 500 ms.
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      return JSON.parse(raw ?? '{}').debts?.find((d: { name: string }) => d.name === 'Chase Freedom')?.balance;
    }, { timeout: 10_000 })
    .toBe(3800);
}

const today = (page: import('@playwright/test').Page) => page.getByRole('tab', { name: 'Today' }).click();

/**
 * ⭐ **The property that must SURVIVE.** Invalidating the snapshot too eagerly would delete this card
 * from the product, and nothing else would have noticed.
 */
test('B2 control — logging a payment still offers the Undo on Today', async ({ page }) => {
  await seedStore(page, PLAN());
  await logAPayment(page);
  await today(page);

  await expect(page.getByText('Payment logged — I updated your balance.')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();

  // …and it still undoes the payment.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      return JSON.parse(raw ?? '{}').debts?.find((d: { name: string }) => d.name === 'Chase Freedom')?.balance;
    }, { timeout: 10_000 })
    .toBe(4000);
});

/**
 * ⛔ **THE BLOCKER.** Log a payment, then add a goal — an ordinary next thing to do — and the Undo card
 * must be gone, because the snapshot it would restore no longer describes this plan. Before the fix the
 * card was still there, still offering "Undo", and tapping it deleted the goal.
 */
test('B2 · an unrelated edit retires the Undo — it cannot reach back past work the user has done', async ({ page }) => {
  await seedStore(page, PLAN());
  await logAPayment(page);

  // An ordinary next action, in the same session, without a reload.
  await page.getByText('Goals', { exact: true }).click();
  await page.getByTestId('money-add').click();
  await page.getByTestId('add-choice-goal').click();
  await expect(page.getByText('Target amount')).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Name').fill('New car');
  await page.getByLabel('Target amount').fill('2000');
  await page.getByRole('button', { name: 'Add goal' }).click();
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      return (JSON.parse(raw ?? '{}').goals ?? []).map((g: { name: string }) => g.name);
    }, { timeout: 10_000 })
    .toContain('New car');

  await today(page);

  // Both-branches marker: Today has rendered before anything is asserted absent.
  await expect(page.getByText('Required actions', { exact: true })).toBeVisible({ timeout: 15_000 });
  // ⛔ The offer is withdrawn — asserted on the card's own sentence, not on the bare word "Undo", which
  // other surfaces also use.
  await expect(page.getByText('Payment logged — I updated your balance.')).toHaveCount(0);
  // ⛔ And the honest state asserted POSITIVELY: the goal is still there, and so is the payment. A card
  // that vanished while quietly reverting either of them would pass the absence assertion alone.
  const after = await page.evaluate(() => JSON.parse(window.localStorage.getItem('debtPlanner.rnStore') ?? '{}'));
  expect((after.goals ?? []).map((g: { name: string }) => g.name)).toContain('New car');
  expect(after.debts.find((d: { name: string }) => d.name === 'Chase Freedom').balance).toBe(3800);
});
