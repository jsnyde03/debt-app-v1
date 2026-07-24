import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * §2.5 (2.5.3a) — trial / intro-price resolution, proven on the REAL app. Core + app-layer suites prove
 * the resolver math; this proves the WIRING: a seeded trial obligation actually reprices the Guardian's
 * read. Two rows differ ONLY in their kick-in date — the converted one drives the same tight read a real
 * $1750 bill would; the not-yet-converted one bills its $0 intro and stays clear. Same row, opposite read
 * → the resolution (not the row's presence) is what moved the number.
 */

test.describe('§2.5 trials — the resolver reprices the Guardian on the real app', () => {
  const trialRow = (fullChargeDate: string) => ({
    id: 't0',
    name: 'Streaming',
    amount: 0, // free trial: $0 now
    dueDate: '2026-07-01',
    recurrence: 'monthly' as const,
    isTrial: true,
    fullAmount: 1750,
    fullChargeDate,
  });

  test('converted trial (kick-in already passed) → bills the full price → tight read', async ({ page }) => {
    await seedStore(page, scenario({ requiredExpenses: [trialRow('2026-06-01')] }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText(/tight this paycheck/i)).toBeVisible();
  });

  test('not-yet-converted trial (future kick-in) → bills the $0 intro → clear read', async ({ page }) => {
    await seedStore(page, scenario({ requiredExpenses: [trialRow('2027-01-01')] }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText('Looks clear this paycheck')).toBeVisible();
  });

  test('2.5.4 — a converted trial surfaces the keep/cancel card; Keep it resolves it', async ({ page }) => {
    // A realistic converted trial (past kick-in) — stays clear, but the card should prompt.
    const netflix = { id: 'nf', name: 'Netflix', amount: 0, dueDate: '2026-07-10', recurrence: 'monthly' as const, isTrial: true, fullAmount: 15.99, fullChargeDate: '2020-01-01' };
    await seedStore(page, scenario({ requiredExpenses: [netflix] }));
    await page.goto('/');
    await expect(page.getByText(/Your Netflix trial has ended/)).toBeVisible();
    await page.getByRole('button', { name: 'Keep it' }).click();
    await expect(page.getByText(/Your Netflix trial has ended/)).toHaveCount(0); // resolved → card gone
  });
});
