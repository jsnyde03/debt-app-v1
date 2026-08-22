import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

test.use({ viewport: { width: 402, height: 874 } });

/**
 * §2.9 Can-I-Afford-This? (web). The verdict + save-for-it math are unit/app-tested; this proves the
 * Today card wiring: entering an amount yields the right premium read + action, and the short case
 * opens the multi-option Save-for-it sheet.
 */

const PREMIUM = scenario({
  debts: [{ id: 'd0', name: 'Card', balance: 8000, minimumPayment: 100, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly' }],
  paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(31) },
  prefs: { onboardingComplete: true, guardianIntroSeen: true },
});

test('comfortable purchase → verdict + apply-to-plan', async ({ page }) => {
  await seedStore(page, PREMIUM);
  await page.goto('/');
  await expect(page.getByText('CAN I AFFORD IT?')).toBeVisible();
  await page.getByPlaceholder('e.g. 400').fill('500');
  await expect(page.getByText(/you’d still hold/)).toBeVisible(); // comfortable read
  await expect(page.getByRole('button', { name: 'Apply to this paycheck' })).toBeVisible();
});

test('short purchase → the honest read + a save-for-it path', async ({ page }) => {
  await seedStore(page, PREMIUM);
  await page.goto('/');
  await page.getByPlaceholder('e.g. 400').fill('5000');
  await expect(page.getByText(/Not this paycheck/)).toBeVisible();
  // The Save-for-it entry is present. (The multi-option sheet is a FormSheet Modal, which RN-web
  // Playwright can't reliably query — its 4 options + sign-off are verified via both-theme screenshots
  // + device/manual, per the Phase-4 web-e2e limits.)
  await expect(page.getByRole('button', { name: 'Save for it →' })).toBeVisible();
});

// §3.3.4 — the animated impact bar renders under a valid amount (the cushion carves vs the floor line).
for (const theme of ['light', 'dark'] as const) {
  test(`§3.3.4 affordability impact bar (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({
      debts: [{ id: 'd0', name: 'Card', balance: 8000, minimumPayment: 100, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly' }],
      paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(31) },
      prefs: { onboardingComplete: true, guardianIntroSeen: true, themeMode: theme },
    }));
    await page.goto('/');
    await page.getByPlaceholder('e.g. 400').fill('500');
    await expect(page.getByText(/you’d still hold/)).toBeVisible();
    await page.getByText(/you’d still hold/).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400); // let the carve settle
    await page.screenshot({ path: `test-results/affordability-impact-${theme}.png` });
  });
}
