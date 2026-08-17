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
  test('boots straight into the scripted demo — no Welcome, no onboarding', async ({ page }) => {
    await page.goto('/');

    // The demo route redirects to the ARC'S OPENING SCREEN (`DEMO_STAGES[0].screen`), not to a hardcoded
    // tab — so landing on Money is the evidence the run started rather than that a route existed.
    await expect(page).toHaveURL(/\/money/, { timeout: 15_000 });
    await expect(page.getByTestId('example-canvas-marker').first()).toBeVisible();

    // Chrome KEPT, unlike the capture build: the dock is the viewer's only way out of an embed, and it
    // carries the subscription disclosure.
    await expect(page.getByLabel(dockAt(1))).toBeVisible();
  });

  test('the run is SCRIPTED — the beats advance with no interaction at all', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(dockAt(1))).toBeVisible({ timeout: 15_000 });

    // Beat 2 lands 4s in (`DEMO_STAGES`). Nothing is clicked, scrolled or typed between these two lines —
    // that is the assertion. An `explore` run would sit on beat 1 forever and fail here, which is exactly
    // the confusion [D23] split the two runs to end.
    await expect(page.getByLabel(dockAt(2))).toBeVisible({ timeout: 15_000 });
  });
});
