import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.5.1/3.5.2/3.5.3.1 — the tutorial's invitation, path, and in-situ shell.
 *
 * 3.5.3.1 changed the shape of all of this: the walkthrough is no longer a screen of its own, it's an
 * overlay on the REAL Today tab, with Today's own components re-rendered from a sandbox store. That was
 * forced — `useGoToTab` only behaves inside the tabs navigator, so hosting a copy of Today in a Stack
 * route would land as a detached tab group (a blank screen on device). `/tutorial` survives as the
 * launcher, so every entry point still has a stable URL to aim at.
 *
 * The load-bearing assertion here is the in-situ one: Today must render the SANDBOX's numbers while the
 * overlay is up. Today showing its own real data under a tutorial would mean the provider isn't taking
 * effect — and the beats would be teaching over the user's live money.
 */
test.use({ viewport: { width: 402, height: 874 } });

const newUser = (over: Record<string, unknown> = {}) =>
  scenario({ prefs: { onboardingComplete: true }, ...over });

test.describe('tutorial invitation + in-situ shell', () => {
  test('a new user is invited on Today, and it opens the walkthrough over Today', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/');

    await expect(page.getByTestId('tutorial-invite')).toBeVisible();
    await expect(page.getByText(/example numbers/)).toBeVisible();

    await page.getByText('Show me').click();

    // The launcher hands off to Today: the overlay is up, and we're on the tab — not a separate screen.
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    await expect(page).toHaveURL(/\/(\?|$)/);
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 1 of');
  });

  test('Today renders SANDBOX data while the overlay is up (the in-situ proof)', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');

    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    // The scenario's frozen clock is 2026-03-02 → its next payday is MAR 16. The real seeded store has
    // a live "today", so seeing the sandbox's payday on Today's hero proves the StoreProvider is what
    // Today is reading — not the user's real plan sitting underneath.
    await expect(page.getByText(/MAR 16/i)).toBeVisible();
  });

  test('the scrim blocks stray taps on a scripted beat', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');
    // Step 1 is scripted, so Today underneath must not be reachable — otherwise a user can wander into
    // a sheet or another tab and lose the thread mid-walkthrough.
    await expect(page.getByTestId('tutorial-scrim')).toBeVisible();
  });

  test('the web e2e completes EVERY beat end-to-end', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');

    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 1 of');
    const total = Number((await page.getByTestId('tutorial-progress').innerText()).match(/of (\d+)/)![1]);
    expect(total).toBeGreaterThan(0);

    for (let step = 1; step < total; step++) {
      await expect(page.getByTestId('tutorial-progress')).toContainText(`Step ${step} of ${total}`);
      await expect(page.getByTestId('tutorial-step-title')).not.toBeEmpty();
      // 3.5.3.2 — the marker is PERSISTENT, so it's asserted on every single beat rather than once at
      // the start. The entry copy scrolls away and later beats drive the card into tight/at-risk with
      // figures scaled from the user's own income; a marker that lapses on beat 5 fails exactly where
      // it's needed.
      await expect(page.getByTestId('guardian-example-marker')).toBeVisible();
      // 3.5.3.3.4.3 — and every beat must actually land on a subject. A beat whose target is missing
      // degrades to an uncut scrim, which looks like a broken spotlight rather than failing anywhere.
      await expect.poll(async () => ((await page.getByTestId('tutorial-spotlight').boundingBox())?.height ?? 0), { timeout: 5000 }).toBeGreaterThan(0);
      await page.getByText('Next', { exact: true }).click();
    }

    await expect(page.getByTestId('tutorial-progress')).toContainText(`Step ${total} of ${total}`);
    await expect(page.getByTestId('guardian-example-marker')).toBeVisible();
    await expect(page.getByText('Finish', { exact: true })).toBeVisible();
    await page.getByText('Finish', { exact: true }).click();

    // Finishing ends the session and hands Today back — overlay gone, and Today is showing the user's
    // REAL plan again rather than the sandbox's. The sandbox's payday is MAR 16 (frozen 2026-03-02), so
    // its absence is the proof the provider unwound; the Guardian card confirms Today still renders.
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText(/MAR 16/i)).toHaveCount(0);
    // ...and the marker leaves WITH the sandbox. A marker stranded on the user's own card would be the
    // mirror of the bug it exists to prevent: their real read dismissed as an example.
    await expect(page.getByTestId('guardian-example-marker')).toHaveCount(0);
  });

  test('a beat spotlights its subject, and the scrim cuts around it', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();

    // Beat 1's subject is the whole Guardian card; beat 2's is the cushion bar inside it. The ring
    // must therefore MOVE and SHRINK between them — a spotlight that never changes would pass a mere
    // "is it visible" assertion while pointing at the wrong thing all the way through.
    // Poll rather than snapshot: the ring is unmounted while the screen scrolls to the next subject
    // and remounted at the settled position, so a single read can land in the gap between the two.
    const ring = page.getByTestId('tutorial-spotlight');
    const ringHeight = async () => (await ring.boundingBox())?.height ?? 0;
    await expect.poll(ringHeight, { timeout: 5000 }).toBeGreaterThan(0);
    const cardHeight = await ringHeight();

    await page.getByText('Next', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 2 of');
    await expect.poll(ringHeight, { timeout: 5000 }).toBeGreaterThan(0);
    await expect.poll(ringHeight, { timeout: 5000 }).toBeLessThan(cardHeight);

    // The cut is the point of the cutout: the lit subject must NOT be under a scrim band.
    const bar = (await ring.boundingBox())!;
    const bands = await page.getByTestId('tutorial-scrim').locator('div').all();
    expect(bands.length).toBeGreaterThan(0);
    for (const band of bands) {
      const b = await band.boundingBox();
      if (!b) continue;
      const overlaps = b.x < bar.x + bar.width && b.x + b.width > bar.x && b.y < bar.y + bar.height && b.y + b.height > bar.y;
      expect(overlaps, 'no scrim band may cover the spotlit subject').toBeFalsy();
    }
  });

  test('the arc stages each beat\'s state, and steps back out of trouble', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();

    const clear = page.getByText('Looks clear this paycheck');
    const short = page.getByText(/won't cover everything/);
    await expect(clear).toBeVisible();

    // Step to the Recovery glimpse — the one beat that deliberately puts the card in trouble.
    for (let i = 0; i < 4; i++) await page.getByText('Next', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 5 of');
    await expect(short).toBeVisible();
    // The marker has to hold through the scary state — that is the entire reason it exists.
    await expect(page.getByTestId('guardian-example-marker')).toBeVisible();
    // 3.5.3.3.3.1 — and the beat's lesson must have something to demonstrate. With no deferrable bill
    // the card answered "Nothing here can safely wait" underneath copy about what can wait.
    await expect(page.getByText(/Nothing here can safely wait/)).toHaveCount(0);
    await expect(page.getByText(/Defer/)).toBeVisible();

    // …and the arc must climb back out, so nobody is handed their own money right after a red card.
    await page.getByText('Next', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 6 of');
    await expect(clear).toBeVisible();

    // Back re-stages rather than replaying forward: the shortfall returns exactly as it was.
    await page.getByText('Back', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 5 of');
    await expect(short).toBeVisible();
  });

  test('resuming onto a beat shows the same state as stepping onto it', async ({ page }) => {
    // Two doors into beat 5: `start` (interrupt-resume) and `goTo` (stepping). They were computing the
    // scenario separately, which is how two users end up looking at different cards on the same beat.
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium', tutorialStep: 4 } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 5 of');
    await expect(page.getByText(/won't cover everything/)).toBeVisible();
  });

  test('a harness-pinned state governs the whole run, not just the opening', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.addInitScript(() => {
      (window as unknown as { __debtSandboxHarness: { scenarioId: string } }).__debtSandboxHarness = { scenarioId: 'persona-at-risk' };
    });
    await page.goto('/tutorial');

    // Beat 1 declares `clear`. If the beat state won the argument, the pin would survive exactly one
    // render — and every screenshot script that asks for a state would quietly shoot the wrong one.
    await expect(page.getByText(/won't cover everything/)).toBeVisible();
    await page.getByText('Next', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 2 of');
    await expect(page.getByText(/won't cover everything/)).toBeVisible();
  });

  // NOTE (3.5.3.3.4.1): the per-beat screen-reader announcement is deliberately NOT asserted here.
  // `AccessibilityInfo.announceForAccessibility` is a documented no-op in react-native-web, so a web e2e
  // can never observe it — an assertion here would be theatre. The wiring is guarded in the app-layer
  // suite instead (`tutorialPath.test`), and the real behaviour is device-owed with the rest of the VO
  // pass in Phase 6.

  for (const tier of ['premium', 'free'] as const) {
    test(`beat 3 lets a ${tier} user move the real line, and the plan re-solves`, async ({ page }) => {
      // [D9] — a free-tier USER gets the same walkthrough, because the SANDBOX runs premium for every
      // audience. The earlier shape (sandbox mirrors the user's tier) gave a free user a line that did
      // nothing when dragged: free is never held to its floor, so the plan could not re-solve. Seeding
      // `free` here and expecting a working drag is precisely the assertion that pins [D9] in place.
      await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' }, subscriptionPlan: tier }));
      await page.goto('/tutorial');
      await page.getByText('Next', { exact: true }).click();
      await page.getByText('Next', { exact: true }).click();
      await expect(page.getByTestId('tutorial-progress')).toContainText('Step 3 of');

      // The beat spotlights the CONTROL, and the scrim is off so the tap reaches it.
      await page.getByText('Adjust your line').click();
      // [D7] — the sheet is a modal that covers the coaching card, so the beat's guidance rides inside it.
      await expect(page.getByTestId('floor-sheet-coach')).toBeVisible();

      await page.getByText('Save', { exact: true }).click();
      // The payoff: a before→after the user produced themselves.
      await expect(page.getByTestId('floor-impact')).toBeVisible();
      // …and the walkthrough must show the SAFETY NET on both tiers too — the cold-start hedges are
      // premium-only in the engine, so under the old shape beat 4 had no subject for a free user either.
      // `exact` — the attestation control also says "…hold a smaller safety net", and the STAT is what
      // proves beat 4 has a subject.
      await expect(page.getByText('Safety net', { exact: true })).toBeVisible();
    });
  }

  test('moving the line in the tutorial never touches the real plan', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' }, cushionFloor: 200 }));
    await page.goto('/tutorial');
    await page.getByText('Next', { exact: true }).click();
    await page.getByText('Next', { exact: true }).click();
    await page.getByText('Adjust your line').click();
    await page.getByText('Save', { exact: true }).click();
    await page.getByText('Skip', { exact: true }).click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);

    // The whole substrate exists so this holds: a real slider, a real setter, a sandbox store.
    const realFloor = await page.evaluate(() => JSON.parse(window.localStorage.getItem('debtPlanner.rnStore') || '{}').cushionFloor);
    expect(realFloor).toBe(200);
  });

  test('the tabs are held while a session is running', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();

    // The scrim lives inside the Today screen, so it CANNOT cover the tab bar — without the hold, one
    // tap lands the user on Money's real data mid-beat.
    await page.getByTestId('tab-money').click();
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 1 of');

    // …and the hold lifts with the session.
    await page.getByText('Skip', { exact: true }).click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    await page.getByTestId('tab-money').click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    await expect(page).toHaveURL(/money/);
  });

  test('the walkthrough is not advertised while you are inside it', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    // The replay entry restarts the walkthrough — offering that from inside one is incoherent, and on
    // an interactive beat (no scrim) it would be live.
    await expect(page.getByTestId('guardian-replay-tutorial')).toHaveCount(0);
    // The sandbox is a fresh store that has never "seen" the tutorial, so the invitation selector fires
    // on it unless the host suppresses it — leaving Today offering the walkthrough during the walkthrough.
    await expect(page.getByTestId('tutorial-invite')).toHaveCount(0);
  });

  test('the Example marker never appears on the real card', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/');
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByTestId('guardian-example-marker')).toHaveCount(0);
  });

  test('Back works, and Skip ends the session from a mid beat', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');

    await page.getByText('Next', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 2 of');
    await page.getByText('Back', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 1 of');

    await page.getByText('Skip', { exact: true }).click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
  });

  test('interrupt-resume returns to the beat you left on', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialStep: 3 } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 4 of');
  });

  test('a stale resume point past the end restarts instead of dead-ending', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialStep: 99 } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 1 of');
  });

  test('"Not now" answers the offer', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/');
    await expect(page.getByTestId('tutorial-invite')).toBeVisible();
    await page.getByText('Not now').click();
    await expect(page.getByTestId('tutorial-invite')).toHaveCount(0);
    // The "doesn't return on a later launch" half is unit-tested: seedStore's addInitScript re-injects
    // on every navigation, so a cross-page check here would only prove the seed re-ran.
  });

  test('a user who has already seen their run is never invited', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/');
    await expect(page.getByText('Looks clear this paycheck')).toBeVisible();
    await expect(page.getByTestId('tutorial-invite')).toHaveCount(0);
  });

  test('replay stays reachable after the offer is gone (card + More)', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/');

    await page.getByTestId('guardian-replay-tutorial').click();
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();

    await page.goto('/more');
    await expect(page.getByText('How the Guardian works')).toBeVisible();
    await page.getByText('How the Guardian works').click();
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
  });
});
