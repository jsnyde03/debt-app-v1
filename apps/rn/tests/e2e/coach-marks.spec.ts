import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.5.5.3 — a coach-mark is offered once EVER, and More can re-offer them.
 *
 * The unit test pins the store's refusals; what only an e2e can show is that the record survives a
 * RELAUNCH and that the More row actually brings the marks back. Both failures are silent in opposite
 * directions: a mark that returns every launch trains the user to dismiss without reading, and a replay
 * entry that no-ops leaves the discovery layer a one-shot lost to a mis-tap.
 */
test.describe('coach-marks — offered once, and re-offerable', () => {
  test.use({ viewport: { width: 440, height: 956 } });

  const MARK = 'See the whole payoff';

  async function openDebt(page: import('@playwright/test').Page) {
    await page.goto('/money');
    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();
  }

  /**
   * ⚠️ A relaunch is expressed by SEEDING the seen state, not by `page.reload()`. `seedStore` installs an
   * init script, which Playwright re-runs on every navigation — so a reload restores the original blob
   * and would test the harness rather than the app. Seeding `coachMarksSeen` is what the app actually
   * meets on a cold start, which is the case the pref exists for.
   *
   * The offer is also deliberately never dismissed via "Got it": the record is written on OFFER, and on
   * the web that button is not clickable anyway — RN-web lays the sheet out in normal document flow, so
   * the callout lands ~1590px down a 956px viewport and Playwright cannot scroll an absolutely-positioned
   * layer into view. Same flow-layout artifact `payoff-schedule.spec.ts` documents, not a reachability
   * defect; the both-theme screenshots show the card correctly placed, and the dismiss is device-lane.
   */
  test('an unseen mark is offered', async ({ page }) => {
    await seedStore(page, scenario());
    await openDebt(page);
    await expect(page.getByText(MARK)).toBeVisible();
  });

  test('a mark already recorded as seen is NOT offered again on a cold start', async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: true, coachMarksSeen: ['payoff-schedule'] } }));
    await openDebt(page);
    // The sheet is up — so this is "the mark stayed away", not "the screen never rendered".
    await expect(page.getByTestId('debt-view-schedule')).toBeVisible();
    await expect(page.getByText(MARK)).toHaveCount(0);
  });

  test('More → Show feature tips again brings a seen mark back', async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: true, coachMarksSeen: ['payoff-schedule'] } }));

    // Reach More from Money so there is history to come back through. ⚠️ Every `page.goto` re-runs the
    // seed init script and would restore `coachMarksSeen`, silently undoing the reset this test exists to
    // prove — so after the reset all navigation is client-side.
    await page.goto('/money');
    await page.getByRole('button', { name: 'More' }).first().click();
    await page.getByText('Show feature tips again').click();
    await expect(page.getByText('Tips will appear again as you go.')).toBeVisible();

    await page.goBack();
    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();
    await expect(page.getByText(MARK)).toBeVisible();
  });

  test('the marked control stays live — a hint is not a modal', async ({ page }) => {
    await seedStore(page, scenario());
    await openDebt(page);
    await expect(page.getByText(MARK)).toBeVisible();

    // Ignoring the hint and using the thing it names is a success, not a dismissal.
    await page.getByTestId('debt-view-schedule').click();
    await expect(page).toHaveURL(/\/schedule\/d0/);
  });
});
