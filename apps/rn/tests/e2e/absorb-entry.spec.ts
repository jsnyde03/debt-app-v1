import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * P6.8.7e.2 [C1 / M2-6] — **the absorb path's first user entry point.**
 *
 * ⛔ The finding is not that absorb is wrong; the engine is correct and this item did not touch it. It is
 * that **nothing in the app could ever start it.** `index.tsx` called `capturePayday(items, decisions)`
 * with no actuals at all, so `surpriseOutflowLog` could only grow inside the tutorial sandbox and one test
 * scenario. R3 confirmed it: two safety-net acknowledgements Today is written to render, and
 * `LeanSuggestionCard`, were unreachable in production — **built features with no way in**.
 *
 * ⚠️ So the assertion that matters is on the STORE, not on the screen. A spec that only proved "the field
 * accepts a number" would pass just as happily against the version where the value went nowhere, which is
 * precisely the shape of the defect.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

/** A plan whose payday has landed today → the capture sheet auto-opens. */
const PAYDAY_TODAY = () =>
  scenario({
    genuineCycleCount: 6,
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(0) },
    lastHandledPaydayDate: null,
    onboardedAt: '2026-01-01',
    prefs: {
      onboardingComplete: true,
      guardianIntroSeen: true,
      coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'],
    },
  });

async function readStore(page: import('@playwright/test').Page) {
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
  return raw ? (JSON.parse(raw) as { surpriseOutflowLog?: { cycleEndDate: string; amount: number }[] }) : null;
}

test('a surprise expense logged at payday capture REACHES the absorb engine', async ({ page }) => {
  await seedStore(page, PAYDAY_TODAY());
  await page.goto('/');

  // The both-branches marker: the sheet is genuinely up before anything is filled or asserted.
  const field = page.getByTestId('payday-surprise-amount');
  await expect(field).toBeVisible({ timeout: 15_000 });

  // ⛔ The control: the log is empty first. A growth assertion against an already-populated log proves
  // nothing, and the seeded scenario has no surprises by construction.
  expect((await readStore(page))?.surpriseOutflowLog ?? []).toHaveLength(0);

  await field.fill('180');
  await page.getByRole('button', { name: /You followed the plan|Confirm what you paid/ }).click();

  await expect
    .poll(async () => (await readStore(page))?.surpriseOutflowLog?.length ?? 0, { timeout: 15_000 })
    .toBe(1);
  const logged = (await readStore(page))?.surpriseOutflowLog?.[0];
  expect(logged?.amount).toBe(180);
});

/**
 * ⚠️ And the ordinary payday must leave NO trace.
 *
 * Most cycles have no surprise, and the field is blank for all of them. Recording a zero-amount entry
 * would be a cycle event that did not happen — `computeReserveRelease` sums the log and the Guardian
 * reconciles against it, so a stream of empty surprises is not harmless noise, it is wrong input.
 */
test('a payday with nothing unexpected logs nothing at all', async ({ page }) => {
  await seedStore(page, PAYDAY_TODAY());
  await page.goto('/');

  await expect(page.getByTestId('payday-surprise-amount')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /You followed the plan|Confirm what you paid/ }).click();

  // Wait for the capture to actually land (the cycle is marked handled), THEN assert the absence — an
  // absence checked too early is satisfied by the capture not having happened yet.
  await expect
    .poll(async () => {
      const raw = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
      return raw ? (JSON.parse(raw) as { lastHandledPaydayDate?: string | null }).lastHandledPaydayDate : null;
    }, { timeout: 15_000 })
    .not.toBeNull();

  expect((await readStore(page))?.surpriseOutflowLog ?? []).toHaveLength(0);
});
