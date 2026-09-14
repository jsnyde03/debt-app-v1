import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * 3.4.2.3 — the premium Cash Runway ("Cushion by paycheck") gains drag-select: sweeping a finger across the
 * chart moves the selected cycle continuously, and the detail receipt below follows (it IS the readout).
 */

test.use({ viewport: { width: 402, height: 874 } });

const PLAN = scenario({
  cushionFloor: 400,
  paycheck: { amount: '1650', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ],
  prefs: { onboardingComplete: true },
});

for (const theme of ['light', 'dark'] as const) {
  test(`§3.4.2.3 Cash Runway drag-select moves the selection (${theme})`, async ({ page }) => {
    await seedStore(page, { ...PLAN, prefs: { ...(PLAN.prefs as object), themeMode: theme } });
    await page.goto('/cushion-forecast');

    const eyebrow = page.getByText('CUSHION BY PAYCHECK', { exact: true });
    await expect(eyebrow).toBeVisible();
    await page.waitForTimeout(2000); // CanvasKit lazy-load

    // No under-the-line cycle here → the selection defaults to cycle 0, whose receipt reads "This paycheck".
    await expect(page.getByText('This paycheck')).toBeVisible();

    // Sweep to the far right → the selection follows off cycle 0, so its receipt header changes.
    const box = await eyebrow.boundingBox();
    if (!box) throw new Error('no runway box');
    const cy = box.y + 70;
    await page.mouse.move(box.x + 30, cy);
    await page.mouse.down();
    await page.mouse.move(box.x + 320, cy, { steps: 14 });
    await page.waitForTimeout(200);
    await page.mouse.up();

    await expect(page.getByText('This paycheck')).toHaveCount(0);
    // The receipt still reconciles (it's the readout) — its bottom line is always present.
    await expect(page.getByText('Left after essentials')).toBeVisible();
  });
}

/**
 * ⛔ **[.5.7.4b.2] — "I'M SETTING ASIDE $X FROM THIS PAYCHECK" STATES WHAT THE PLAN HOLDS.**
 *
 * The line printed the water-fill's REQUEST, and `allocatePaycheck` funds that only after the cushion and the expense
 * reserve. Figures measured through the app's own hydration on this seed (`scenario` → `runMigrations` → selectors):
 * the forecast asks for $1,100; the plan holds $900 after the $200 cushion, and $500 with $400 already reserved.
 * Every date is `day()`-relative, so the crunch sits in the next cycle whatever the run date.
 */
