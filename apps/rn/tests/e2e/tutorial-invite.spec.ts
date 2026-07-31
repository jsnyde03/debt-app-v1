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
      await page.getByText('Next', { exact: true }).click();
    }

    await expect(page.getByTestId('tutorial-progress')).toContainText(`Step ${total} of ${total}`);
    await expect(page.getByText('Finish', { exact: true })).toBeVisible();
    await page.getByText('Finish', { exact: true }).click();

    // Finishing ends the session and hands Today back — overlay gone, and Today is showing the user's
    // REAL plan again rather than the sandbox's. The sandbox's payday is MAR 16 (frozen 2026-03-02), so
    // its absence is the proof the provider unwound; the Guardian card confirms Today still renders.
    await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0);
    await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
    await expect(page.getByText(/MAR 16/i)).toHaveCount(0);
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
