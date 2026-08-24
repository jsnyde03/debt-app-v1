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
   * the callout lands far below the fold and Playwright cannot scroll an absolutely-positioned layer into
   * view. Same flow-layout artifact `payoff-schedule.spec.ts` documents, not a reachability defect.
   *
   * ⚠️ **Measured 2026-08-10 (3.5.6.2): the callout lands at y≈1266 in an 874pt viewport** — 392pt below
   * the fold, in both themes. So WHERE this mark sits is a question web cannot answer at all, and it is
   * device-owed; frames are pinned at `apps/rn/capture-ref/phase35/<theme>/coach-payoff-schedule.png`.
   *
   * That is also why `toBeVisible()` cannot carry this test: RN-web satisfies it with a node anywhere in
   * the document, off-screen included. The assertions below say what web genuinely proves — exactly ONE
   * callout, and it is the Modal's own copy, which is precisely what 3.5.5.5 built. Both were checked by
   * deleting `<CoachMarkLayer nested />` and confirming this test goes red.
   */
  test("an unseen mark is offered — exactly one, from the sheet's own host", async ({ page }) => {
    await seedStore(page, scenario());
    await openDebt(page);
    await expect(page.getByText(MARK)).toBeVisible();

    // ONE. The root layer stands down when a nested host announces itself (3.5.5.5); two callouts is not
    // a double drawing but a hint met twice by a screen reader, since the root copy stays a live `alert`.
    // Counted explicitly — the old text lookup only got this by accident, via strict-mode ambiguity.
    await expect(page.getByTestId('coach-mark')).toHaveCount(1);

    // …and it is the MODAL's copy, not the app root's — the assertion that would have failed had the
    // nested host never been built, which is the defect 3.5.5.5 exists to fix.
    //
    // ⚠️ "Inside the sheet" is the wrong containment question and this test asserted it first: the nested
    // layer is a SIBLING of the sheet inside the Modal's gesture root, deliberately, so a subject's window
    // coordinates and the callout's frame share one space. Asserting the intuitive nesting failed against
    // correct code — the structure has to be read, not assumed.
    await expect(page.getByTestId('sheet-modal-root').getByTestId('coach-mark')).toHaveCount(1);
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

/**
 * P6.8.7f.3 (V2-6) — the above-branch's ONE guarantee, held by a measurement instead of a constant.
 *
 * `CoachMarkLayer`'s docstring states it outright: *"a callout that covers it explains something the user
 * can no longer see."* The above-branch honoured that with a hardcoded offset, and at the app's default
 * width the body wraps to two lines, the callout grows past the constant, and its bottom edge lands inside
 * the trajectory card it is pointing at. The offset is now the measured height — and a measurement is only
 * worth having if something re-checks it, because the next edit to the copy changes the wrap again.
 *
 * ⚠️ Web CAN answer this one. The nested-in-a-sheet case genuinely cannot be positioned here — RN-web lays
 * a Modal's contents out in document flow, which is why the tests above assert count and ownership rather
 * than place — but the Progress mark is ROOT-mounted and absolutely positioned, and the audit measured the
 * overlap from exactly this harness.
 */
test.describe('coach-marks — the callout does not cover its own subject', () => {
  test.use({ viewport: { width: 402, height: 874 } });

  test('the trajectory hint clears the chart it explains, at the default phone width', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/progress');

    const callout = page.getByTestId('coach-mark');
    await expect(callout).toBeVisible();
    // ⛔ The SUBJECT's own wrapper, and nothing inside it. `PAYOFF TRAJECTORY` looks like the same
    // assertion and is not: the heading is inset by the card's padding, so a callout sitting 12 px INSIDE
    // the card still clears the text, and a check against it passes with the defect present. The rect this
    // compares against has to be the rect `CoachMarkLayer` itself measured.
    const subject = page.getByTestId('tutorial-target-trajectory-scrub');
    await expect(subject).toBeVisible();

    const calloutBox = await callout.boundingBox();
    const subjectBox = await subject.boundingBox();
    expect(calloutBox).not.toBeNull();
    expect(subjectBox).not.toBeNull();

    expect(calloutBox!.y + calloutBox!.height).toBeLessThanOrEqual(subjectBox!.y);
  });
});
