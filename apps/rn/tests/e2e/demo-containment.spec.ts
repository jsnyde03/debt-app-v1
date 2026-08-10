import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.5.4.1 — the demo seam, and [D18]'s containment, asserted where it is real.
 *
 * Three things are being proven, and each one failed by construction before this step:
 *  1. A NOT-YET-ONBOARDED user can reach the demo. That audience is the whole reason the pre-purchase
 *     entry exists, and `Stack.Protected guard={onboardingComplete}` blocked exactly them. The legacy
 *     `demoSeed` got past it by writing `onboardingComplete: true` to the REAL store — the sin the
 *     sandbox exists to retire — so this also asserts the real store is NOT written.
 *  2. Every screen resolves to the sandbox, because the provider now sits above the navigator.
 *  3. The fences engage for a demo without either fence site naming one — the shared `inBoundedRun`
 *     predicate. This is where that predicate is proven: by the fences, not by reading the boolean back,
 *     which would be a test agreeing with itself.
 */

test.use({ viewport: { width: 402, height: 874 } });

/** A cold, pre-purchase user: nothing entered, onboarding not done — who the guard used to turn away. */
const NOT_ONBOARDED = scenario({
  debts: [],
  paycheck: { amount: '' },
  subscriptionPlan: 'free',
  prefs: { onboardingComplete: false },
});

/**
 * [D21] 3.5.9.2 — the DOORS, which nothing covered.
 *
 * Every other spec in this file navigates straight to `/demo`, so all of them kept passing while the app
 * offered no way to get there: [D19] pulled both entries and the suite did not notice for four days. A
 * destination with no tested door is the defect class this repo has now shipped three times.
 *
 * These two tests are the reason [D21] cannot be un-done silently. They fail if `isDemoReachable()` goes
 * back to riding `QA_TOOLS`, which is exactly what the Phase-6 flip would otherwise do to it.
 */
/**
 * Exactly ONE marker the user can SEE.
 *
 * ⚠️ Not a DOM count. Measured 2026-08-10: entering from the paywall leaves **2 marker nodes in the
 * document and 1 visible** — the route beneath is still mounted — where the other two doors leave 1 and 1.
 * A bare `toBeVisible()` therefore fails strict mode on that path only, and a `.first()` would have hidden
 * the difference instead of describing it. Visible-count is also the property §12.5 actually cares about:
 * the marker must appear in exactly one place on screen.
 *
 * ⏳ The invisible node is web layout, so whether a screen reader can still reach it is a DEVICE question
 * (an inactive RN stack screen is `display:none` on web, which does remove it from the a11y tree).
 */
async function visibleMarkers(page: import('@playwright/test').Page): Promise<number> {
  const all = page.getByTestId('example-canvas-marker');
  const n = await all.count();
  let seen = 0;
  for (let i = 0; i < n; i++) if (await all.nth(i).isVisible()) seen++;
  return seen;
}

test('the WELCOME door — a brand-new user can try the app before entering any data', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  await page.goto('/onboarding');

  // The whole point of [D21]: this is the only surface a cold user can reach, because the walkthrough is
  // withheld until `onboardingComplete`. If this button is gone, the app cannot be evaluated before it is
  // trusted with someone's real money.
  await page.getByText('See it in action').first().click();
  await expect(page).toHaveURL(/money/, { timeout: 15_000 });
  await expect.poll(() => visibleMarkers(page), { timeout: 15_000 }).toBe(1);
});

test('the PAYWALL door — "See it in action" reaches the demo', async ({ page }) => {
  await seedStore(page, scenario({ subscriptionPlan: 'free', prefs: { onboardingComplete: true } }));
  await page.goto('/paywall');

  await page.getByText('See it in action').click();
  await expect(page).toHaveURL(/money/, { timeout: 15_000 });
  await expect.poll(() => visibleMarkers(page), { timeout: 15_000 }).toBe(1);
});

