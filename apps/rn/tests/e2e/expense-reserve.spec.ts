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
  await expect(page.getByText('Upcoming bills', { exact: true })).toBeVisible();
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
  await expect(page.getByText('Upcoming bills', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Set by / })).toHaveCount(0);

  // …and the Money tab's hero reads the real reserve rather than the recommendation.
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click(); // Money opens on Debts
  await expect(page.getByText('reserved for upcoming bills')).toBeVisible();
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
  await expect(page.getByText('reserved for upcoming bills')).toBeVisible();
  await expect(page.getByText(/recommended each paycheck/)).toBeVisible();
});