const CRUNCH = (over: Record<string, unknown> = {}) =>
  scenario({
    debts: [],
    paycheck: { amount: '2000', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
    requiredExpenses: [
      { id: 'rent', name: 'rent', amount: 900, dueDate: day(10), recurrence: 'monthly', category: 'housing' },
      { id: 'big', name: 'big', amount: 1800, dueDate: day(45), recurrence: 'monthly', category: 'housing' },
    ],
    ...over,
  });

/** Land on the runway and wait for the chart itself, so an absence below can never pass on an empty page. */
async function openRunway(page: import('@playwright/test').Page) {
  await page.goto('/cushion-forecast');
  await expect(page.getByText('CUSHION BY PAYCHECK', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2000); // CanvasKit lazy-load, as above
  return page.getByText(/from this paycheck for a tight cycle ahead/);
}

test('.5.7 — the runway says it is setting aside what the plan holds, not what the forecast asked for', async ({ page }) => {
  await seedStore(page, CRUNCH());
  const line = await openRunway(page);
  await expect(line).toContainText('$900');
  await expect(line).not.toContainText('$1,100');
});

test('.5.7 — with a reserve already held, the runway names only what is left for the crunch', async ({ page }) => {
  await seedStore(page, CRUNCH({ expenseReserve: { balance: 0, contribution: { forCycle: day(31), amount: 400 } } }));
  const line = await openRunway(page);
  await expect(line).toContainText('$500');
  await expect(line).not.toContainText('$1,100');
});

test('.5.7 control — a paycheck with room for the crunch shows no hold line', async ({ page }) => {
  await seedStore(page, CRUNCH({ paycheck: { amount: '3000', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) } }));
  const line = await openRunway(page);
  await expect(line).toHaveCount(0);
});

/**
 * [T5.3 · L1-13] The Guardian scorecard's DAY-ONE state — the branch every new user is in, and it had
 * ZERO e2e coverage. That gap was surfaced by T4.3 (which renamed "floor" to "line" here, unverified) and
 * filed to T9; T5.3 then renamed the claim itself, so deferring again would ship a SECOND unverified
 * rename on the one state everybody starts in. `scenario()` seeds no calibration history, so
 * `score.proven` is false and this is the branch that renders.
 */
test('the scorecard claims no record it has not earned [L1-13]', async ({ page }) => {
  await seedStore(page, PLAN);
  await page.goto('/cushion-forecast');

  await expect(page.getByText('GUARDIAN ACCURACY')).toBeVisible();

  // ⛔ The retired claim: "Protected since day one" / "protected from the start" asserted a RECORD under
  // an ACCURACY heading, with n = 0 measurements — while this same component names the failure direction
  // out loud once proven ("Under-warned — said you'd hold, you dipped below").
  await expect(page.getByText(/Protected since day one/)).toHaveCount(0);
  await expect(page.getByText(/protected from the start/)).toHaveCount(0);

  // What IS true from day one is the ACTION — the floor auto-protect is confidence-independent.
  await expect(page.getByText('Reserved since day one')).toBeVisible();
  await expect(page.getByText(/set your line aside on every paycheck since the first one/)).toBeVisible();
  // …and the record stays honestly unearned.
  await expect(page.getByText(/track record once I.ve seen a few more paychecks/)).toBeVisible();
});

/**
 * ⛔ **S1.13.7.12.6.5.4b [pass-7 `C3-11`] — AN UNREAD MINIMUM MAY NOT DRAW A CALMER RUNWAY.**
 *
 * The screen computed its runway off the projected plan and asked no trust question: a minimum payment the app
 * could not read repairs to `0`, the obligation leaves the plan, and the chart showed a cushion comfortably
 * above the line where the true plan dips below it. It asks `'solved-projection'` now.
 *
 * ⭐ **Asserted in both directions.** The first test is the finding; the second is the over-suppression a
 * wide claim would commit — a paycheck figure nothing that solves the plan reads must leave the runway drawn.
 * ⚠️ The scorecard is stored history and must survive the refusal.
 */
const UNREAD_BASE = {
  cushionFloor: 400,
  paycheck: { amount: '1650', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: day(10), type: 'debt', recurrence: 'monthly' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: day(20), type: 'debt', recurrence: 'monthly' },
  ],
  prefs: { onboardingComplete: true },
};

test('C3-11 · an unread minimum withholds the runway and keeps the scorecard', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      ...UNREAD_BASE,
      // `minimumPayment: ''` on Visa is the one unreadable field.
      debts: [{ ...UNREAD_BASE.debts[0], minimumPayment: '' }, UNREAD_BASE.debts[1]],
    }),
  );
  await page.goto('/cushion-forecast');

  // The positive assertion first — a page that never rendered satisfies every negative one below.
  await expect(page.getByTestId('cushion-forecast-unread')).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId('cushion-forecast-unread'),
    'the instruction names the figure to set, not a position on another screen',
  ).toContainText('minimum payment on Visa');
  await expect(
    page.getByText('CUSHION BY PAYCHECK', { exact: true }),
    'a runway solved from a minimum the app could not read is the claim this screen exists to make',
  ).toHaveCount(0);
  await expect(page.getByText('GUARDIAN ACCURACY'), 'the scorecard is stored history, not a projection').toBeVisible();
});

test('C3-11 · a lost typical paycheck keeps the runway drawn', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      ...UNREAD_BASE,
      // Nothing that solves the plan reads `typicalAmount` — measured across eight plan shapes.
      paycheck: { ...UNREAD_BASE.paycheck, typicalAmount: 'abc' },
    }),
  );
  await page.goto('/cushion-forecast');

  await expect(
    page.getByText('CUSHION BY PAYCHECK', { exact: true }),
    'a paycheck figure the plan never reads says nothing about the runway — withholding it is over-suppression',
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('cushion-forecast-unread')).toHaveCount(0);
});
