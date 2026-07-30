import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.5.1 — the tutorial invitation + reachability.
 *
 * Two things are worth proving in a real browser rather than a unit test. First, the invitation actually
 * reaches Today and leads somewhere — the matrix is unit-tested, but a selector returning the right
 * answer proves nothing if the card never renders. Second, and more importantly, this is the FIRST time
 * the Phase-3.5 sandbox is rendered by React at all: everything through 3.5.0 was unit-proven but never
 * render-proven, so `useSandboxStore` driving live values on screen is the assertion that closes that gap.
 */
test.use({ viewport: { width: 402, height: 874 } });

const newUser = (over: Record<string, unknown> = {}) =>
  scenario({ prefs: { onboardingComplete: true }, ...over });

test.describe('tutorial invitation (3.5.1)', () => {
  test('a new user is invited on Today, and it opens the walkthrough', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/');

    const invite = page.getByTestId('tutorial-invite');
    await expect(invite).toBeVisible();
    // Says up front it's example money — the honesty framing the taught tight/at-risk states need.
    await expect(page.getByText(/example numbers/)).toBeVisible();

    await page.getByText('Show me').click();
    await expect(page).toHaveURL(/\/tutorial/);
    // By ROLE: the card says "See how your Guardian works" and the screen is titled "How your Guardian
    // works", so a text match hits both. The overlap is deliberate continuity — the destination echoes
    // the invitation — so the selector adapts, not the copy.
    await expect(page.getByRole('heading', { name: 'How your Guardian works' })).toBeVisible();
  });

  test('the tutorial renders live SANDBOX values (first real render of the substrate)', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/tutorial');

    // The scaffold prints values read through `useSandboxStore`. If the binding were broken these would
    // be blank/undefined — which is exactly the failure 3.5.0's unit tests structurally could not catch.
    const proof = page.getByTestId('tutorial-sandbox-proof');
    await expect(proof).toBeVisible();
    // The frozen scenario base date, not today — proof it's the sandbox and not the real store.
    await expect(proof).toContainText('2026-03-02');
    await expect(proof).toContainText('cushion line $200');
  });

  test('"Not now" answers the offer — it does not return on the next visit', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/');
    await expect(page.getByTestId('tutorial-invite')).toBeVisible();

    await page.getByText('Not now').click();
    await expect(page.getByTestId('tutorial-invite')).toHaveCount(0);
    // NOTE: the "doesn't come back on a later launch" half is asserted in the UNIT suite, not here —
    // `seedStore` uses `addInitScript`, which re-injects the seeded blob on EVERY navigation, so a
    // cross-page check in this harness would only prove the seed re-ran. `markTutorialSeen` +
    // `selectTutorialInvite` cover the persistence semantics directly.
  });

  test('a user who has already seen their run is never invited', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/');
    await expect(page.getByText('Looks clear this paycheck')).toBeVisible(); // Today rendered
    await expect(page.getByTestId('tutorial-invite')).toHaveCount(0);
  });

  test('replay stays reachable after the offer is gone (card + More)', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/');

    // On the Guardian card…
    await page.getByTestId('guardian-replay-tutorial').click();
    await expect(page).toHaveURL(/\/tutorial/);

    // …and permanently in More, which is where someone looks when they've dismissed the card affordance.
    await page.goto('/more');
    await expect(page.getByText('How the Guardian works')).toBeVisible();
    await page.getByText('How the Guardian works').click();
    await expect(page).toHaveURL(/\/tutorial/);
  });
});
