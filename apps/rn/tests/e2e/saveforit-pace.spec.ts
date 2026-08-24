import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * P6.8.9.7.2 [B1] — **the last unconverted money field, and it had no test of any kind.**
 *
 * ⛔ B1's sweep converted 23 call sites across 11 files to `parseAmountField`. `SaveForItSheet` was not one
 * of them, so it kept the exact expression B1 exists to delete — `Number(raw) > 0` — through a 117-finding
 * audit gate, a 13-lens sweep, six refuters, and B1's own closure. **The independent verification pass
 * found it; nothing in the suite could have.**
 *
 * ⚠️ **The site failed in BOTH directions, and the finding named only one.**
 *   `Number("Infinity") > 0` is `true`  → an infinite pace is COMMITTED, and `JSON.stringify` writes `null`.
 *   `Number("1,200")`      is `NaN`     → a grouped number is REFUSED, though every other money field in
 *                                          the app accepts it and `data/migrations.ts` repairs stored
 *                                          values on exactly that reading.
 * So this spec drives both, and the second half is the one no lens asked for.
 *
 * ⛔ **THE ASSERTION IS ON THE PERSISTED STORE, NOT ON THE SCREEN** — the same reasoning as
 * `absorb-entry.spec.ts`. A spec that only proved "the field refuses to submit" would pass against a
 * version that committed `Infinity` and merely failed to re-render, which is the shape of the defect.
 *
 * ⚠️ `affordability.spec.ts` states this sheet "can't be reliably queried" by RN-web Playwright. That was a
 * Phase-4 claim and it is **stale**: the P6.8 matrix drives `FormSheet` modals by testID (`debt-log-payment`
 * among them), and so does this file. Verified rather than inherited.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

/** Premium, comfortable, and onboarded — the tier and state in which the Save-for-it path is offered. */
const PREMIUM = () =>
  scenario({
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    paycheck: { amount: '4000', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(28) },
    prefs: {
      onboardingComplete: true,
      guardianIntroSeen: true,
      coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'],
    },
  });

/**
 * ⚠️ `priorityPerPaycheck` is the STORED field. The component's local is called `pace`, and asserting on
 * that name is how the first cut of this spec failed — a proxy for the subject, in the plainest form: the
 * variable the code reads is not the key the store writes.
 */
async function goals(page: import('@playwright/test').Page) {
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
  return raw
    ? ((JSON.parse(raw) as { goals?: { priorityPerPaycheck?: number; targetAmount?: number }[] }).goals ?? [])
    : [];
}

/** Open the affordability read → Save for it → Set your own, and land on the pace field. */
async function openCustomPace(page: import('@playwright/test').Page) {
  await seedStore(page, PREMIUM());
  await page.goto('/');
  await page.getByPlaceholder('e.g. 400').fill('5000');
  await page.getByRole('button', { name: 'Save for it →' }).click({ timeout: 15_000 });
  await page.getByText('Set your own', { exact: true }).click({ timeout: 15_000 });
  const field = page.getByTestId('saveforit-custom-per');
  await expect(field).toBeVisible({ timeout: 15_000 });
  return field;
}

test('B1 — an infinite pace is REFUSED and no goal is written', async ({ page }) => {
  const field = await openCustomPace(page);

  // ⛔ The control. A "no goal was added" assertion is true of a page that never opened the sheet, so the
  // starting count is asserted explicitly and the field above is proven visible first.
  expect(await goals(page)).toHaveLength(0);

  await field.fill('Infinity');
  await page.getByRole('button', { name: 'Start saving' }).click();

  // Autosave is debounced 500 ms, so a bare read races the write. Poll, then assert the store never grew.
  await page.waitForTimeout(1_500);
  const after = await goals(page);
  expect(after).toHaveLength(0);
});

test('B1 — a GROUPED amount is accepted and reaches the store as a finite pace', async ({ page }) => {
  const field = await openCustomPace(page);
  expect(await goals(page)).toHaveLength(0);

  await field.fill('1,200');
  await page.getByRole('button', { name: 'Start saving' }).click();

  await expect.poll(async () => (await goals(page)).length, { timeout: 15_000 }).toBe(1);

  const [goal] = await goals(page);
  // ⚠️ Assert the VALUE, not merely that a goal exists: `Number("1,200")` is `NaN`, and a goal written with
  // a `NaN` pace serialises to `null` — which is still a goal, and would satisfy a length check.
  expect(goal.priorityPerPaycheck).toBe(1200);
  expect(Number.isFinite(goal.priorityPerPaycheck)).toBe(true);
});