test('a not-yet-onboarded user reaches the demo, and the SCRIPTED run is contained', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  // 3.5.10 — `?mode=scripted` explicitly: kiosk containment is a property of the RUN THAT DRIVES ITSELF,
  // not of the sandbox. A user now gets `explore` from `/demo`, which is deliberately navigable.
  await page.goto('/demo?mode=scripted');

  // 1 — admitted, and the DIRECTOR moved. [D19]'s arc opens on the problem, so a demo that lands on
  // Today and stays there means the script is not driving the camera. Asserted on the URL rather than on
  // content, because Money and Today share too much chrome for content alone to tell them apart.
  await expect(page).toHaveURL(/money/, { timeout: 15_000 });
  await expect(page.getByText('Set up your paycheck')).toHaveCount(0);

  // 2 — the real store is untouched. The demo must not buy its way past the route guard by writing
  // `onboardingComplete`, which is precisely how the legacy demo did it.
  const persisted = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
  expect(persisted).not.toBeNull();
  expect(JSON.parse(persisted!).prefs.onboardingComplete).toBe(false);

  // 3a — More is withheld. `/more` carries Reset, and this is a stranger evaluating the app.
  // `exact` because the Guardian card's own group label is a sentence that contains the word.
  const more = page.getByLabel('More', { exact: true });
  await expect(more).toBeDisabled();
  // Fenced in the a11y TREE too, not just for a finger — a VoiceOver double-tap dispatches straight to
  // the focused element and never goes through hit-testing, which is how this leaked for four rounds.
  await expect(more).toHaveAttribute('aria-hidden', 'true');

  // 3b — the tabs are not merely held, they are GONE. 3.5.4.10 hid the bar for a demo because the dock
  // sat over it and cut the labels in half, and hidden is the stronger guarantee: `holdTabs` still fences
  // the press (and is what the walkthrough relies on, where the bar stays visible by design), but a
  // control that isn't rendered cannot be tapped, mis-tapped, or photographed mid-capture.
  // `toBeHidden`, not `toHaveCount(0)`: `display: 'none'` is how RN hides a tab bar, and on web that
  // leaves the node in the DOM while removing it from layout, hit-testing and the a11y tree.
  await expect(page.getByTestId('tab-money')).toBeHidden();
  await expect(page.getByText('Payday Guardian')).toBeVisible();
});

/**
 * 3.5.10 — the EXPLORE run: every money fence intact, and the navigation fence deliberately open.
 *
 * This is the test the predicate split exists for. `useInBoundedRun` used to mean two things at once —
 * "sandbox money is on screen" AND "you may not navigate" — only because, until now, every bounded run
 * meant both. Explore breaks that coincidence, so this asserts the two halves SEPARATELY: the money half
 * still holds everywhere, and only the navigation half has moved.
 *
 * If someone later re-merges the predicates, this goes red and the kiosk test above stays green — which
 * is the pair that says which half broke.
 */
test('the EXPLORE run: the money is still fenced, the navigation is not', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  await page.goto('/demo');

  await expect(page.getByTestId('example-canvas-marker').first()).toBeVisible({ timeout: 15_000 });

  // The navigation half — OPEN. Tabs are rendered, and pressing one actually moves: `holdTabs` used to
  // preventDefault on every press, so "visible" alone would pass against a bar that does nothing.
  await expect(page.getByTestId('tab-money')).toBeVisible();
  await page.getByTestId('tab-progress').click();
  await expect(page).toHaveURL(/progress/, { timeout: 10_000 });

  // …and the marker followed. `Screen` renders it on every surface a sandbox can reach, which is what
  // makes a free-roaming demo honest: the disclosure cannot be left behind on the screen you started on.
  await expect(page.getByTestId('example-canvas-marker').first()).toBeVisible();

  // The money half — INTACT. More stays fenced even here: it carries Reset and preferences that write the
  // REAL store, so it is settings rather than part of the product story.
  //
  // ⚠️ EVERY match, not `.first()`. Navigating between tabs leaves the previous screen mounted, so there
  // are two More buttons in the document — and a fence that held on one of them and not the other is
  // exactly the "class closed at some of its members" defect this phase kept finding. Asserting the count
  // first means a future third mount cannot slip past a locator that only ever looked at one.
  const more = page.getByLabel('More', { exact: true });
  const moreCount = await more.count();
  expect(moreCount).toBeGreaterThan(0);
  for (let i = 0; i < moreCount; i++) {
    await expect(more.nth(i)).toBeDisabled();
    await expect(more.nth(i)).toHaveAttribute('aria-hidden', 'true');
  }

  // And the real plan is untouched — the sin the sandbox exists to retire.
  const persisted = await page.evaluate(() => window.localStorage.getItem('debtPlanner.rnStore'));
  expect(JSON.parse(persisted ?? '{}').prefs.onboardingComplete).toBe(false);
});

