import { test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * Phase-3 Best-in-Class Enhancement audit (3.0) — capture a canonical both-theme screenshot set of the
 * primary surfaces at a phone viewport, richly seeded (premium, established, debts incl. an
 * installment-native BNPL, a bill, a goal), so the lens-auditors have real visual evidence. Not a pass/
 * fail spec — it just captures. Output → test-results/enh-*.png.
 */

test.use({ viewport: { width: 402, height: 874 } }); // iPhone 16 Pro-ish

const rich = (themeMode: 'light' | 'dark') =>
  scenario({
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [
      { id: 'card', name: 'Chase Freedom', balance: 4200, minimumPayment: 120, apr: 23.99, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
      { id: 'car', name: 'Auto Loan', balance: 9800, minimumPayment: 310, apr: 6.4, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
      { id: 'klarna', name: 'Klarna', balance: 320, minimumPayment: 80, apr: 0, dueDate: '2026-08-08', type: 'bnpl', recurrence: 'biweekly', scheduledPaymentAmount: 80, remainingPayments: 4, bnplProvider: 'Klarna', balanceAsOfDate: '2026-08-01' },
    ],
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 1250, dueDate: '2026-08-01', recurrence: 'monthly' },
      { id: 'phone', name: 'Phone', amount: 65, dueDate: '2026-08-15', recurrence: 'monthly' },
    ],
    goals: [{ id: 'ef', name: 'Emergency Fund', type: 'emergency', currentAmount: 600, targetAmount: 2000 }],
    prefs: { onboardingComplete: true, guardianIntroSeen: true, themeMode },
  });

const SURFACES: { path: string; name: string }[] = [
  { path: '/', name: 'today' },
  { path: '/progress', name: 'progress' },
  { path: '/money', name: 'money' },
  { path: '/more', name: 'more' },
  { path: '/paywall', name: 'paywall' },
];

for (const theme of ['light', 'dark'] as const) {
  for (const s of SURFACES) {
    test(`capture ${s.name} (${theme})`, async ({ page }) => {
      // Paywall is best shown to a free user; everything else to the seeded premium user.
      await seedStore(page, s.name === 'paywall' ? { ...rich(theme), subscriptionPlan: 'free' } : rich(theme));
      await page.goto(s.path);
      await page.waitForTimeout(900); // let Skia/motion settle
      await page.screenshot({ path: `test-results/enh-${s.name}-${theme}.png`, fullPage: true });
    });
  }
}
