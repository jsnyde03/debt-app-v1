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

test('a not-yet-onboarded user reaches the demo, and it is contained', async ({ page }) => {
  await seedStore(page, NOT_ONBOARDED);
  await page.goto('/demo');

  // 1 — admitted. Today renders rather than onboarding, and it is showing the persona's money: the
  // sandbox seeds a paycheck this user does not have, so any figure at all proves the sandbox is live.
  await expect(page.getByText('Payday Guardian')).toBeVisible({ timeout: 15_000 });
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

  // 3b — the tabs are held. Press Money and assert we are still on Today; the demo must not be one tap
  // from the real, empty plan. (`holdTabs` preventDefaults the press, so the URL never changes.)
  await page.getByTestId('tab-money').click();
  await expect(page).not.toHaveURL(/money/);
  await expect(page.getByText('Payday Guardian')).toBeVisible();
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

test('the walkthrough does not double the marker', async ({ page }) => {
  // A walkthrough renders sandbox money too, so a marker keyed on the MONEY would show alongside the
  // dock's own "Example money" line. Two disclosures is the chrome [D6] refused.
  await seedStore(page, scenario({ prefs: { onboardingComplete: true, tutorialSeen: false } }));
  await page.goto('/tutorial');

  await expect(page.getByTestId('tutorial-progress')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('example-canvas-marker')).toHaveCount(0);
});