test('the EXPLORE run carries its own way out, on whatever screen you wandered to', async ({ page }) => {
  // The scripted run's dock holds its exits; explore has no dock. The exit rides the marker row, which
  // `Screen` already mounts everywhere — so this checks it on a screen the user NAVIGATED to, not the one
  // they landed on, because "there is an exit" is only true if it is true where they are.
  // ⚠️ Asserts AT LEAST ONE visible, not exactly one — and the difference is a web artifact, measured
  // 2026-08-10: after a tab switch the RN-web tab navigator leaves the previous screen mounted AND
  // painted, so two exits are visible in the document where a device renders only the focused tab. The
  // "exactly one on screen" claim is therefore device-owed (checklist §12.5 already asks it of the
  // marker); what web can prove is that the exit is present wherever the user navigated to.
  const exitsOnScreen = async () => {
    const all = page.getByTestId('demo-explore-exit');
    const n = await all.count();
    let seen = 0;
    for (let i = 0; i < n; i++) if (await all.nth(i).isVisible()) seen++;
    return seen;
  };

  await seedStore(page, NOT_ONBOARDED);
  await page.goto('/demo');
  await expect.poll(exitsOnScreen, { timeout: 15_000 }).toBeGreaterThan(0);

  await page.getByTestId('tab-progress').click();
  await expect(page).toHaveURL(/progress/, { timeout: 10_000 });
  await expect.poll(exitsOnScreen, { timeout: 10_000 }).toBeGreaterThan(0);

  // Terminal, like every other demo exit ([D18]): the session ends BEFORE the destination renders.
  await page.getByTestId('demo-explore-exit').first().click();
  await expect(page).toHaveURL(/onboarding/, { timeout: 10_000 });
  await expect(page.getByTestId('example-canvas-marker')).toHaveCount(0);
});

test('the canvas is marked as example money, above the scroll and in the a11y tree', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  await page.goto('/demo');

  const marker = page.getByTestId('example-canvas-marker');
  await expect(marker).toBeVisible({ timeout: 15_000 });

  // In the a11y tree as a HEADER, not decorative — the rotor is how a screen-reader user finds this
  // after arriving mid-screen, and it is the one thing that makes everything below it trustworthy.
  await expect(marker.locator('xpath=..')).toHaveAttribute('role', 'heading');

  // Above the scroller, so it cannot leave the screen. Asserted by POSITION, not visibility: a marker
  // inside the scroll body would still be "visible" after a modest scroll while having moved, and would
  // leave the screen exactly when the figures further down start to look alarming. Its box must not move.
  const before = await marker.boundingBox();
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(300);
  const after = await marker.boundingBox();
  expect(after?.y).toBe(before?.y);
});

test('both SCRIPTED exits are terminal — the demo is over before the destination renders', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  // 3.5.10 — the two exits tested here live in the DOCK, which is scripted-only. Explore carries a single
  // exit on the marker row ("Start my real plan"), asserted separately above: one clear way out is right
  // for a run whose job is "decide whether to trust this app", and premium is sold inside the real app
  // rather than from behind a sandbox.
  await page.goto('/demo?mode=scripted');
  await expect(page.getByTestId('example-canvas-marker')).toBeVisible({ timeout: 15_000 });

  // "Unlock Premium" is the exit that matters: /paywall writes the real store by design, so reaching it
  // with the sandbox still mounted would report a working checkout as a real-plan leak — at Phase 6, a
  // Sentry alert for a purchase. [D18]'s ordering is what prevents that.
  await page.getByText('Unlock Premium', { exact: true }).click();
  await expect(page).toHaveURL(/paywall/);

  // The demo is torn down, not merely navigated away from: no marker, and no dock.
  await expect(page.getByTestId('example-canvas-marker')).toHaveCount(0);

  // `replace`, not `push` — going back must not resurrect a torn-down run as a screen of sandbox figures
  // with no session behind it.
  await page.goBack();
  await expect(page.getByTestId('example-canvas-marker')).toHaveCount(0);
});

