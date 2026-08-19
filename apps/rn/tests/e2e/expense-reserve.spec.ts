import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * 3.8 — the expense reserve, end to end: the TAP that opens the split, and the TICK that reserves.
 *
 * ⛔ The defect this feature closes was never in the engine: the Expenses hero said "reserved per
 * paycheck" over a figure nothing reserved. So the load-bearing assertions here are about what a user can
 * SEE and DO — the engine's own invariants are locked in `@core/engine/testExpenseReserve`, and no engine
 * test can tell you a row disappeared from a screen.
 *
 * ⚠️ Three bills across two due windows, deliberately: rent is an example, not the case. `day()` rather
 * than calendar literals — see the helper's note about paydays expiring overnight.
 */

const bills = [
  { id: 'rent', name: 'Rent', amount: 350, dueDate: day(3), recurrence: 'monthly', category: 'housing' },
  { id: 'elec', name: 'Electric', amount: 120, dueDate: day(30), recurrence: 'monthly', category: 'utilities' },
  { id: 'nflx', name: 'Netflix', amount: 30, dueDate: day(32), recurrence: 'monthly', category: 'subscriptions' },
];

const plan = (over: Record<string, unknown> = {}) =>
  scenario({
    paycheck: { amount: '2000', nextPaycheckDate: day(14), currentDate: day(0) },
    requiredExpenses: bills,
    livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 300, enabled: true }],
    ...over,
  });

test('the Guardian bar says "Spoken for", and it opens the split', async ({ page }) => {
  await seedStore(page, plan());
  await page.goto('/');

  // [D36] — not "Everyday" (it now carries bills too), not "Set aside" (the gig app's term), not
  // "Reserved" (that would name a different figure than the Money hero's).
  await expect(page.getByText('Spoken for')).toBeVisible();

  await page.getByRole('button', { name: /Spoken for/ }).click();
  await expect(page.getByText('of this paycheck is already accounted for')).toBeVisible();
  await expect(page.getByText('Everyday spending')).toBeVisible();
  await expect(page.getByText('Upcoming expenses', { exact: true })).toBeVisible();
});

test('the TICK: reserving moves the plan, and the Money hero says so', async ({ page }) => {
  await seedStore(page, plan());
  await page.goto('/');

  await page.getByRole('button', { name: /Spoken for/ }).click();
  const reserve = page.getByRole('button', { name: /^Set by / });
  await expect(reserve).toBeVisible();
  await reserve.click();

  // ⛔ The whole point: the app now RECORDS the habit it coaches. Before 3.8 this number never moved, so
  // the offer disappearing (nothing left to offer) IS the evidence that the reserve landed.
  await expect(page.getByText('Upcoming expenses', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Set by / })).toHaveCount(0);

  // …and the Money tab's hero reads the real reserve rather than the recommendation.
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click(); // Money opens on Debts
  await expect(page.getByText('reserved for upcoming expenses')).toBeVisible();
  await expect(page.getByText(/recommended each paycheck/)).toBeVisible();
});

test('the everyday door is UNCONDITIONAL — visible with nothing set up', async ({ page }) => {
  // ⭐ 🎯's second report: "living expenses are hidden in More". The Money card WAS gated on
  // `livingTotal > 0`, so the discoverable door appeared only to users who had already found the feature.
  await seedStore(page, plan({ livingExpenses: [] }));
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click(); // Money opens on Debts

  await expect(page.getByText('Everyday spending reserve')).toBeVisible();
  await expect(page.getByText('Not set up')).toBeVisible();
});

test('a bill the reserve has pre-funded still shows, and names the REAL bill', async ({ page }) => {
  // ⛔ The regression that only a screen can catch: with the pot covering rent in full, the row used to
  // vanish — unticket-able, while still counting against the on-plan streak.
  await seedStore(page, plan({ expenseReserve: { balance: 350 } }));
  await page.goto('/');

  await expect(page.getByText('Pay Rent')).toBeVisible();
  // The headline is the BILL ($350), not this paycheck's $0 share of it.
  await expect(page.getByText('$350 from your reserve')).toBeVisible();
});

test('the Money hero shows $0 before anything is reserved — honestly', async ({ page }) => {
  await seedStore(page, plan());
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click(); // Money opens on Debts

  // The number is allowed to be zero. What it may not be is the recommendation wearing the word
  // "reserved", which is what shipped before 3.8.
  await expect(page.getByText('reserved for upcoming expenses')).toBeVisible();
  await expect(page.getByText(/recommended each paycheck/)).toBeVisible();
});

/**
 * [T5 · L3-6] The EVERYDAY reserve is the same defect class 3.8 closed for upcoming expenses — one layer
 * down and still open. `LivingExpense` carries no cadence field, so the enabled sum is taken as a
 * per-paycheck figure verbatim, and the engine then clamps it to what exists
 * (`remaining = Math.max(0, remaining − paidRequired − livingExpenseReserve)`). The overflow is absorbed
 * with nothing recorded against the reserve, so both surfaces said "reserved each paycheck" over money
 * the paycheck never held.
 *
 * ⚠️ The engine numbers are pinned in `expenseReserve.test.ts`. These exist because that unit test passes
 * happily against a caption hardcoded back to "Reserved each paycheck" — only a screen can catch the copy.
 */
const overReserved = () =>
  plan({
    // $300 paycheck against $400 of enabled everyday spending → $100 of it cannot exist.
    paycheck: { amount: '300', nextPaycheckDate: day(14), currentDate: day(0) },
    requiredExpenses: [],
    livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 400, enabled: true }],
  });

test('an everyday reserve bigger than the paycheck says what was actually held [L3-6]', async ({ page }) => {
  await seedStore(page, overReserved());
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click(); // Money opens on Debts

  // The card is the door to CONFIGURING the reserve, so the $400 figure stays — it is what the user set.
  await expect(page.getByText('Everyday spending reserve')).toBeVisible();
  // The caption is the part that made a claim about an outcome, so it is the part that must be true.
  await expect(page.getByText('This paycheck holds $300 of it · tap to manage')).toBeVisible();
  await expect(page.getByText('Reserved each paycheck · tap to manage')).toHaveCount(0);
});

test('a reserve the paycheck CAN hold still reads as reserved [L3-6]', async ({ page }) => {
  // The other direction: the honest caption must not become the permanent one.
  await seedStore(page, plan());
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();

  await expect(page.getByText('Reserved each paycheck · tap to manage')).toBeVisible();
  await expect(page.getByText(/This paycheck holds/)).toHaveCount(0);
});

test('"Spoken for" quotes what the paycheck held, not what was requested [L3-6]', async ({ page }) => {
  await seedStore(page, overReserved());
  await page.goto('/');

  await page.getByRole('button', { name: /Spoken for/ }).click();
  await expect(page.getByText('of this paycheck is already accounted for')).toBeVisible();

  // This sheet partitions THIS PAYCHECK, so every figure in it is an outcome — the row shows the held
  // $300 and the hint names the gap, rather than asserting $400 of a $300 paycheck is spoken for.
  await expect(
    page.getByText('Groceries, gas, fun money — this paycheck holds $300 of the $400 you set.'),
  ).toBeVisible();
  await expect(page.getByText('Groceries, gas, fun money — reserved every paycheck.')).toHaveCount(0);
});
