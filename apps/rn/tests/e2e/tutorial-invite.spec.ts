import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.5.1/3.5.2/3.5.3.1 — the tutorial's invitation, path, and in-situ shell.
 *
 * 3.5.3.1 changed the shape of all of this: the walkthrough is no longer a screen of its own, it's an
 * overlay on the REAL Today tab, with Today's own components re-rendered from a sandbox store. That was
 * forced — `useGoToTab` only behaves inside the tabs navigator, so hosting a copy of Today in a Stack
 * route would land as a detached tab group (a blank screen on device). `/tutorial` survives as the entry
 * for the two callers that can only express themselves as a URL — deep links and this suite. The More
 * row and the Guardian card's replay call `startTutorial()` directly.
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

    // 3.5.3.5.8 ([D5]) — the offer sits with its subject, BELOW the Guardian card, so the user's own
    // paycheck keeps first position. Asserting the vertical order is the only way to pin placement:
    // "is it visible" passed just as happily when it was sitting on top of the hero.
    const invite = await page.getByTestId('tutorial-invite').boundingBox();
    const guardian = await page.getByText('PAYDAY GUARDIAN').boundingBox();
    expect(invite!.y).toBeGreaterThan(guardian!.y);

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

    // …and BLOCKS, which is what the test is named for. Asserting the scrim is merely visible tested
    // nothing: the scrim container is `pointerEvents="box-none"`, so blocking is done by the invisible
    // blocker layer this never touched — the test passed identically with `passThrough` hardcoded true
    // on every beat. Beat 1 spotlights the whole Guardian card, so "Adjust your line" sits INSIDE the
    // lit hole and looks reachable; on a scripted beat it must not be. An unforced click must be
    // intercepted, which Playwright reports as a timeout rather than a navigation.
    await expect(page.getByText('Adjust your line')).toBeVisible();
    const blocked = await page
      .getByText('Adjust your line')
      .click({ timeout: 1500 })
      .then(() => false)
      .catch(() => true);
    expect(blocked, 'a scripted beat must not pass taps to the card it is lighting').toBe(true);
    await expect(page.getByTestId('floor-sheet-coach')).toHaveCount(0);
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

    // The cut is the point of the cutout: the hole must sit over THE SUBJECT, and must not be the screen.
    //
    // Two properties, and both are load-bearing:
    //
    //  1. The reference box is the SUBJECT's own node, not the ring. The ring and the hole are both drawn
    //     from one measured rect, so an assertion relating them compares a value to itself — it passes
    //     with the cutout deleted entirely, the subject dimmed like everything else and the spotlight
    //     visually dead. That is not a hypothetical: it was proven by replacing the scrim with a flat
    //     full-screen dark and watching the whole suite stay green.
    //  2. Containment is TWO-SIDED. One-sided containment is satisfied by a hole the size of the
    //     viewport, which is the same thing as no cutout at all.
    //
    // The dark is one element whose fill is its BORDER, so the hole is its border box inset by the border
    // widths — read from live layout rather than assumed.
    //
    // Polled, because the hole irises open on a spring and a single read can land mid-travel.
    const subject = (await page.getByTestId('tutorial-target-guardian-bar').boundingBox())!;
    const holeFramesSubject = async () => {
      const hole = await page.getByTestId('tutorial-scrim-band').evaluate((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const bw = (side: string) => parseFloat(s.getPropertyValue(`border-${side}-width`)) || 0;
        return {
          x: r.x + bw('left'),
          y: r.y + bw('top'),
          width: r.width - bw('left') - bw('right'),
          height: r.height - bw('top') - bw('bottom'),
        };
      });
      // 1px for sub-pixel rounding between the spring's animated value and layout; the upper bound allows
      // the ring inset on both edges plus that rounding, and nothing like a full screen.
      const slack = 24; // 4 × the overlay's RING_INSET (6) — the inset applies on both edges of both axes
      return (
        hole.x <= subject.x + 1 &&
        hole.y <= subject.y + 1 &&
        hole.x + hole.width >= subject.x + subject.width - 1 &&
        hole.y + hole.height >= subject.y + subject.height - 1 &&
        hole.width <= subject.width + slack &&
        hole.height <= subject.height + slack
      );
    };
    await expect.poll(holeFramesSubject, { timeout: 5000, message: 'the scrim hole must frame the subject — and only the subject' }).toBe(true);
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

      // 3.5.3.5.9 — the scrim STAYS UP on an interactive beat, with a hole cut at the coached control.
      // The two assertions together are the contract: the scrim is present (so stray taps are blocked),
      // and this click lands WITHOUT `force` (so the hole is really over the control). If the hole were
      // misplaced, Playwright would report the scrim intercepting — which is the failure we want.
      await expect(page.getByTestId('tutorial-scrim')).toBeVisible();
      await page.getByText('Adjust your line').click();
      // [D7] — the sheet is a modal that covers the coaching card, so the beat's guidance rides inside it.
      await expect(page.getByTestId('floor-sheet-coach')).toBeVisible();

      // A save with NOTHING MOVED must produce no payoff at all. The bar is this app's most emphatic
      // "you changed something" language and it used to render for an unchanged value too, which made
      // every `floor-impact` assertion below satisfiable by merely opening and closing the sheet. This
      // is the assertion that keeps them honest — without it, un-gating the payoff silently returns
      // every one of them to proving only that Save was pressed.
      await page.getByText('Save', { exact: true }).click();
      await expect(page.getByTestId('floor-impact')).toHaveCount(0);

      // Now actually MOVE the line. The slider is a gesture-handler view: a tap anywhere on the track
      // sets the value, so clicking at ~20% of its width lowers the line.
      await page.getByText('Adjust your line').click();
      const slider = page.getByLabel('Cushion line amount');
      const box = (await slider.boundingBox())!;
      await page.mouse.click(box.x + box.width * 0.2, box.y + box.height / 2);

      await page.getByText('Save', { exact: true }).click();
      // The payoff: a before→after the user produced themselves. Asserting the FREED-money caption, not
      // merely the bar — that string is only reachable when the line actually came down.
      await expect(page.getByTestId('floor-impact')).toBeVisible();
      await expect(page.getByText(/more to debt this paycheck/)).toBeVisible();
      // …and the walkthrough must show the SAFETY NET on both tiers too — the cold-start hedges are
      // premium-only in the engine, so under the old shape beat 4 had no subject for a free user either.
      // `exact` — the attestation control also says "…hold a smaller safety net", and the STAT is what
      // proves beat 4 has a subject.
      await expect(page.getByText('Safety net', { exact: true })).toBeVisible();
    });
  }

  test('beat 4: confirming your bills shrinks the net, and the release ack is the ENGINE\'s', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');
    for (let i = 0; i < 3; i++) await page.getByText('Next', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 4 of');

    // The user's own tap on a REAL Guardian control ([D10]).
    // The net BEFORE, so the shrink this test is named for is actually asserted rather than assumed —
    // it previously checked only that the label flipped to "Bills confirmed".
    const netAmount = async () => {
      const t = await page.getByTestId('guardian-reserve-amount').textContent();
      return Number((t ?? '').replace(/[^0-9.]/g, ''));
    };
    const netBefore = await netAmount();
    expect(netBefore).toBeGreaterThan(0);

    await expect(page.getByText(/All your regular bills entered/)).toBeVisible();
    await page.getByText(/All your regular bills entered/).click();
    await expect(page.getByText(/Bills confirmed/)).toBeVisible();
    // Confirming your bills holds LESS back — that is the whole claim of the beat's first half.
    await expect.poll(netAmount, { timeout: 5000 }).toBeLessThan(netBefore);

    // Then the scripted story, driven by the real producers: a surprise the net absorbs, then three
    // paydays (DISCOVERY_CYCLES) so the net retires. The closing ack is written by `applyRollover`, not
    // by the tutorial — asserting its SURPRISE-branch copy is what proves the engine produced it, since
    // the tutorial has no way to fabricate that sentence.
    const ack = page.getByText(/safety net was there when a surprise came up/);
    await expect(ack).toBeVisible({ timeout: 12_000 });

    // 3.5.3.5.5 — being in the DOM is not the same as being seen. The ack renders in Today's slot at the
    // very top while the spotlight was holding the view down on the attestation, so the user watched the
    // beat's payoff happen off-screen. The spotlight must FOLLOW it: assert the ring has moved onto the
    // ack, which also proves the screen scrolled there.
    const ring = page.getByTestId('tutorial-spotlight');
    await expect.poll(async () => {
      const r = await ring.boundingBox();
      const a = await ack.boundingBox();
      if (!r || !a) return false;
      return r.y < a.y + a.height && r.y + r.height > a.y; // vertical overlap = the ring is on the ack
    }, { timeout: 8000 }).toBeTruthy();
    // …and it is genuinely in the viewport, not merely rendered somewhere above it.
    await expect(ack).toBeInViewport();
  });

  // [F] The exit-gate assertion `publishSandbox` was built for, finally written. That snapshot channel
  // has existed since 3.5.2 with ZERO readers — the harness could describe the live sandbox and nobody
  // ever asked it anything, which is the "built, not called" shape this phase kept producing. The gap it
  // left is real: every other assertion here reads the SCREEN, so the whole suite could stay green while
  // the sandbox's underlying state was wrong in a way the current beat's copy didn't happen to render.
  // This reads the store behind the story instead, and pins what the visible ack only implies.
  test('the sandbox behind the story really advanced — cycles rolled, reserve released', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.addInitScript(() => {
      (window as unknown as { __debtSandboxHarness: Record<string, unknown> }).__debtSandboxHarness = {};
    });
    await page.goto('/tutorial');

    const snap = () =>
      page.evaluate(() => {
        const g = (window as unknown as { __debtSandboxHarness?: { snapshot?: () => unknown } }).__debtSandboxHarness;
        return g?.snapshot ? g.snapshot() : null;
      });

    // Published when the sandbox is BUILT, which happens as the session starts — so wait for the session
    // to be on screen before asking, rather than racing the launcher's effect.
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 1 of');
    const opening = (await snap()) as { cycle: number; reserveHeld: boolean; scenarioId: string } | null;
    expect(opening).not.toBeNull();
    expect(opening!.reserveHeld).toBe(true);

    for (let i = 0; i < 3; i++) await page.getByText('Next', { exact: true }).click();
    await page.getByText(/All your regular bills entered/).click();
    await expect(page.getByText(/safety net was there when a surprise came up/)).toBeVisible({ timeout: 12_000 });

    // The ack is the SCREEN's account of what happened; this is the store's. DISCOVERY_CYCLES paydays
    // must genuinely have rolled, and the reserve must genuinely have retired — an ack rendered over a
    // sandbox that never moved would be exactly the kind of lie the walkthrough cannot afford.
    const after = (await snap()) as { cycle: number; reserveHeld: boolean } | null;
    expect(after).not.toBeNull();
    expect(after!.cycle).toBeGreaterThan(opening!.cycle);
    expect(after!.reserveHeld).toBe(false);

    // …and the channel closes with the session, so a stale snapshot can't outlive its sandbox.
    await page.getByText('Skip', { exact: true }).click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    expect(await snap()).toBeNull();
  });

  test('skipping mid-story does not leave rollovers landing afterwards', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');
    for (let i = 0; i < 3; i++) await page.getByText('Next', { exact: true }).click();
    await page.getByText(/All your regular bills entered/).click();
    // Leave immediately — the timers are still in flight.
    await page.getByText('Skip', { exact: true }).click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    await page.waitForTimeout(3000);
    // Nothing from the sandbox's story may surface on the user's own Today.
    await expect(page.getByText(/safety net was there when a surprise came up/)).toHaveCount(0);
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
  });

  test('moving the line in the tutorial never touches the real plan', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' }, cushionFloor: 200 }));
    await page.goto('/tutorial');
    await page.getByText('Next', { exact: true }).click();
    await page.getByText('Next', { exact: true }).click();
    await page.getByText('Adjust your line').click();
    // Move it for real — the point of this test is that a genuine edit doesn't reach the real plan, and
    // saving an unchanged value would have proved that vacuously.
    const slider = page.getByLabel('Cushion line amount');
    const box = (await slider.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.getByText('Save', { exact: true }).click();
    await page.getByText('Skip', { exact: true }).click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);

    // The whole substrate exists so this holds: a real slider, a real setter, a sandbox store.
    const realFloor = await page.evaluate(() => JSON.parse(window.localStorage.getItem('debtPlanner.rnStore') || '{}').cushionFloor);
    expect(realFloor).toBe(200);
  });

  test('a user who actually DOES the interactive beats completes the whole arc', async ({ page }) => {
    // 3.5.3.8.1 — every other test walks the arc by pressing Next, or exercises one beat in isolation.
    // Nobody had ever driven the path a real user takes: interacting on beats 3 and 4 and continuing
    // through to the hand-back. That is the one sequence where the leaves have to work TOGETHER — a
    // re-stage clobbering a payoff, or a story timer landing on the next beat, would only show up here.
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');

    await page.getByText('Next', { exact: true }).click(); // → 2 read the bar
    await page.getByText('Next', { exact: true }).click(); // → 3 your line (interactive)
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 3 of');
    await page.getByText('Adjust your line').click();
    // MOVE the line before saving. Saving it unchanged is a no-op and deliberately produces no payoff
    // bar — so a version of this test that only clicked Save asserted the payoff for a user who had not
    // done anything, on the test whose entire premise is a user who DOES the interactive beats.
    const floorSlider = page.getByLabel('Cushion line amount');
    const floorBox = (await floorSlider.boundingBox())!;
    await page.mouse.click(floorBox.x + floorBox.width * 0.8, floorBox.y + floorBox.height / 2);
    await page.getByText('Save', { exact: true }).click();
    await expect(page.getByTestId('floor-impact')).toBeVisible();

    await page.getByText('Next', { exact: true }).click(); // → 4 the safety net (interactive)
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 4 of');
    // The re-stage must have cleared the previous beat's payoff — a stale before→after here would be
    // narrating beat 3's result under beat 4's copy.
    await expect(page.getByTestId('floor-impact')).toHaveCount(0);
    await page.getByText(/All your regular bills entered/).click();
    await expect(page.getByText(/safety net was there when a surprise came up/)).toBeVisible({ timeout: 12_000 });

    await page.getByText('Next', { exact: true }).click(); // → 5 short paycheck
    await expect(page.getByText(/won't cover everything/)).toBeVisible();
    await page.getByText('Next', { exact: true }).click(); // → 6 your call
    await page.getByText('Next', { exact: true }).click(); // → 7 hand-back
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 7 of');
    await page.getByText('Finish', { exact: true }).click();

    // Back on their own plan, with nothing of the sandbox left behind.
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    await expect(page.getByTestId('guardian-example-marker')).toHaveCount(0);
    await expect(page.getByText(/MAR 16/i)).toHaveCount(0);
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
  });

  test('the finale tells a FREE user what premium actually did', async ({ page }) => {
    // [D9]'s honesty rests entirely here: the walkthrough shows every audience a premium Guardian, and
    // the `PremiumInvite` doesn't render during a session — so if the hand-back doesn't name what
    // premium did, the whole run is free-dressed-as-premium, which the standing rule forbids.
    await seedStore(page, newUser({ prefs: { onboardingComplete: true }, subscriptionPlan: 'free' }));
    await page.goto('/tutorial');
    for (let i = 0; i < 6; i++) await page.getByText('Next', { exact: true }).click();
    await expect(page.getByTestId('tutorial-progress')).toContainText('Step 7 of');

    await expect(page.getByText(/example money/)).toBeVisible();
    await expect(page.getByText(/premium is what did the holding/i)).toBeVisible();
    // [A2] All THREE premium behaviours the run demonstrated, not just the holding. Showing three and
    // crediting one is the same bait-and-switch by a smaller margin.
    await expect(page.getByText(/learns your bills/)).toBeVisible();
    await expect(page.getByText(/comes up short/)).toBeVisible();
    // [A1] And the removed LIE, asserted absent. This line used to read "you decide what to hold" — a
    // free user cannot: `showAdjust` is premium-gated and that sheet is the only route to the cushion
    // floor in the whole app. It named a capability they don't have, in the one beat [D9]'s honesty
    // depends on. This spec ASSERTED that sentence was visible, so the suite was pinning the defect in
    // place — which is why the audit had to find it instead.
    await expect(page.getByText(/you decide what to hold/)).toHaveCount(0);

    // …and it hands back to their OWN card, where the real invitation lives.
    await page.getByText('Finish', { exact: true }).click();
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    await expect(page.getByText(/MAR 16/i)).toHaveCount(0); // the sandbox's payday is gone
    await expect(page.getByText(/Premium keeps your cushion at your line/)).toBeVisible();
  });

  test('the finale does NOT sell premium to someone who already has it', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true }, subscriptionPlan: 'premium' }));
    await page.goto('/tutorial');
    for (let i = 0; i < 6; i++) await page.getByText('Next', { exact: true }).click();
    // Intent, not wording — the THIRD test in this suite caught pinning a literal sentence, and this one
    // broke on the round-2 [A4] fix (the premium line said "with your real paycheck", which isn't true
    // of a premium user who completed onboarding without one). What must hold is: the hand-back speaks
    // to someone who already has premium, and never sells it to them.
    await expect(page.getByText(/example money/)).toBeVisible();
    await expect(page.getByText(/your Guardian does exactly this/)).toBeVisible();
    await expect(page.getByText(/premium/i)).toHaveCount(0);
  });

  test('the tabs are held while a session is running', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();

    // 3.5.3.5.7 — the scrim now covers the tab bar too, so a normal click is intercepted before it ever
    // reaches the tab. `force` bypasses that deliberately: what's under test here is the LISTENER, the
    // guard that has to hold even if the scrim's geometry is wrong — a stray tab tap mid-beat strands
    // the user, and the scrim and the listener are independent defences against it.
    await page.getByTestId('tab-money').click({ force: true });
    // Assert the URL and the SCREEN, not just the overlay. The overlay mounts at the root and renders
    // over whatever tab you're on, so "overlay still visible / still Step 1" held true even if the press
    // had navigated — delete `holdTabs` entirely and the old assertions stayed green. What must be true
    // is that the navigation did not happen.
    await expect(page).not.toHaveURL(/money/);
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
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
    // The replay entry restarts the walkthrough — offering that from inside one is incoherent. (The old
    // reason given here, "on an interactive beat (no scrim) it would be live", is pre-3.5.3.5.9: the
    // scrim stays up and the replay link sits under a blocking band. Still right to withhold it; the
    // stated mechanism was stale.)
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

  // Round 6 — the accessibility fence is REAL, asserted against the rendered document.
  //
  // Every a11y fence in this feature was a silent no-op on web for four audit rounds: the code wrote
  // `accessibilityElementsHidden` + `importantForAccessibility`, react-native-web's prop allowlist
  // contains neither, and `createDOMProps` drops unknown props with no warning. Four rounds of a11y work
  // was "verified" by this suite, on the one platform where the fences did not exist — and it stayed
  // green throughout, because nothing ever asked the document what it actually contained.
  //
  // Asks the accessibility tree the question a screen reader asks. `getByRole` resolves against that
  // tree only, so an aria-hidden control is unresolvable BY CONSTRUCTION — whereas `getByText` and
  // `getByTestId` match straight through `aria-hidden`, and `toBeVisible()` is CSS-based. That
  // distinction is the whole reason a11y work can stay green while fencing nothing.
  //
  // Assert on the a11y tree, never on geometry: a bounding-box proxy for "is it fenced" passes for
  // reasons that have nothing to do with fencing.
  test('the coached screen leaves the a11y tree on scripted beats and returns for interactive ones', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();

    // Beat 1 is scripted: Today is fenced entirely, so none of its controls resolve by role…
    await expect(page.getByRole('button', { name: 'Adjust your line' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'See your forecast' })).toHaveCount(0);
    // …while remaining on screen. The fence hides the card from assistive tech; it does not pull it out
    // of the composition the user is being shown.
    await expect(page.getByText('Adjust your line →')).toBeVisible();
    // …and the dock stays reachable above the fence, or the walkthrough would be a trap.
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

    // Beat 3 ('Your line') is INTERACTIVE: the fence opens so the user can reach the coached control.
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('Your line');
    await expect(page.getByRole('button', { name: 'Adjust your line' })).toHaveCount(1);
    // But ONLY the coached control. The forecast link sits in the same open card and must stay fenced —
    // it pushes a route out from under the live overlay, and a VoiceOver double-tap never goes through
    // hit-testing, so the scrim cannot stop it.
    await expect(page.getByRole('button', { name: 'See your forecast' })).toHaveCount(0);
  });

  // Nothing on the ordinary app may be hidden from assistive tech while still being tabbable — the
  // `aria-hidden-focus` violation. It is a whole-app property (every sheet shares one backdrop), and it
  // shipped once already: an RNW Pressable keeps its tabIndex regardless of aria state, so a fence
  // written with `focusable={false}` produced an unlabelled full-screen keyboard stop.
  test('no aria-hidden region contains a tabbable element', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/');
    // Focusability, not the `tabindex` attribute. `inert` is how a fenced region drops out of the tab
    // order, and it does NOT remove `tabindex` — it makes the browser ignore it. An assertion on the
    // attribute alone reports every correctly-fenced region as a violation, which is the mirror image of
    // the bug: a check that cannot pass is as useless as one that cannot fail.
    const trapped = async () =>
      page.evaluate(() => {
        const FOCUSABLE = '[tabindex="0"],a[href],button,input,select,textarea';
        return [...document.querySelectorAll('[aria-hidden="true"]')]
          .flatMap((el) => [el, ...el.querySelectorAll(FOCUSABLE)])
          .filter((el) => el.matches(FOCUSABLE) && !el.closest('[inert]'))
          .length;
      });
    expect(await trapped()).toBe(0);
    // …and during a walkthrough, which fences most of Today.
    await page.getByTestId('guardian-replay-tutorial').click();
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    expect(await trapped()).toBe(0);
    // The count above is only meaningful if the fence is actually there. Without this, deleting the
    // fence entirely would also produce zero violations — the assertion would pass because nothing was
    // hidden rather than because nothing was trapped. This gate has shipped that shape four times.
    expect(await page.locator('[inert]').count()).toBeGreaterThan(0);
  });
});