test('the walkthrough does not double the marker', async ({ page }) => {
  // A walkthrough renders sandbox money too, so a marker keyed on the MONEY would show alongside the
  // dock's own "Example money" line. Two disclosures is the chrome [D6] refused.
  await seedStore(page, scenario({ prefs: { onboardingComplete: true, tutorialSeen: false } }));
  await page.goto('/tutorial');

  await expect(page.getByTestId('tutorial-progress')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('example-canvas-marker')).toHaveCount(0);
});

/**
 * 3.5.8.2 — [D20a] the closing caption, asserted on the render that OWES it.
 *
 * The disclosure is owed by the App-Preview capture, and the capture is precisely the run that strips the
 * demo's chrome. So the assertion that matters is the ASYMMETRY: with `?capture=1` the dock is gone and
 * the caption is still there. Asserting it on a chromed run would have passed while the shipped video
 * carried no disclosure at all — the exact class of vacuous test this phase's audit gate kept finding.
 */
test('the closing caption survives capture mode, where the dock does not', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  await page.goto('/demo?capture=1');

  // The dock is withheld for the capture — this is the condition the caption must NOT share.
  await expect(page.getByText('Start my real plan')).toHaveCount(0);

  // Not a permanent banner: it belongs to the closing beat, so it must be absent on the opening one.
  await expect(page.getByTestId('demo-caption')).toHaveCount(0);

  // The final stage lands at 20s (`DEMO_STAGES`), so this waits out the real script rather than faking it
  // — the caption keys on the stage the capture will actually be recording.
  const caption = page.getByTestId('demo-caption');
  await expect(caption).toBeVisible({ timeout: 40_000 });

  // Apple requires the subscription disclosure, and it must name what was SHOWN. Both halves asserted:
  // the muted viewer's anchor line, and the disclosure itself.
  await expect(caption).toContainText('Debt-free, one paycheck at a time.');
  await expect(caption).toContainText('Cushion planning and Recovery require Premium.');
});

/**
 * 3.5.8.4 — the debt-free date must not move between the trajectory beat and the closing one.
 *
 * The 3.5.4.11 capture review saw it jump a YEAR on beat 5 only, and a date going visibly worse between
 * two consecutive shots is something a viewer registers in a video without being able to name it. One
 * cause was fixed there (the prime used to raise `minimumPayment`, so a bigger required obligation left
 * less to attack the other debts); `balanceAsOfDate` was left as an unproven suspect.
 *
 * ⚠️ Asserted through the REAL RENDER, deliberately. The headless version of this compared raw stores and
 * reported a five-month shift that no viewer can see — because Today renders its summary on
 * `withProjectedBalances(store, …)`, the projection that consumes the very `balanceAsOfDate` the prime
 * moves. The screens are the only place the property is true or false, and this is immune to which
 * projection each screen picks.
 */
test('the debt-free date holds between the trajectory beat and the closing one', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  await page.goto('/demo?capture=1');

  const MONTH_YEAR = /(?:January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d/g;
  const datesOnScreen = async () => [...new Set(((await page.locator('body').innerText()).match(MONTH_YEAR) ?? []))];

  // Beat 4 — Progress, at t=14s (`DEMO_STAGES`). Waiting out the real script rather than faking the
  // state, because the defect is a property of the sequence, not of either store alone.
  await page.waitForTimeout(15_500);
  const trajectory = await datesOnScreen();
  expect(trajectory.length).toBeGreaterThan(0);

  // Beat 5 — Today, primed for the payoff. The caption is the reliable signal that the stage has landed.
  await expect(page.getByTestId('demo-caption')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  const closing = await datesOnScreen();

  // Every date shown on the closing beat was already being shown on the trajectory beat. Set-based
  // rather than string-equal: the two screens legitimately show different NUMBERS of dates, and what
  // must not happen is a NEW one appearing.
  expect(closing).toEqual(trajectory);
});
