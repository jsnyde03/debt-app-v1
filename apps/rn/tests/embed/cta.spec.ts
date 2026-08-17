import { expect, test } from '@playwright/test';

/**
 * 3.5.7.7 — THE EMBED HAS ONE EXIT, AND IT GOES TO THE APP STORE.
 *
 * 🎯 approved 2026-08-17. The app's two dock exits are both wrong in a public embed: `/onboarding` is a
 * financial data-entry form inside a marketing iframe that discards what is typed (3.5.7.3 made the embed
 * sessionStorage-only), and `/paywall`'s purchase path is stubbed on web (3.5.7.2). Neither can do the
 * thing its label promises here.
 *
 * ⚠️ RUNS AGAINST THE EMBED BUILD. `EXPO_PUBLIC_EMBED` is inlined by the bundler, so this file asserts a
 * branch that does not exist in `dist/`. Its counterpart lives in the MAIN suite —
 * `demo-containment.spec.ts` drives `/demo?mode=scripted` against the app build and asserts both original
 * exits are still there. ⭐ **The two suites together are the discrimination proof**: the swap is gated on
 * the build flag, not on the mode, and a regression in either direction reds exactly one of them.
 */

const dockAt = (n: number) => new RegExp(`Demonstration, ${n} of \\d+\\.`);

test.describe("the embed's only way out is the App Store", () => {
  test('the CTA is a real link to the real listing, opening in a new tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(dockAt(1))).toBeVisible({ timeout: 15_000 });

    const cta = page.getByTestId('embed-app-store-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText('Get it on the App Store');

    // ⛔ THE ELEMENT, NOT JUST THE TEXT. A `div` with an onClick would satisfy every assertion above and
    // still be broken in the place this ships — a sandboxed iframe blocks `window.open` silently, and
    // ⌘-click / middle-click / "copy link" do not exist on a div. The anchor IS the feature.
    await expect(cta).toHaveJSProperty('tagName', 'A');
    await expect(cta).toHaveAttribute('href', 'https://apps.apple.com/us/app/paycheck-debt-planner/id6773201250');
    await expect(cta).toHaveAttribute('target', '_blank');
    // Without `noopener` the App Store tab gets a handle on this page.
    await expect(cta).toHaveAttribute('rel', /noopener/);
  });

  test('neither of the app\'s exits survives here', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('embed-app-store-cta')).toBeVisible({ timeout: 15_000 });

    // Both are correct in the app and wrong in an embed. Asserting their ABSENCE is what stops the swap
    // being reverted by a well-meaning "restore the exits" change without anything going red.
    await expect(page.getByText('Start my real plan', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Unlock Premium', { exact: true })).toHaveCount(0);
  });

  test('the privacy claim is on screen beside the ask', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(dockAt(1))).toBeVisible({ timeout: 15_000 });

    // 3.5.7.9's settled wording, and it is exactly what `zero-egress.spec.ts` enforces on every push —
    // the point of [D32]'s "a gate, not a promise". If that line is ever softened or removed, this reds.
    await expect(page.getByTestId('embed-privacy-line')).toHaveText('Your money stays on your device.');
  });
});
