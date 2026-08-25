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
   * The offer is also deliberately never dismissed via "Got it" — this test is about the offer, and the
   * dismissal has its own spec.
   *
   * ⛔ **TWO CLAIMS THAT STOOD HERE WERE STALE, AND THE C-C AUDIT QUOTED BOTH.** [P6.8.9.7.11.12.9]
   * *"The record is written on OFFER"* — no: 4.1.4c moved it to `CoachMarkLayer`, and `.11.12.9` moved it
   * again, to the layer's own viewport test. And **"the callout lands far below the fold"** with its
   * *"y≈1266 in an 874pt viewport, 392pt below the fold"* (2026-08-10) described the **entrance transient**
   * without knowing it. ⚡ **Re-measured 2026-08-25 at four viewports** — 440×956, 440×740, 402×874,
   * 390×664 — **the seated callout is on screen in every one** (402×874: y 543..687). The below-fold
   * position is real and it is transient, which is the whole of C-C: the record was written during it.
   * → `docs/evidence/2026-08-25-p6.8.9.7.11.12.9-coach-void/`.
   *
   * ⚠️ **`toBeVisible()` still cannot carry this test**: RN-web satisfies it with a node anywhere in the
   * document, off-screen included — so it is true throughout that transient. What web genuinely proves
   * here is exactly ONE callout, and that it is the Modal's own copy, which is precisely what 3.5.5.5
   * built. Both were checked by deleting `<CoachMarkLayer nested />` and confirming this test goes red.
   * Frames for the device question are pinned at
   * `apps/rn/capture-ref/phase35/<theme>/coach-payoff-schedule.png`.
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

  /**
   * ⛔ **THE TEST ABOVE EXERCISES THE ONLY MARK THAT WORKS, AND THAT IS WHY THIS ONE EXISTS.**
   * [P6.8.9.7.11.12 · C-C-B] `payoff-schedule`'s host is the debt sheet, which is **re-created every time
   * the sheet opens** — so its offer effect re-runs and re-arms. The other two marks live on **tabs**,
   * which never unmount (`_layout.tsx` sets no `unmountOnBlur`), and their offer subscription holds a
   * closure latch, `asked`, that `resetCoachMarks()` cannot reach: it clears the persisted pref and the
   * session set, and the latch is neither.
   *
   * ⚡ So the app answered *"Tips will appear again as you go."* and two of the three tips could not come
   * back in that session no matter where the user went — while the suite named for exactly that claim
   * passed, because it only ever asked the one mark whose host remounts.
   *
   * ⚠️ **A cold start DOES restore them**, so this is not permanent — but *"as you go"* is a claim about
   * THIS session, and the row exists because *"without a way back the whole discovery layer is a one-shot
   * a user can lose to a mis-tap"*.
   */
  test('Show feature tips again brings back a mark whose host is a TAB', async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: true, coachMarksSeen: ['trajectory-scrub'] } }));

    await page.goto('/progress');
    // The subject is on screen and the mark is correctly withheld — so the latch has now been armed by a
    // refused offer, which is the state the reset has to survive.
    await expect(page.getByTestId('tutorial-target-trajectory-scrub')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('coach-mark')).toHaveCount(0);

    // ⚠️ Client-side from here — every `page.goto` re-runs the seed script and would restore
    // `coachMarksSeen`, silently undoing the reset this test exists to prove.
    await page.getByRole('button', { name: 'More' }).first().click();
    await page.getByText('Show feature tips again').click();
    await expect(page.getByText('Tips will appear again as you go.')).toBeVisible();
    await page.goBack();

    await expect(page.getByTestId('tutorial-target-trajectory-scrub')).toBeVisible({ timeout: 15_000 });
    // ⛔ The COPY, not the count — `.11.12.7` measured a count assertion here passing on a stale callout.
    await expect(page.getByTestId('coach-mark')).toContainText('Drag the curve');
  });

  /**
   * ⛔ **THE HINT WAS SPENT BEFORE IT WAS EVER ON SCREEN.** [P6.8.9.7.11.12.9 · C-C] `coachMarks.ts`
   * promises *"the once-ever record is written when the callout ACTUALLY DRAWS … what no longer counts is
   * drawn-into-the-void"*, and the layer decided that on `rect && copy`. A sheet's entrance spring makes
   * the subject measure a full sheet-height below where it will rest, so a rect can exist, be honest, and
   * describe a card far below the fold.
   *
   * ⚡ **MEASURED here before it was fixed:** at this viewport the record was already **persisted** on the
   * first frame the callout painted, with its bottom edge at **1511** in a 956 pt window, and the callout
   * did not come on screen for another **621 ms**. Closing the sheet inside that window — or tapping the
   * very row the hint points at — loses the hint permanently.
   *
   * ⛔ **WHY A rAF TIMELINE AND NOT TWO READS.** The store persists on a **500 ms debounce**, so "read the
   * record now" answers a question about half a second ago. A single sample therefore cannot tell "not
   * recorded" from "recorded and not yet flushed", and the version of this test that took one reads GREEN
   * with the defect present. Sampling every frame and asking *"was the callout ever off-screen while the
   * record existed"* removes the timing from the assertion instead of guessing at it.
   *
   * ⚠️ **The first two assertions are the vacuity guards, and they FAIL rather than skip.** If the
   * entrance transient stops happening (Reduce Motion, a snap, a faster spring) this test can no longer
   * decide anything — and a test that cannot decide must say so out loud, not pass. This repo has shipped
   * two specs that stayed green with the defect planted back for exactly this reason.
   */
  test('a hint drawn below the fold is not spent — the record waits for the callout to be on screen', async ({ page }) => {
    /** `persistence.ts` — how long a record can sit in memory before localStorage can show it. */
    const SAVE_DEBOUNCE_MS = 500;

    await seedStore(page, scenario());
    // Installed BEFORE the app loads: the record is written on the layer's first commit, which is earlier
    // than anything the harness can await.
    await page.addInitScript(() => {
      const w = window as unknown as { __coachSamples: { t: number; bottom: number; winH: number; seen: boolean }[] };
      w.__coachSamples = [];
      const t0 = performance.now();
      const tick = () => {
        const el = document.querySelector('[data-testid="coach-mark"]');
        if (el) {
          let seen = false;
          try {
            const blob = JSON.parse(window.localStorage.getItem('debtPlanner.rnStore') || 'null');
            seen = !!blob?.prefs?.coachMarksSeen?.includes('payoff-schedule');
          } catch {
            /* a partially-written blob is simply "not seen yet" */
          }
          const r = el.getBoundingClientRect();
          w.__coachSamples.push({ t: Math.round(performance.now() - t0), bottom: Math.round(r.bottom), winH: window.innerHeight, seen });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await openDebt(page);
    const card = page.getByTestId('coach-mark');
    await expect(card).toBeVisible();
    // The seated position — `FormSheet`'s `remeasureOn={settled}` re-measures and the callout is redrawn
    // where it can be seen. That redraw is what the record should have been waiting for all along.
    await expect(card).toBeInViewport();
    // …and then long enough for the record made at THAT draw to reach localStorage, so the last assertion
    // is asking about a flushed value rather than about the debounce.
    await page.waitForTimeout(SAVE_DEBOUNCE_MS + 300);

    const samples = await page.evaluate(
      () => (window as unknown as { __coachSamples: { t: number; bottom: number; winH: number; seen: boolean }[] }).__coachSamples,
    );

    expect(samples.length, 'the callout painted at least one frame to sample').toBeGreaterThan(0);
    const offScreen = samples.filter((s) => s.bottom > s.winH);
    const firstOnScreen = samples.find((s) => s.bottom <= s.winH);

    // GUARD 1 — the void the record has to be excluded from was actually entered.
    expect(offScreen.length, 'the entrance transient never put the callout below the fold, so this test cannot decide anything').toBeGreaterThan(0);
    // GUARD 2 — and it lasted longer than the persistence debounce, so a record made in the void MUST be
    // observable inside it. Without this, a short transient would let the broken behaviour flush after the
    // callout had seated and the assertion below would pass for a reason unrelated to the fix.
    expect(firstOnScreen, 'the callout never came on screen at all').toBeDefined();
    expect(
      firstOnScreen!.t - samples[0].t,
      `the off-screen window (${firstOnScreen!.t - samples[0].t}ms) is shorter than the ${SAVE_DEBOUNCE_MS}ms save debounce — a record written in it could flush after it, so this instrument cannot decide`,
    ).toBeGreaterThan(SAVE_DEBOUNCE_MS);

    // THE ASSERTION. Not one reading of the record, but every frame it existed for.
    const spentInTheVoid = offScreen.filter((s) => s.seen);
    expect(
      spentInTheVoid.map((s) => `t=${s.t}ms bottom=${s.bottom} winH=${s.winH}`),
      'the hint was recorded as seen while its callout was below the fold',
    ).toEqual([]);

    // …and the other direction, which is the whole reason this is not just "never record": a callout that
    // IS on screen still spends the hint. Without this, deleting the write passes everything above.
    const last = samples[samples.length - 1];
    expect(last.bottom, 'the last sample is of a callout on screen').toBeLessThanOrEqual(last.winH);
    expect(last.seen, 'a hint the user could actually see is still recorded as seen').toBe(true);
  });

  test('the marked control stays live — a hint is not a modal', async ({ page }) => {
    await seedStore(page, scenario());
    await openDebt(page);
    await expect(page.getByText(MARK)).toBeVisible();

    // Ignoring the hint and using the thing it names is a success, not a dismissal.
    await page.getByTestId('debt-view-schedule').click();
    await expect(page).toHaveURL(/\/schedule\/d0/);
  });

  /**
   * ⛔ **THE TEST ABOVE PASSES WITH THE CARD EATING TAPS, AND THAT IS WHY THIS ONE EXISTS.**
   * [P6.8.9.7.11.5] It clicks a control that does not happen to sit under the callout, so it proves the
   * hint is not a full-screen modal and says nothing about the card's own footprint. `box-none` exempts
   * the card ITSELF and leaves every direct child a hit target — and the sentence wrapper is most of the
   * card's area. `strategy-compare.spec.ts`, the one spec that caught the real thing, was changed in the
   * same diff to seed `coachMarksSeen`, so it no longer renders a mark at all: **deleting `box-none`
   * turned nothing red.**
   *
   * ⚡ **The decidable form is "what is under this pixel", not "did a click work"** — a click test needs a
   * control to be underneath, which depends on layout and is exactly the coincidence that hid this.
   * `elementFromPoint` over the sentence's own centre answers it directly, whatever is beneath.
   *
   * ⚠️ Web-only by construction: on iOS a plain `View` is `userInteractionEnabled` and consumes the touch
   * for the same reason, but nothing off-device can observe it. ⛔ **Same symptom, TWO mechanisms** — so a
   * green here says nothing about the device, and the row that says so was **promised here and never
   * written** until `.11.13.9`. It is now in `DEBT_ELEVATION_PLAN.md` → *P6.14 reference*, under
   * *"the coach-mark callout's own FOOTPRINT"*.
   */
  test('the callout does not eat taps over its own words', async ({ page }) => {
    await seedStore(page, scenario());
    await openDebt(page);
    const card = page.getByTestId('coach-mark');
    await expect(card).toBeVisible();
    /**
     * ⛔ **`toBeVisible()` IS NOT "ON SCREEN", AND THE DIFFERENCE IS SILENT IN THE PASSING DIRECTION.**
     * [P6.8.9.7.11.5] Playwright's visible means *in the DOM with a non-empty box*; this callout is
     * absolutely positioned and can rest **below the fold** while the reveal scroll settles. In that state
     * `elementFromPoint` returns `null` for every point in it, so an absence assertion over the callout
     * passes for a reason that has nothing to do with pointer events — and a planted defect fails for that
     * same unrelated reason. Two runs cost, before the viewport was ruled out as the variable.
     * ⚠️ A viewport assertion, not a `waitForTimeout`: what is being waited for is *"the callout has come
     * to rest somewhere hit-testable"*, and that is a state the harness can observe directly.
     */
    await expect(card).toBeInViewport();
    await expect(page.getByTestId('coach-mark-dismiss')).toBeInViewport();

    /**
     * ⛔ **MEASURED AND HIT-TESTED IN ONE EVALUATE, DELIBERATELY.** The first cut took each `boundingBox()`
     * in the harness and passed the coordinates back in — two round trips per element — and the dismiss
     * check failed against a button that a probe proved *is* hit-testable. **The reveal scroll settles in
     * that window**, so the box was measured at one scroll offset and probed at another. ⚠️ Cluster E
     * flagged exactly this shape in this file: bounding boxes with no settle wait, over a page that is
     * still moving. Reading the rect and calling `elementFromPoint` in the same frame removes the race
     * rather than papering it with a wait.
     */
    const hit = await page.evaluate(() => {
      const at = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = r.x + r.width / 2;
        const y = r.y + r.height / 2;
        const found = document.elementFromPoint(x, y);
        return {
          // ⛔ **THE VACUITY GUARD, AND IT CAUGHT ITSELF.** `elementFromPoint` returns `null` for a point
          // outside the viewport, and `null?.closest(...)` is falsy — so `insideCallout === false` is
          // ALSO true of a callout that is simply off-screen. The first cut asserted only the `false`,
          // and a run where the card sat below the fold passed it while proving nothing. This repo has
          // two specs that stayed green with a defect planted for exactly this shape. [P6.8.9.7.11.5]
          hitSomething: found !== null,
          insideCallout: !!found?.closest('[data-testid="coach-mark"]'),
          insideDismiss: !!found?.closest('[data-testid="coach-mark-dismiss"]'),
        };
      };
      const cardEl = document.querySelector('[data-testid="coach-mark"]');
      // The sentence wrapper: the alert-role View that holds the title and body.
      const sentenceEl = cardEl?.querySelector('[role="alert"]') ?? null;
      return { sentence: at(sentenceEl), dismiss: at(document.querySelector('[data-testid="coach-mark-dismiss"]')) };
    });

    expect(hit.sentence, 'the callout sentence is in the DOM to test').not.toBeNull();
    expect(
      hit.sentence!.hitSomething,
      'the sentence is ON SCREEN — without this the assert below is true of a callout below the fold',
    ).toBe(true);
    expect(
      hit.sentence!.insideCallout,
      "a tap on the callout's own sentence reaches what is underneath, not the callout",
    ).toBe(false);

    // The preserved property: the dismiss button is the ONE part that must still take a tap.
    expect(hit.dismiss, 'the dismiss button is in the DOM to test').not.toBeNull();
    expect(hit.dismiss!.hitSomething, 'the dismiss button is ON SCREEN').toBe(true);
    expect(
      hit.dismiss!.insideDismiss,
      '"Got it" is still hit-testable — opening the card must not disarm its own exit',
    ).toBe(true);
  });

  /**
   * ⛔ **CLOSING THE SHEET WITHOUT TAPPING "GOT IT" LEFT THE MARK ACTIVE FOREVER.**
   * [P6.8.9.7.11.12 · C-C-A] `use-coach-mark`'s stand-down rule — *"a mark must not outlive the screen its
   * subject is on"* — fires on **blur**, and for a sheet-hosted mark there is no blur to fire on: closing
   * the sheet **unmounts** the hook, and the tab underneath never stopped being focused. So `active` kept
   * the id of a subject that no longer exists.
   *
   * ⚡ **Two harms, and the second is the worse one.** The callout can redraw over the list at the row's
   * old coordinates, pointing at a control that is gone — and `show()` refuses every subsequent mark while
   * anything is active (`coachMarks.ts:92`), so **one un-dismissed hint disables the whole discovery layer
   * for the rest of the session.** That is what the second half of this test measures.
   *
   * ⚠️ **No test could have caught this**: none of the five tests above ever closes the sheet, and the
   * closest one navigates to `/schedule/d0` — which also unmounts the hook without blurring — then asserts
   * only the URL.
   */
  test('closing the sheet stands the mark down, and the discovery layer still works', async ({ page }) => {
    await seedStore(page, scenario());
    await openDebt(page);
    await expect(page.getByTestId('coach-mark')).toHaveCount(1);

    await page.getByTestId('sheet-close').click();
    await expect(page.getByText('Edit debt')).toHaveCount(0);

    // ⛔ The sheet is gone AND so is its callout. Asserting only the first is what let this ship: the
    // sheet closing is the trigger for the defect, not evidence against it.
    await expect(page.getByTestId('coach-mark')).toHaveCount(0);

    /**
     * ⛔ **THE COMPOUNDING HARM, which the absence assertion above cannot see.** A callout that draws
     * off-screen is invisible and still holds `active` — so the count above can read 0 while the layer is
     * jammed. The only decidable question is whether a DIFFERENT mark can still be offered.
     *
     * ⚠️ Client-side navigation, not `goto`: every `page.goto` re-runs the seed init script, and the app
     * has by now written `payoff-schedule` into `coachMarksSeen` — reseeding would restore the pre-mark
     * blob and quietly change what this asserts.
     */
    // The tab BUTTON, not its label — the idiom `bnpl.spec.ts` documents for this tab bar.
    await page.getByTestId('tab-progress').click();
    await expect(page.getByTestId('tutorial-target-trajectory-scrub')).toBeVisible({ timeout: 15_000 });
    /**
     * ⛔ **WHICH mark, not how many — and the count alone was VACUOUS.** Measured: with the stand-down
     * planted out, `toHaveCount(1)` still **passed**, because the stuck `payoff-schedule` callout is
     * itself the one node it counted. An assertion satisfied by the defect it is meant to catch is worse
     * than no assertion, and only naming the copy separates "a new mark was offered" from "the old one
     * never left".
     */
    await expect(page.getByTestId('coach-mark')).toContainText('Drag the curve');
    await expect(page.getByText(MARK)).toHaveCount(0);
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

    /**
     * ⛔ **NON-OVERLAP, NOT "ABOVE" — corrected at P6.8.9.7.3 [V2-6].** This read
     * `calloutBottom <= subjectTop`, which encodes a PLACEMENT as a stand-in for the property this
     * describe block names ("the callout does not cover its own subject"). Once V2-6 gave the layer room
     * to scroll, the callout correctly landed **below** the subject and this assertion failed on a
     * perfectly good layout — the proxy, not the subject, was what it was measuring.
     *
     * ⚠️ **Not "strictly stronger" — DIFFERENT, and correctly so.** On the predicate alone it is strictly
     * *weaker*: `bottom <= top` implies zero overlap, and zero overlap does not imply `bottom <= top`. The
     * earlier docstring claimed the reverse. What makes the swap right is that the extra thing the old
     * form asserted — *"the callout must be ABOVE"* — was **never a property this block claims**, and was
     * false of a good layout the moment the layer could scroll. ⚡ A test is not improved by asserting
     * more; it is improved by asserting the thing it names. The neighbour case is a separate claim and
     * has its own spec. (P6.8.9.7.10 · E-5.)
     */
    const cb = calloutBox!;
    const sb = subjectBox!;
    const overlap = Math.max(0, Math.min(cb.y + cb.height, sb.y + sb.height) - Math.max(cb.y, sb.y));
    expect(
      overlap,
      `the callout (y ${Math.round(cb.y)}..${Math.round(cb.y + cb.height)}) covers its own subject ` +
        `(y ${Math.round(sb.y)}..${Math.round(sb.y + sb.height)}) by ${Math.round(overlap)}px`,
    ).toBe(0);
  });
});
