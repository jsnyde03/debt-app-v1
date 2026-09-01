import { test, expect } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 3.3.3 — the premium Guardian proof-of-work strip on the CLEAR-cycle card: a seeded history of held
 * cycles (cushion at/above the floor, matching the prediction) → "Held your line N paychecks · $X to
 * debt · reads matched N/N", tappable-adjacent to the forecast. Both themes.
 */

test.use({ viewport: { width: 402, height: 874 } });

// A confirmed cycle whose cushion held the line and matched the prediction (a scorecard "match").
const heldCycle = (i: number) => ({
  cycleEndDate: `2026-0${i + 1}-01`,
  totalDebtBalance: 5000,
  totalPaidThisCycle: 200,
  completedRecommendedActions: [],
  payoffStrategy: 'snowball',
  prediction: {
    forCycleEndDate: `2026-0${i + 1}-01`,
    predictedCushion: 300,
    predictedState: 'clear',
    predictedShortfall: 0,
    predictedConfidenceContext: { discoveryHoldbackActive: false, coldStartHoldbackActive: false, provisional: false },
    plannedIncome: 2400,
    floor: 200,
  },
  outcome: { actualIncome: 2400, actualCushionHeld: 300, outcomeConfirmed: true },
});

for (const theme of ['light', 'dark'] as const) {
  test(`guardian proof-of-work strip (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({
      subscriptionPlan: 'premium',
      genuineCycleCount: 6,
      paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
      debts: [{ id: 'car', name: 'Auto Loan', balance: 9800, originalBalance: 12000, minimumPayment: 310, apr: 6.4, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
      cycleHistory: [0, 1, 2, 3, 4].map(heldCycle),
      prefs: { onboardingComplete: true, themeMode: theme },
      onboardedAt: '2026-01-01',
    }));
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/guardian-proof-${theme}.png`, fullPage: true });
    // VIS-3 — the streak now reads as a calm PILL ("Held your line · 5 paychecks"), so allow the middot.
    await expect(page.getByText(/Held your line.*5 paychecks/i)).toBeVisible();
  });
}
