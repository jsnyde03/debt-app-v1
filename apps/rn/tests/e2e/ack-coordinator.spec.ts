import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * VIS-4 (closeout) — Today shows at most ONE acknowledgment card at a time (priority-ranked), so the
 * surface never stacks 5-6 acks. With a crossed milestone AND a converted trial both active, only the
 * higher-priority milestone renders; the trial ack is suppressed until the milestone is dismissed.
 */
test('VIS-4 ack coordinator: only the top-priority ack renders', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      paycheck: { amount: '2000', currentDate: '2026-08-01' },
      requiredExpenses: [
        { id: 'e0', name: 'Netflix', amount: 0, fullAmount: 15.99, fullChargeDate: '2026-07-01', isTrial: true, dueDate: '2026-08-01', recurrence: 'monthly' },
      ],
      pendingMilestone: { threshold: 50 },
      prefs: { onboardingComplete: true, guardianIntroSeen: true },
    }),
  );
  await page.goto('/');
  await expect(page.getByText(/Halfway to debt-free/i)).toBeVisible(); // the ranked-first ack
  await expect(page.getByText(/trial has ended/i)).toHaveCount(0); // the lower-priority ack is suppressed
});
