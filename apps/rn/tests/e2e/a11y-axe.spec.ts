import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

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

  // ⛔ EXPLICIT ATTRIBUTE ASSERTIONS, BECAUSE `violations()` CANNOT SEE THIS CLASS. axe checks that an
  // attribute is *valid for its role*; it has no opinion about a state attribute that was never emitted.
  // So a control announcing its role and never its state passes every scan in this file — which is how
  // the slider shipped with no `aria-valuenow` (3.5.7.1) and how these two shipped with no state at all.
  //
  // ⚡ MEASURED 2026-08-17: react-native-web 0.21.2 has NO `accessibilityState` → `aria-*` mapping (the
  // name appears in its `dist/` only in `TouchableWithoutFeedback`'s forwarded-props list and in the
  // legacy plural `accessibilityStates`), so every longhand site was dropped silently on web. 13 sites in
  // 11 files carried it; these are the two the marketing embed's surface renders.
  test('a segmented control reports WHICH segment is chosen, not just that it exists', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/money');
    // `radio` inside a `radiogroup`, not a row of buttons: `aria-selected` is ignored on a button and
    // `aria-pressed` is not in RN's aria vocabulary, so the role is load-bearing for the state to mean
    // anything. See the note in `SegmentedToggle`.
    const group = page.getByRole('radiogroup').first();
    await expect(group).toBeVisible();
    const chosen = group.getByRole('radio', { checked: true });
    await expect(chosen).toHaveCount(1);
    // …and it tracks the selection rather than being hardcoded true on the first segment.
    const first = await chosen.textContent();
    await group.getByRole('radio', { checked: false }).first().click();
    await expect.poll(() => group.getByRole('radio', { checked: true }).textContent()).not.toBe(first);
  });

  test('a checkbox reports whether it is checked', async ({ page }) => {
    // ⛔ A SEEDED DUE OBLIGATION, NOT THE DEFAULT PERSONA. Against `newUser()` this finds no action rows
    // and skips — a green run that asserts nothing, which is defect class ① ("an assertion that passes
    // either way") landing inside the very test written to close a silent gap. The seed is
    // `swipe-mark-paid.spec.ts`'s, which is known to render a required row: a `dueDate` inside the cycle
    // and a `nextPaycheckDate` that has not passed.
    await seedStore(
      page,
      newUser({
        paycheck: { amount: '2000', nextPaycheckDate: day(10) },
        requiredExpenses: [
          { id: 'e0', name: 'Power', amount: 90, dueDate: day(3), recurrence: 'monthly', category: 'utilities' },
        ],
        prefs: { onboardingComplete: true, guardianIntroSeen: true },
      }),
    );
    await page.goto('/');
    // Today's Required/Recommended action rows are the `CheckCircle` sites, and they are in the embed's
    // surface. The attribute's PRESENCE is the assertion — its absence was the defect, and axe is blind
    // to it because an attribute that was never emitted violates no rule.
    const box = page.getByRole('checkbox').first();
    await expect(box).toBeVisible();
    await expect(box).toHaveAttribute('aria-checked', 'false');
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

  /**
   * 3.5.6.2 — the coach-marks. 3.5's third discovery surface, and the only one this scanner never saw:
   * the cases above cover the tutorial and the demo, and the sheet case opens a sheet with no mark up.
   *
   * A mark is an `accessibilityRole="alert"` overlay that deliberately does NOT fence the screen ("a hint
   * is not a modal"), which is the opposite posture from every other case here — so the invariant worth
   * checking is that the thing underneath stays fully reachable while an alert is live.
   */
  test('a coach-mark on a screen — a live alert that fences nothing', async ({ page }) => {
    await seedStore(page, newUser());
    await page.goto('/progress');
    await expect(page.getByTestId('coach-mark')).toHaveCount(1);
    expect(await violations(page)).toEqual([]);
  });

  test('a coach-mark inside a sheet — the alert the Modal owns', async ({ page }) => {
    // The nested host (3.5.5.5). Two copies of this alert would be met TWICE by a screen reader, which is
    // an a11y defect long before it is a drawing one — and `aria-hidden-focus` is exactly the rule a
    // second, hidden-but-focusable copy behind a Modal would trip.
    //
    // ⚠️ COMPACT on purpose. At this file's default desktop width Money is the iPad master-detail, where
    // the debt form is an in-tree PANE and there is no Modal at all — so the nested host never mounts and
    // the root layer legitimately owns the mark. The Modal path is a compact-layout claim, and asserting
    // it at desktop width tests a layout that does not have the thing being asserted.
    await page.setViewportSize({ width: 440, height: 956 });
    await seedStore(page, newUser());
    await page.goto('/money');
    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();
    await expect(page.getByTestId('sheet-modal-root').getByTestId('coach-mark')).toHaveCount(1);
    expect(await violations(page)).toEqual([]);
  });
});
