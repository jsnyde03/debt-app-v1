import { expect, test } from '@playwright/test';

/**
 * 3.5.7.5 — THE EMBED'S ENTRY, HELD BY A TEST.
 *
 * The embed is a page whose whole job is to show the product immediately: a visitor who lands on Welcome,
 * or on somebody's onboarding form, has been shown nothing. `EXPO_PUBLIC_EMBED` makes the build enter
 * `/demo?mode=scripted` by itself (`DemoAutoEntry`), which is the same mechanism the App-Preview capture
 * uses and for the same reason — a deep link is the fragile option, established over two CI cycles.
 *
 * ⚠️ RUNS AGAINST THE EMBED BUILD. The flag is inlined by the bundler, so this assertion is meaningless
 * in the main suite: there, `EMBED_DEMO` is constant-false and the app boots normally, correctly.
 *
 * ⛔ WHY THE DOCK IS ASSERTED AND NOT JUST THE MARKER. Three runs can put an example-money marker on
 * screen — explore, scripted, and the capture — and they are distinguished by chrome and by whether
 * anything moves on its own. Asserting only "a demo is showing" would pass for the run a visitor cannot
 * watch (explore, which sits still) and for the run with no exit (capture, chrome stripped). The dock's
 * own position readout is the one signal that says *scripted, with its chrome*.
 */

/** The dock's a11y label is `Demonstration, <n> of <total>.` — the position is the script's own cursor. */
const dockAt = (n: number) => new RegExp(`Demonstration, ${n} of \\d+\\.`);

test.describe('the embed shows the product on arrival', () => {
  /**
   * ⭐ 3.5.7.8 — NOTHING ASKED FOR SOMETHING THAT ISN'T THERE.
   *
   * The embed deploys to a GitHub Pages **project** site under `/debt-app-v1/`, and `expo export` emits
   * asset paths absolute from ROOT unless `experiments.baseUrl` is set. Get that wrong and every
   * `/_expo/…js` 404s: the page renders **blank, with a 200 on the document**, which is this repo's
   * nastiest regression class and the reason `route-smoke.spec.ts` exists.
   *
   * ⛔ AND NO OTHER SPEC HERE COULD SEE IT. `zero-egress` watches for FOREIGN hosts, so a same-origin 404
   * is invisible to it; the boot specs assert content, so they would go red with a timeout that reads as
   * "the demo is slow" rather than "the base path is wrong". This watches status codes, which names it.
   *
   * ⚠️ `>= 400`, not `!= 200`: a 304 is a cache hit and perfectly fine.
   */
  test('every asset the page asks for actually exists at the base path', async ({ page }) => {
    const missing: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`);
    });

    await page.goto('./');
    await page.waitForLoadState('networkidle');
    // The charts pull CanvasKit's 8 MB wasm LAZILY, on a chart's first mount — and `locateFile` was three
    // hardcoded root paths until 3.5.7.8. Booting alone would never have requested it, so the run has to
    // reach a beat that draws.
    await expect(page.getByLabel(dockAt(2))).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState('networkidle');

    expect(missing, `the page asked for ${missing.length} thing(s) that are not there`).toEqual([]);
  });

  test('boots straight into the scripted demo — no Welcome, no onboarding', async ({ page }) => {
    await page.goto('./');

    // The demo route redirects to the ARC'S OPENING SCREEN (`DEMO_STAGES[0].screen`), not to a hardcoded
    // tab — so landing on Money is the evidence the run started rather than that a route existed.
    await expect(page).toHaveURL(/\/money/, { timeout: 15_000 });
    await expect(page.getByTestId('example-canvas-marker').first()).toBeVisible();

    // Chrome KEPT, unlike the capture build: the dock is the viewer's only way out of an embed, and it
    // carries the subscription disclosure.
    await expect(page.getByLabel(dockAt(1))).toBeVisible();
  });

  test('the run is SCRIPTED — the beats advance with no interaction at all', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByLabel(dockAt(1))).toBeVisible({ timeout: 15_000 });

    // Beat 2 lands 4s in (`DEMO_STAGES`). Nothing is clicked, scrolled or typed between these two lines —
    // that is the assertion. An `explore` run would sit on beat 1 forever and fail here, which is exactly
    // the confusion [D23] split the two runs to end.
    await expect(page.getByLabel(dockAt(2))).toBeVisible({ timeout: 15_000 });
  });

  // PARTIAL: §12.5.4 — all five beats fire in order and the run MOVES BETWEEN SCREENS by itself, in the
  // stated sequence. ⚠️ The row's other half — that each screen's content is PAINTED before the next beat
  // fires (the Skia cushion bar, the Progress curve) — is a rendering question web cannot answer, and it
  // is the same class as §11.13.
  test('all five beats fire in order, and the run moves Money → Today → Today → Progress → Today', async ({ page }) => {
    // ⛔ THE SCREEN SEQUENCE IS THE ASSERTION, not just the count. A run that fired five beats without
    // navigating would satisfy a beat-counter perfectly and still be the failure the row names ("the run
    // never leaves Today"). `DEMO_STAGES` declares `/money · / · / · /progress · /`.
    const expected = [/\/money/, /\/$/, /\/$/, /\/progress/, /\/$/];

    await page.goto('./');
    for (let beat = 1; beat <= 5; beat++) {
      // Generous per-beat: the arc's own cadence is 0s · 4s · 9s · 14s · 20s, so beat 5 lands ~20s in and
      // a cold first paint sits in front of beat 1.
      await expect(page.getByLabel(dockAt(beat))).toBeVisible({ timeout: 20_000 });
      await expect(page).toHaveURL(expected[beat - 1]);
    }
  });
});
