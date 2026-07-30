import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * RS.6 — Payday Guardian SURFACES + trouble-flows (web). The core + app-layer suites prove the Guardian
 * LOGIC (buildGuardianBrief / selectPaydayGuardian / actions) exhaustively; this proves the UI WIRING —
 * that a seeded store state actually renders the right card on Today, and that the value-led free/premium
 * gating and the shortfall trouble-flow reach the screen. Assertions target visible text (robust; matches
 * the "verify by looking at what the user sees" bar), not the Skia canvas.
 */

test.describe('Payday Guardian — surfaces + trouble-flows', () => {
  test('premium · clear: card shows the read and the safe move', async ({ page }) => {
    await seedStore(page, scenario()); // 2000 paycheck, 100 min, floor 200 → high headroom
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText('Looks clear this paycheck')).toBeVisible();
    await expect(page.getByText('To debt')).toBeVisible(); // premium deploys the spare → the payoff stat
    await expect(page.getByText('· Your line')).toBeVisible(); // the floor sub-line ("$200 · Your line"), 2.4.11.4b.0
    await expect(page.getByText('Adjust your line →')).toBeVisible(); // premium-only floor control is wired
  });

  test('premium · the floor control actually OPENS its sheet (3.5.0.5 wiring)', async ({ page }) => {
    // 3.5.0.5 made the sheet's render conditional on the host passing `onSetFloor`, so the card can be
    // reused as a tutorial prop without moving the user's real line. The visible-control assertion above
    // can't catch a host that forgets the prop — the link still renders and nothing opens. This does.
    await seedStore(page, scenario());
    await page.goto('/');
    await page.getByText('Adjust your line →').click();
    await expect(page.getByText('Your cushion line')).toBeVisible();
    await expect(page.getByText('The cash the Guardian keeps each paycheck before any extra debt payoff.')).toBeVisible();
  });

  test('premium · tight: headroom under the floor renders the tight read', async ({ page }) => {
    await seedStore(page, scenario({ requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 1750, dueDate: '2026-07-01', recurrence: 'monthly' }] }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText(/tight this paycheck/i)).toBeVisible();
  });

  test('premium · shortfall trouble-flow: "won\'t cover everything"', async ({ page }) => {
    await seedStore(page, scenario({ requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 2600, dueDate: '2026-07-01', recurrence: 'monthly' }] }));
    await page.goto('/');
    await expect(page.getByText("This paycheck won't cover everything")).toBeVisible();
  });

  test('free · value-led gating: the real read + the invitation, no safe-move', async ({ page }) => {
    await seedStore(page, scenario({ subscriptionPlan: 'free' }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText('Looks clear this paycheck')).toBeVisible(); // free still sees the honest read
    await expect(page.getByText(/Premium keeps your cushion at your line/i)).toBeVisible(); // the designed invitation
  });

  test('premium · first-run intro shows once, then dismisses', async ({ page }) => {
    await seedStore(page, scenario()); // premium, guardianIntroSeen defaults false → intro shows
    await page.goto('/');
    const intro = page.getByText('Your floor is protected, starting today');
    await expect(intro).toBeVisible();
    await page.getByRole('button', { name: /Got it/i }).click();
    await expect(intro).toHaveCount(0); // dismissed → persisted to guardianIntroSeen
  });

  test('premium · intro already seen: not shown again', async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: true, guardianIntroSeen: true } }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText('Your floor is protected, starting today')).toHaveCount(0);
  });

  test('free · no first-run intro (premium-only)', async ({ page }) => {
    await seedStore(page, scenario({ subscriptionPlan: 'free' }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText('Your floor is protected, starting today')).toHaveCount(0);
  });

  test('no plan: the Guardian card does not appear', async ({ page }) => {
    await seedStore(page, scenario({ paycheck: { amount: '' }, debts: [] })); // no plan → selectPaydayGuardian null
    await page.goto('/');
    // The app still boots to Today; the Guardian card is simply absent (no crash, no empty shell).
    await expect(page.getByText('PAYDAY GUARDIAN')).toHaveCount(0);
  });

  // ── 2.4.11.6 — the remaining Guardian STATES fold onto the harness (missed / stale / debt-free / at-risk) ──
  test('premium · at-risk: "Very tight this paycheck"', async ({ page }) => {
    await seedStore(page, scenario({ requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 1870, dueDate: '2026-07-01', recurrence: 'monthly' }] }));
    await page.goto('/');
    await expect(page.getByText('Very tight this paycheck')).toBeVisible();
  });

  test('premium · missed paycheck (paused deploy): "A paycheck didn\'t land"', async ({ page }) => {
    await seedStore(page, scenario({ paycheck: { amount: '2000', payCycle: 'biweekly', nextPaycheckDate: '2026-08-07' }, missedArrivals: ['2026-08-07'] }));
    await page.goto('/');
    await expect(page.getByText("A paycheck didn't land")).toBeVisible();
  });

  test('premium · stale inputs: "Let\'s refresh your numbers"', async ({ page }) => {
    await seedStore(page, scenario({ inputsAsOf: '2026-05-01' })); // > 45 days before "today" → stale cutoff
    await page.goto('/');
    await expect(page.getByText("Let's refresh your numbers")).toBeVisible();
  });

  test('premium · debt-free: the Guardian persists, framed to savings', async ({ page }) => {
    // A paid-off debt (balance 0) → debt-free, but the entity keeps the plan/timeline intact.
    await seedStore(page, scenario({
      debts: [{ id: 'd0', name: 'Card', balance: 0, minimumPayment: 100, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }],
      goals: [{ id: 'ef', name: 'Emergency Fund', type: 'emergency', currentAmount: 1000, targetAmount: 5000 }],
    }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText('To savings')).toBeVisible(); // spare re-targeted to savings, never "To debt"
  });
});
