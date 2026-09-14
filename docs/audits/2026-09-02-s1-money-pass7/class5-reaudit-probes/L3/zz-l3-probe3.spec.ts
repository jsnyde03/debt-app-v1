import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * L3 render probe 3 — the whole Progress screen on `C3-9`'s own store (one debt, `apr: ''`, balances readable) beside the
 * readable twin. MEASURES, does not judge: waits for the hero, then logs the screen's text, so the same file shows what the
 * payoff family (trajectory, interest saved, what-if) renders with the `view` gag in place and with it planted out.
 */
const log = (tag: string, v: unknown) => console.log(`L3PROBE ${tag} :: ${JSON.stringify(v)}`);

const STORE = (apr: number | string) =>
  scenario({
    genuineCycleCount: 6,
    debts: [{ id: 'd1', name: 'Chase card', balance: 4000, originalBalance: 6000, minimumPayment: 120, apr, dueDate: day(3), type: 'debt', recurrence: 'monthly' }],
    prefs: { onboardingComplete: true, coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] },
  });

for (const apr of ['', 19] as const) {
  test(`L3 P5 progress screen · apr=${apr === '' ? 'unread' : apr}`, async ({ page }) => {
    await seedStore(page, STORE(apr));
    await page.goto('/progress');
    await expect(page.getByTestId('progress-hero-journey')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2500); // CanvasKit lazy-load for the charts
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    log(`P5 apr=${apr} hero-date`, await page.getByTestId('progress-hero-date').innerText());
    log(`P5 apr=${apr} projected phrases`, text.match(/(debt-free[^.·|]{0,40}|interest[^.·|]{0,40}|\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{4})/gi));
    log(`P5 apr=${apr} screen text`, text.slice(0, 1800));
  });
}
