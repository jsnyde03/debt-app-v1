import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * Accessibility-tree invariants, checked by a scanner rather than by assertions someone remembered to
 * write.
 *
 * Every other spec in this suite queries by text or testID, which match straight THROUGH `aria-hidden`,
 * and `toBeVisible()` is CSS-based — so none of them can observe whether anything is actually in the
 * accessibility tree. That blind spot let a whole class of fences ship as no-ops on web.
 *
 * `aria-hidden-focus` is the load-bearing rule: hidden from a screen reader while still reachable by Tab
 * is worse than either alone, because focus lands on something that announces nothing. It is also the
 * rule a hand-written fence gets wrong, since `aria-hidden` and tab order are separate questions on web.
 */

const RULES = ['aria-hidden-focus', 'aria-hidden-body', 'aria-valid-attr-value', 'aria-required-children'];

const newUser = (over: Record<string, unknown> = {}) =>
  scenario({ prefs: { onboardingComplete: true, ...(over.prefs as object) }, ...over });

async function violations(page: import('@playwright/test').Page) {
  // `[inert]` excluded: axe does not model the attribute, so it reports an inert subtree that still
  // contains controls as `aria-hidden-focus` — but the browser genuinely removes an inert subtree from
  // both the tab order and the accessibility tree. The exclusion is only safe because the
  // "keyboard focus cannot enter a fenced region" test below proves it by tabbing, rather than trusting
  // the attribute's presence.
  const res = await new AxeBuilder({ page }).exclude('[inert]').withRules(RULES).analyze();
  // `incomplete` as well as `violations`, and this is load-bearing rather than belt-and-braces.
  //
  // When one element covers ≥75% of the viewport, axe's `isModalOpen` heuristic fires
  // (`axe-core@4.12.1/axe.js:17660`, `modalPercent = .75`) and both of `aria-hidden-focus`'s focus
  // checks return `undefined` — "needs review" — instead of failing (`focusableNotTabbableEvaluate`,
  // `axe.js:26381`). A full-screen fence is exactly that shape, so checked against `violations` alone
  // this scanner stayed green on a full-viewport aria-hidden tab stop: green on the precise defect it
  // was installed to catch. Verified by reintroducing that defect and watching this go red.
  //
  // ⚠️ Not a general rule about focusable elements inside `aria-hidden` — a normally-sized trapped
  // control IS reported as a violation. It is specifically the full-screen case that hides in `incomplete`.
  return [...res.violations, ...res.incomplete].map(
    (x) => `${x.id}: ${x.nodes.map((n) => n.html.slice(0, 120)).join(' | ')}`,
  );
}

/**
 * Tab repeatedly; assert focus never lands inside a fenced region.
 *
 * `inert` is what fences a region's TAB ORDER, and axe does not model it — it reports an inert subtree
 * containing controls as `aria-hidden-focus`, which is why those subtrees are excluded from the scans.
 * An exclusion is only honest if the thing excluded is actually safe, so this proves it directly rather
 * than trusting the attribute's presence. If `inert` stops working, or is dropped from a fence, this
 * fails even though the scanner would not.
 *
 * A helper, and called in BOTH states the scanner visits, because the two states fence by different
 * means: on a scripted beat the screen fence carries `inert`; on an interactive beat that fence is open
 * by design and the only tab-order fence left is the one on the non-coached controls.
 */
async function focusNeverEntersAFence(page: import('@playwright/test').Page) {
  expect(await page.locator('[inert]').count()).toBeGreaterThan(0); // the fence is really there
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('[inert],[aria-hidden="true"]'),
    );
    expect(inside, `focus entered a fenced region after ${i + 1} tabs`).toBe(false);
  }
}

test.describe('a11y tree invariants', () => {
  test('Today — the ordinary app, no walkthrough', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/');
    expect(await violations(page)).toEqual([]);
  });

  test('the demo — a new surface with its own dock and marker', async ({ page }) => {
    // 3.5.4.10. Worth its own case rather than assuming Today's coverage carries: the demo renders a dock
    // Today does not have, a canvas marker with a `header` role, and it is reached by an audience who has
    // completed no onboarding — so nothing else in this suite has scanned this combination.
    await seedStore(page, newUser({ prefs: { onboardingComplete: false } }));
    await page.goto('/demo');
    await expect(page.getByTestId('example-canvas-marker')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('a sheet — where the shared backdrop lives', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/');
    await page.getByText('Add extra income').click();
    // The sheet must actually be open, or this scans a screen with no backdrop on it and passes for the
    // wrong reason. Verified by reintroducing the backdrop defect and confirming this case goes red.
    await expect(page.getByTestId('sheet-close')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('a scripted beat — the coached screen is fenced', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('an interactive beat — the fence is open', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('Your line');
    expect(await violations(page)).toEqual([]);
    // The screen fence is open here BY DESIGN, so `inert` on the non-coached controls is the only
    // tab-order fence left — and that is the state in which excluding `[inert]` from the scan was
    // being taken on trust.
    await focusNeverEntersAFence(page);
  });

  test('keyboard focus cannot enter a fenced region — a scripted beat', async ({ page }) => {
    await seedStore(page, newUser({ prefs: { onboardingComplete: true, tutorialSeen: 'premium' } }));
    await page.goto('/tutorial');
    await expect(page.getByTestId('tutorial-overlay')).toBeVisible();
    await focusNeverEntersAFence(page);
  });
});
