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
    await expect(page.getByText("This paycheck won't cover everything")).toBeVisible();
    await expect(page.getByText('COVER NOW')).toBeVisible();
    await expect(page.getByText('SAFE TO DEFER')).toBeVisible();
    await expect(page.getByText('Keep essential').first()).toBeVisible(); // the per-bill override affordance
    await expect(page.getByText(/covers your \$46 gap/)).toBeVisible(); // both suggested → gap covered
  });

  test('applying the defers closes the gap and the card relaxes out of the shortfall', async ({ page }) => {
    await seedStore(page, shortfall());
    await page.goto('/');
    await page.getByRole('button', { name: /Defer these 2/ }).click();
    // Both bills deferred → shortfall gone → the card leaves the "won't cover everything" read.
    await expect(page.getByText("This paycheck won't cover everything")).toHaveCount(0);
  });

  test('free shortfall → the honest read + invite, NOT the recovery checklist (premium acting)', async ({ page }) => {
    await seedStore(page, { ...shortfall(), subscriptionPlan: 'free' });
    await page.goto('/');
    // Free sees the honest read (not the premium "won't cover everything" title) + the value-led invite.
    await expect(page.getByText(/Premium keeps your cushion at your line/)).toBeVisible();
    await expect(page.getByText('SAFE TO DEFER')).toHaveCount(0); // the built plan is premium
  });
});
