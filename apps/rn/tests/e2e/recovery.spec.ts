import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * §2.6 Recovery Plan — the shortfall card's built catch-up plan on the REAL app (the engine + selector
 * are unit-proven; this proves the WIRING). A seeded shortfall (bills > paycheck, mixed essential +
 * deferrable) renders cover-now + the safe-to-defer checklist; applying the suggested defers closes the
 * gap and the card relaxes out of the shortfall read — one action rippling through the one store.
 */

// paycheck 850 vs required 896 (Rent 800 + Netflix 16 + Gym 30 + Card min 50) → a $46 shortfall.
const shortfall = () =>
  scenario({
    paycheck: { amount: '850' },
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 800, dueDate: '2026-07-01', recurrence: 'monthly', category: 'housing' },
      { id: 'netflix', name: 'Netflix', amount: 16, dueDate: '2026-07-01', recurrence: 'monthly', category: 'subscriptions' },
      { id: 'music', name: 'Music', amount: 30, dueDate: '2026-07-01', recurrence: 'monthly', category: 'subscriptions' },
    ],
    debts: [{ id: 'card', name: 'Card', balance: 5000, minimumPayment: 50, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }],
  });

test.describe('§2.6 Recovery Plan — the shortfall card builds + applies the catch-up plan', () => {
  test('premium shortfall → cover-now + safe-to-defer render, and the suggestion covers the gap', async ({ page }) => {
    await seedStore(page, shortfall());
    await page.goto('/');
    await expect(page.getByText("This paycheck won’t cover everything")).toBeVisible();
    await expect(page.getByText('COVER NOW')).toBeVisible();
    await expect(page.getByText('CAN WAIT IN YOUR PLAN')).toBeVisible();
    await expect(page.getByText('Keep essential').first()).toBeVisible(); // the per-bill override affordance
    await expect(page.getByText(/covers your \$46 gap/)).toBeVisible(); // both suggested → gap covered
    // MF.6: the Recovery Plan owns the shortfall — the RequiredActions "cover these" block is suppressed.
    await expect(page.getByText(/cover these from savings or your next paycheck/)).toHaveCount(0);
  });

  /**
   * [P6.8.9.7.11.14.1 · audit P1-4] The cover-now block at a real portfolio size.
   *
   * ⛔ **The defect was a bare `.join(' · ')`** — `state-today-many.png` showed 23 generic names as a
   * four-line paragraph with the total welded on by an em-dash. ⚠️ The unit test pins `summariseNames`;
   * a tested helper is not a used helper, so this pins what a **user** meets: the eleventh name must not
   * be on the screen until they ask for it.
   */
  test('P1-4 · many essentials truncate to a countable line, and the tap reveals the rest', async ({ page }) => {
    const essentials = Array.from({ length: 11 }, (_, i) => ({
      id: `ess${i}`,
      name: `Essential ${i + 1}`,
      amount: 80,
      dueDate: '2026-07-01',
      recurrence: 'monthly' as const,
      category: 'housing' as const,
    }));
    await seedStore(page, scenario({ paycheck: { amount: '500' }, requiredExpenses: essentials, debts: [] }));
    await page.goto('/');
    await expect(page.getByText('COVER NOW')).toBeVisible();

    // The run-on is gone: three names, then a count of what is held back.
    await expect(page.getByText('+8 more')).toBeVisible();
    await expect(page.getByText('Essential 1 · Essential 2 · Essential 3', { exact: false })).toBeVisible();
    // ⚠️ Asserted on the LAST name rather than on a length: a helper that returned every name with
    // "+8 more" beside it would pass a count assertion while rendering the paragraph the finding is about.
    await expect(page.getByText('Essential 11', { exact: false })).toHaveCount(0);

    await page.getByRole('button', { name: /Show all 11/ }).click();
    await expect(page.getByText('Essential 11', { exact: false })).toBeVisible();
    await expect(page.getByText('Show fewer')).toBeVisible();
  });

  test('applying the defers closes the gap and the card relaxes out of the shortfall', async ({ page }) => {
    await seedStore(page, shortfall());
    await page.goto('/');
    await page.getByRole('button', { name: /Defer these 2/ }).click();
    // Both bills deferred → shortfall gone → the card leaves the "won’t cover everything" read.
    await expect(page.getByText("This paycheck won’t cover everything")).toHaveCount(0);
  });

  test('free shortfall → the honest read + recovery invite, NOT the checklist (premium acting)', async ({ page }) => {
    await seedStore(page, { ...shortfall(), subscriptionPlan: 'free' });
    await page.goto('/');
    // MF.3: free now gets the HONEST shortfall read (no longer softened + paywalled)...
    await expect(page.getByText("This paycheck won’t cover everything")).toBeVisible();
    // ...and the state-aware invite pitches the recovery value, not "cushion at your line".
    await expect(page.getByText(/Premium builds you a catch-up plan/)).toBeVisible();
    await expect(page.getByText('CAN WAIT IN YOUR PLAN')).toHaveCount(0); // the built plan is premium
  });
});
