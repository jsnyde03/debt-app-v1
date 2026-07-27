import { test, expect } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.3.1 debt-paid-off celebration — drives the real confirm flow: a provisional payoff (a premium debt
 * whose projected balance has reached $0) → tap "Confirm" → the per-debt beat (another debt remains) or
 * the full-screen finale (the last debt). Plus the Progress "Debts Vanquished" archive / debt-free state.
 * Captures screenshots for visual verification; also asserts the overlays actually appear.
 */

test.use({ viewport: { width: 402, height: 874 } });

// A debt that projects to $0 by the current date (small balance, an old anchor, a covering minimum) → it
// surfaces as a PayoffInvitationCard on Today. originalBalance drives the celebration's "vanquished" amount.
const provisional = (id: string, name: string) => ({
  id,
  name,
  balance: 40,
  originalBalance: 4200,
  minimumPayment: 300,
  apr: 0,
  dueDate: '2026-08-12',
  type: 'debt' as const,
  recurrence: 'monthly' as const,
  balanceAsOfDate: '2026-05-01',
});

const base = (themeMode: 'light' | 'dark', debts: ReturnType<typeof provisional>[] | any[]) =>
  scenario({
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts,
    prefs: { onboardingComplete: true, guardianIntroSeen: true, themeMode },
    onboardedAt: '2026-01-01',
  });

for (const theme of ['light', 'dark'] as const) {
  test(`per-debt beat (${theme})`, async ({ page }) => {
    // Two debts, one provisional → confirming it is NOT the last → the contained beat.
    await seedStore(page, base(theme, [provisional('card', 'Chase Freedom'), { id: 'car', name: 'Auto Loan', balance: 9800, originalBalance: 12000, minimumPayment: 310, apr: 6.4, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }]));
    await page.goto('/');
    await page.getByRole('button', { name: /Confirm.*paid off/i }).click();
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `test-results/celebration-beat-${theme}.png` });
    await expect(page.getByText(/Vanquished/i)).toBeVisible();
  });

  test(`grand finale (${theme})`, async ({ page }) => {
    // One provisional debt → confirming it IS the last → the full-screen finale.
    await seedStore(page, base(theme, [provisional('card', 'Chase Freedom')]));
    await page.goto('/');
    await page.getByRole('button', { name: /Confirm.*paid off/i }).click();
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `test-results/celebration-finale-${theme}.png` });
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  test(`milestone-cross ack (${theme})`, async ({ page }) => {
    // A pending portfolio milestone (50%) → Today shows the calm gold ack card.
    await seedStore(page, scenario({
      subscriptionPlan: 'premium',
      genuineCycleCount: 6,
      paycheck: { amount: '2400', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
      debts: [{ id: 'car', name: 'Auto Loan', balance: 4800, originalBalance: 12000, minimumPayment: 310, apr: 6.4, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
      prefs: { onboardingComplete: true, guardianIntroSeen: true, themeMode: theme },
      onboardedAt: '2026-01-01',
      pendingMilestone: { threshold: 50, progressPercent: 60 },
    }));
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/celebration-milestone-${theme}.png`, fullPage: true });
    await expect(page.getByText('Halfway to debt-free')).toBeVisible();

    // 3.3.2.3 — the Progress journey ring pulses the just-crossed (50%) node.
    await page.goto('/progress');
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `test-results/celebration-ring-pulse-${theme}.png` });
  });

  test(`vanquished archive + debt-free (${theme})`, async ({ page }) => {
    // Already-cleared debts (balance 0) → Progress shows the debt-free resting state + the archive.
    await seedStore(page, base(theme, [
      { id: 'a', name: 'Chase Freedom', balance: 0, originalBalance: 4200, minimumPayment: 120, apr: 0, dueDate: '2026-06-12', type: 'debt', recurrence: 'monthly', lastVerifiedDate: '2026-06-15', balanceAsOfDate: '2026-06-15' },
      { id: 'b', name: 'Klarna', balance: 0, originalBalance: 320, minimumPayment: 80, apr: 0, dueDate: '2026-08-08', type: 'bnpl', recurrence: 'biweekly', lastVerifiedDate: '2026-08-08', balanceAsOfDate: '2026-08-08' },
    ]));
    await page.goto('/progress');
    await page.waitForTimeout(600);
    await expect(page.getByText(/DEBTS VANQUISHED/i)).toBeVisible();
    await page.screenshot({ path: `test-results/celebration-archive-${theme}.png`, fullPage: true });
  });
}
