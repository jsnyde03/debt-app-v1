import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

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
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
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
    prefs: { onboardingComplete: true, themeMode },
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

/**
 * T3.7 (audit L5-6) — the Notifications toggle must never fail in silence.
 *
 * `handleNotificationsToggle` used to be `if (granted) updatePrefs(...)` and nothing else. iOS presents
 * its permission alert ONCE EVER, so for every user who declined it the first time, the switch flipped
 * on, snapped back, and the app said nothing — a control that cannot work and never admits it.
 *
 * ⚠️ Web reaches the `unsupported` branch, not `blocked`, so this pins the INVARIANT (every non-granted
 * outcome is spoken) rather than the iOS copy. The `blocked` → "Open Settings" path needs a real device
 * and is on the Phase-6 device pass.
 */
test('the Notifications toggle explains itself when it cannot be turned on', async ({ page }) => {
  const messages: string[] = [];
  page.on('dialog', (d) => { messages.push(d.message()); void d.dismiss(); });

  await seedStore(page, scenario({}));
  await page.goto('/more');
  await page.waitForTimeout(500);

  await page.getByLabel('Notifications').click();
  await page.waitForTimeout(500);

  expect(messages.length, 'a failed enable says something (was: silent snap-back)').toBeGreaterThan(0);

  /**
   * ⛔ **S1.13.7.10 — AND IT MUST SAY WHAT WENT WRONG, NOT MERELY SAY SOMETHING. [pass-6 `A1-11`]
   *
   * `messages.length > 0` alone is satisfied by an EMPTY dialog, a raw error, or a message about
   * something else entirely — a user meeting any of those is one step from the silent snap-back this
   * test exists for. ⚠️ The web outcome is `unsupported` (`notifications.web.ts`: there is nothing to
   * grant), and `more.tsx` speaks it as *"Not available here / Reminders are a feature of the iPhone
   * app."* — so the invariant this file pins (**every non-granted outcome is spoken**) is checked here
   * against the branch web actually reaches, exactly as the header says.
   */
  const spoken = messages.join(' | ');
  expect(spoken.trim().length, `the dialog is not empty (got ${JSON.stringify(spoken)})`).toBeGreaterThan(10);
  expect(spoken, 'the dialog NAMES the reason rather than merely appearing').toMatch(/Not available here|iPhone app/);
});
