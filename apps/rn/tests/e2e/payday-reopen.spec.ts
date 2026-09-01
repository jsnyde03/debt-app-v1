import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * P6.8.7e.3 [C2 / M2-2] — **the way back into payday capture, which did not exist.**
 *
 * ⛔ `usePaydayCapture.open()` had **no caller anywhere** — not in this app, and not in v1.6, whose own
 * comment reads *"Manually open the sheet (e.g. from that affordance)"* for an affordance neither codebase
 * ever built. A two-generation omission on the app's central recurring moment.
 *
 * ⚠️ **The two dismiss doors are not symmetric, and only one is fatal.** `close()` (backdrop / X / swipe)
 * sets component state and comes back on the next launch. `dismiss()` — wired *only* to the low-emphasis
 * **"Skip this payday"** text button — persists `lastHandledPaydayDate`, and `shouldPromptPaydayCapture`
 * short-circuits on it forever. So one tap permanently forfeited that cycle's reconciliation, and rolling
 * forward afterwards applies the plan *as planned* — `cycleHistory` carries a plan-shaped cycle instead of
 * a real one, silently.
 *
 * These specs drive the FATAL door on purpose. A spec that closed the sheet with the backdrop would prove
 * nothing: that path was always recoverable.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

/** ⛔ Seed once — `seedStore`'s init script re-runs on every navigation and would restore the un-skipped
 *  state, so the skip this spec exists to test would be silently undone. */
async function seedOnce(page: import('@playwright/test').Page, store: Record<string, unknown>) {
  await page.addInitScript(
    (arg) => {
      if (window.localStorage.getItem(arg.key) === null) window.localStorage.setItem(arg.key, arg.blob);
    },
    { key: KEY, blob: JSON.stringify(store) },
  );
}

const PAYDAY_TODAY = () =>
  scenario({
    genuineCycleCount: 6,
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(0) },
    lastHandledPaydayDate: null,
    onboardedAt: '2026-01-01',
    prefs: {
      onboardingComplete: true,
      coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'],
    },
  });

test('"Skip this payday" is recoverable — the capture sheet can be re-opened', async ({ page }) => {
  await seedOnce(page, PAYDAY_TODAY());
  await page.goto('/');

  // The sheet auto-opens. Waiting on it is also the both-branches marker for everything below.
  const sheetMarker = page.getByTestId('payday-surprise-amount');
  await expect(sheetMarker).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Skip this payday' }).click();
  await expect(sheetMarker).toBeHidden();

  // ⛔ The skip really was the FATAL door — `lastHandledPaydayDate` is now stamped, which is what used to
  // make this permanent. Asserting it is what stops this spec from passing against the recoverable
  // backdrop path by accident.
  await expect
    .poll(async () => {
      const raw = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
      return raw ? (JSON.parse(raw) as { lastHandledPaydayDate?: string | null }).lastHandledPaydayDate : null;
    }, { timeout: 15_000 })
    .not.toBeNull();

  // The way back in — and it survives a cold start, because the door it reopens is a persisted one.
  await expect(page.getByTestId('payday-reopen')).toBeVisible();
  await page.getByTestId('payday-reopen').click();
  await expect(sheetMarker).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('payday-reopen')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('payday-reopen').click();
  await expect(sheetMarker).toBeVisible();
});

/**
 * ⚠️ And re-opening is not decorative: capturing from the second visit records the cycle for real.
 * The whole harm of C2 was that the reconciliation was forfeited, so the assertion is on the record.
 */
test('capturing after a re-open records the cycle that was skipped', async ({ page }) => {
  await seedOnce(page, PAYDAY_TODAY());
  await page.goto('/');

  await expect(page.getByTestId('payday-surprise-amount')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Skip this payday' }).click();
  await expect(page.getByTestId('payday-reopen')).toBeVisible({ timeout: 15_000 });

  await page.getByTestId('payday-reopen').click();
  await page.getByTestId('payday-surprise-amount').fill('75');
  await page.getByRole('button', { name: /You followed the plan|Confirm what you paid/ }).click();

  // The surprise reached the engine from the re-opened sheet — so the second visit is a real capture,
  // not a cosmetic re-render of a sheet that no longer does anything.
  await expect
    .poll(async () => {
      const raw = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
      return raw ? (JSON.parse(raw) as { surpriseOutflowLog?: unknown[] }).surpriseOutflowLog?.length ?? 0 : 0;
    }, { timeout: 15_000 })
    .toBe(1);
});

/**
 * ⚠️ The card is reached from BOTH doors, and `completeCapture` / `dismiss` are indistinguishable
 * afterwards — both merely stamp `lastHandledPaydayDate`. So it must not claim a payday was logged.
 */
test('the rollover card does not claim a payday was logged after a skip', async ({ page }) => {
  await seedOnce(page, PAYDAY_TODAY());
  await page.goto('/');

  await expect(page.getByTestId('payday-surprise-amount')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Skip this payday' }).click();

  // ⛔ Anchored on the card's OWN control, not on `payday-reopen`. The first draft used the re-open button
  // as its marker — so removing that button turned this test red too, and it would have reported a copy
  // regression that had not happened. A marker must survive the change the test is not about.
  await expect(page.getByRole('button', { name: 'Start next pay cycle' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Payday logged', { exact: false })).toHaveCount(0);
});
