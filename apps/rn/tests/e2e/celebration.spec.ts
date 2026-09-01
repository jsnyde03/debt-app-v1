import { test, expect } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 3.3.1 debt-paid-off celebration — drives the real confirm flow: a provisional payoff (a premium debt
 * whose projected balance has reached $0) → tap "Confirm" → the per-debt beat (another debt remains) or
 * the full-screen finale (the last debt). Plus the Progress "Debts Paid Off" archive / debt-free state.
 * Captures screenshots for visual verification; also asserts the overlays actually appear.
 */

test.use({ viewport: { width: 402, height: 874 } });

// A debt that projects to $0 by the current date (small balance, an old anchor, a covering minimum) → it
// surfaces as a PayoffInvitationCard on Today. originalBalance drives the celebration's "paid off" amount.
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
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
    debts,
    prefs: { onboardingComplete: true, themeMode },
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
    // Identity-based: "Keep going" is unique to the visible beat card (the off-screen ShareCard has no
    // such button), so a regression that killed the visible beat can't pass by matching the off-screen copy.
    await expect(page.getByRole('button', { name: 'Keep going' })).toBeVisible();
  });

  test(`grand finale (${theme})`, async ({ page }) => {
    // One provisional debt → confirming it IS the last → the full-screen finale.
    await seedStore(page, base(theme, [provisional('card', 'Chase Freedom')]));
    await page.goto('/');
    await page.getByRole('button', { name: /Confirm.*paid off/i }).click();
    // R2-A3 — wait for the Skia CanvasKit layers (ring + mesh) to actually render before capturing, so the
    // light run doesn't screenshot a ringless/meshless frame (a fixed timeout raced the CanvasKit load).
    await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `test-results/celebration-finale-${theme}.png` });
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share your win' })).toBeVisible(); // VIS-2 share entry
  });

  test(`milestone-cross ack (${theme})`, async ({ page }) => {
    // A pending portfolio milestone (50%) → Today shows the calm gold ack card.
    await seedStore(page, scenario({
      subscriptionPlan: 'premium',
      genuineCycleCount: 6,
      paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
      debts: [{ id: 'car', name: 'Auto Loan', balance: 4800, originalBalance: 12000, minimumPayment: 310, apr: 6.4, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
      prefs: { onboardingComplete: true, themeMode: theme },
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

  test(`paid off archive + debt-free (${theme})`, async ({ page }) => {
    // Already-cleared debts (balance 0) → Progress shows the debt-free resting state + the archive.
    await seedStore(page, base(theme, [
      { id: 'a', name: 'Chase Freedom', balance: 0, originalBalance: 4200, minimumPayment: 120, apr: 0, dueDate: '2026-06-12', type: 'debt', recurrence: 'monthly', lastVerifiedDate: '2026-06-15', balanceAsOfDate: '2026-06-15' },
      { id: 'b', name: 'Klarna', balance: 0, originalBalance: 320, minimumPayment: 80, apr: 0, dueDate: '2026-08-08', type: 'bnpl', recurrence: 'biweekly', lastVerifiedDate: '2026-08-08', balanceAsOfDate: '2026-08-08' },
    ]));
    await page.goto('/progress');
    await page.waitForTimeout(600);
    // Identity-based: the eyebrow's "DEBTS PAID OFF · N" (with the middot) is unique — the off-screen
    // ShareCard's "N debts paid off" has no middot, so this can't match the capture artifact.
    await expect(page.getByText(/DEBTS PAID OFF ·/i)).toBeVisible();
    await page.screenshot({ path: `test-results/celebration-archive-${theme}.png`, fullPage: true });
  });
}

/**
 * ⛔ P6.8.7e.1 [B2 / M2-5] — **THE FREE USER, which every test above seeds premium for.**
 *
 * That is the finding, not a footnote. The beat and the finale rendered from a `useState` inside Today,
 * set only by `confirmPayoff`, reached only from `PayoffInvitationCard`, offered only from
 * `selectProvisionalPayoffs` — which returns `[]` when `subscriptionPlan !== 'premium'`. Every case in
 * this file seeds premium, so the suite that exists to cover the celebration could not see that the
 * majority tier never reached it. **A free user could pay off every debt they owned and see nothing.**
 *
 * ⚠️ The premium line is NOT moved by these tests, and `selectProvisionalPayoffs` is deliberately still
 * `[]` here — a free user gets no "we noticed you paid this off" invitation, because that removes WORK
 * and is what premium buys. They reach $0 the way they always did: by saying so.
 */
/**
 * ⛔ Seed ONCE, not on every navigation — and this is a real trap, not test plumbing.
 *
 * `seedStore` uses `addInitScript`, which re-runs on **every page load**, so a `goto` after a mutation
 * silently rewrites the original blob over what the user just did. The first draft of these tests logged
 * a payment, navigated to Today, and found the debt un-paid and `pendingPayoff` gone — which reads exactly
 * like a broken feature. `coach-marks.spec.ts` already carries a comment about the same mechanism
 * *("would restore `coachMarksSeen`, silently undoing the reset this test exists to test")*.
 *
 * ⚠️ Guarding on absence is also what makes the reload assertion below mean anything: the app's own
 * persisted state has to survive the reload for "the moment outlives the screen" to be a real claim.
 */
async function seedOnce(page: import('@playwright/test').Page, store: Record<string, unknown>) {
  await page.addInitScript(
    (arg) => {
      if (window.localStorage.getItem(arg.key) === null) window.localStorage.setItem(arg.key, arg.blob);
    },
    { key: 'debtPlanner.rnStore', blob: JSON.stringify(store) },
  );
}

const FREE = (debts: any[]) =>
  scenario({
    subscriptionPlan: 'free',
    genuineCycleCount: 6,
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
    debts,
    // ⚠️ Coach marks seeded as seen. The `payoff-schedule` mark renders over the debt sheet's footer and
    // its "Got it" intercepts the pointer — so without this the spec fails on the coach mark rather than
    // on the thing it is testing, which is the most expensive kind of red.
    prefs: {
      onboardingComplete: true,
      coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'],
    },
    onboardedAt: '2026-01-01',
  });

/**
 * Clear a debt by LOGGING THE FINAL PAYMENT — the path a free user actually has.
 *
 * ⚠️ Not by editing the balance to 0: `DebtSheet` refuses that with *"Minimum payment can't exceed the
 * balance"*, which is true of every debt at the moment it is paid off. "Log a payment" is the affordance
 * the app intends for this, and it says so itself — *"More than the balance — this will clear it to $0."*
 */
async function clearDebtByPaying(page: import('@playwright/test').Page, name: string) {
  await page.goto('/money');
  await page.getByText(name, { exact: true }).first().click();
  await expect(page.getByText('Edit debt')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('debt-log-payment').click();
  await expect(page.getByText('Amount paid')).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Amount paid').fill('99999');
  await page.getByRole('button', { name: 'Log payment' }).click();

  // ⛔ Wait for the SAVE, not for a duration. `page.goto` is a full reload, and the store's autosave is
  // debounced 500 ms — so navigating straight away re-hydrates the pre-payment blob and the moment is
  // gone. Polling the persisted state is the signal the app actually emits; a `waitForTimeout` here would
  // pass on a fast machine and read as flake on a loaded one.
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
      const parsed = raw ? (JSON.parse(raw) as { debts?: { name: string; balance: number }[] }) : null;
      return parsed?.debts?.find((d) => d.name === name)?.balance;
    }, { timeout: 10_000 })
    .toBe(0);
}

test('a FREE user who clears one debt gets the beat', async ({ page }) => {
  await seedOnce(page, FREE([
    { id: 'card', name: 'Chase Freedom', balance: 40, originalBalance: 4200, minimumPayment: 300, apr: 0, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-05-01' },
    { id: 'car', name: 'Auto Loan', balance: 9800, originalBalance: 12000, minimumPayment: 310, apr: 6.4, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ]));

  // ⛔ The control case FIRST: no invitation is offered, because the premium estimator is still premium.
  // Without this the test could pass by having quietly made a paid feature free.
  await page.goto('/');
  await expect(page.getByText('Today', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /Confirm.*paid off/i })).toHaveCount(0);

  await clearDebtByPaying(page, 'Chase Freedom');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Keep going' })).toBeVisible({ timeout: 10_000 });
});

test('a FREE user who clears their LAST debt gets the finale', async ({ page }) => {
  await seedOnce(page, FREE([
    { id: 'card', name: 'Chase Freedom', balance: 40, originalBalance: 4200, minimumPayment: 300, apr: 0, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-05-01' },
  ]));

  await clearDebtByPaying(page, 'Chase Freedom');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({ timeout: 10_000 });
});

/**
 * ⚠️ And the moment SURVIVES a reload, which the `useState` it replaced could not.
 * A payoff confirmed seconds before the app is backgrounded used to die with the screen.
 */
test('the celebration survives a reload, and is cleared once acknowledged', async ({ page }) => {
  await seedOnce(page, FREE([
    { id: 'card', name: 'Chase Freedom', balance: 40, originalBalance: 4200, minimumPayment: 300, apr: 0, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-05-01' },
    { id: 'car', name: 'Auto Loan', balance: 9800, originalBalance: 12000, minimumPayment: 310, apr: 6.4, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ]));

  await clearDebtByPaying(page, 'Chase Freedom');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Keep going' })).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByRole('button', { name: 'Keep going' })).toBeVisible({ timeout: 10_000 });

  // Acknowledged → gone, and it stays gone. A once-ever moment that reappears is not a celebration.
  await page.getByRole('button', { name: 'Keep going' }).click();
  await expect(page.getByRole('button', { name: 'Keep going' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Today', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Keep going' })).toHaveCount(0);
});
