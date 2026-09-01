import { expect, test, type Page } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * 3.7.B.4 [D28] — swipe-to-mark-paid on Today's required rows.
 *
 * Same instrument as §3.4.4's swipe-to-delete, for the same reason: gesture-handler's pan is a TOUCH
 * gesture, and a Playwright MOUSE drag registers as a tap. Driven with real touch events over CDP.
 *
 * What these pin is that the swipe is an ACCELERATOR and not a second, divergent write path: it marks the
 * same row the checkbox marks, it undoes, it is absent wherever the checkbox is absent — and it stays OUT
 * of the accessibility tree, because the checkbox is the accessible path and two controls for one action
 * on every row is how a screen reader ends up announcing every bill twice.
 *
 * ⚠️ Rows are addressed by `data-testid`, never by the action's visible text: every markable row keeps its
 * action pane mounted, so `getByText('Paid').first()` resolves to whichever row is first in the DOM and
 * would silently mark a different bill than the one under test — while still going green.
 */

test.use({ viewport: { width: 402, height: 874 }, hasTouch: true, isMobile: true });

const SEED = scenario({
  paycheck: { amount: '2000', nextPaycheckDate: day(10) },
  requiredExpenses: [
    { id: 'e0', name: 'Power', amount: 90, dueDate: day(3), recurrence: 'monthly', category: 'utilities' },
  ],
  prefs: { onboardingComplete: true },
});

const POWER_ACTION = 'swipe-mark-expense-e0';

/**
 * Swipe a row left far enough to reveal its right-side action.
 *
 * ⚠️ `scrollIntoViewIfNeeded` is load-bearing, not tidiness. CDP touch coordinates are VIEWPORT-relative,
 * and Required Actions sits far down Today — the row measured at y≈1588 in an 874-tall viewport, so the
 * dispatched touch landed on nothing at all. The gesture never activated, the row never translated, and
 * the failure surfaced as "the checkbox intercepts pointer events", which reads like a z-order bug and is
 * nothing of the sort. §3.4.4's swipe-to-delete never hit this only because its row is near the top of
 * /money. Measure the box AFTER scrolling.
 */
async function swipeLeft(page: Page, label: string) {
  const row = page.getByText(label, { exact: true }).first();
  await expect(row).toBeVisible();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const box = await row.boundingBox();
  if (!box) throw new Error(`no box for ${label}`);
  const cy = Math.round(box.y + box.height / 2);

  const client = await page.context().newCDPSession(page);
  // ⚠️ The CDP union, not `string` — a typo in one of the four values would dispatch nothing while the
  // test read as a swipe that did not work. [P6.8.9.7.11.13.3]
  const touch = (type: 'touchStart' | 'touchEnd' | 'touchMove' | 'touchCancel', x?: number) =>
    client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || x === undefined ? [] : [{ x, y: cy }] });

  await touch('touchStart', 360);
  for (let x = 360; x >= 120; x -= 20) {
    await touch('touchMove', x);
    await page.waitForTimeout(15);
  }
  await page.waitForTimeout(250);
  await touch('touchEnd');
  await page.waitForTimeout(150); // let the row settle open before anything is tapped
  return client;
}

test('the swipe marks a required row paid, and the same gesture undoes it', async ({ page }) => {
  await seedStore(page, SEED);
  await page.goto('/');

  const label = page.getByText('Pay Power', { exact: true }).first();

  // ⚠️ NOT asserted via the checkbox's checked state: `CheckCircle` sets `accessibilityState={{checked}}`
  // and react-native-web does not render it as `aria-checked`, so on web the control reports no state at
  // all (the same prop-allowlist trap `utils/a11y.ts` documents). Native is unverified → device pass.
  // The strike-through and the action's own label both derive from the STORE, so they prove the write.
  await expect(label).toHaveCSS('text-decoration-line', 'none');

  const client = await swipeLeft(page, 'Pay Power');
  await expect(page.getByTestId(POWER_ACTION)).toHaveText('Paid');
  await page.getByTestId(POWER_ACTION).tap();

  await expect(label).toHaveCSS('text-decoration-line', 'line-through');
  // …and the row is still on screen, struck through rather than vanished (B.1).
  await expect(label).toBeVisible();

  // The same gesture reverses it, with no confirm — this is not swipe-to-delete.
  const undoClient = await swipeLeft(page, 'Pay Power');
  await expect(page.getByTestId(POWER_ACTION)).toHaveText('Undo');
  await page.getByTestId(POWER_ACTION).tap();
  await expect(label).toHaveCSS('text-decoration-line', 'none');

  await client.detach();
  await undoClient.detach();
});

test('a CLOSED row keeps its action out of the a11y tree and out of the tab order', async ({ page }) => {
  await seedStore(page, SEED);
  await page.goto('/');

  // The pane is mounted on every markable row whether or not that row is open — that is how the reveal
  // animates. Left exposed it would announce a second control for every bill on the page, and `inert`
  // keeps it off the Tab route too (aria-hidden alone leaves an RN-web Pressable at tabIndex 0, which is
  // the `aria-hidden-focus` failure — hidden from the reader AND focusable is worse than either alone).
  await expect(page.getByRole('button', { name: 'Mark paid' })).toHaveCount(0);
  await expect(page.getByTestId(`${POWER_ACTION}-fence`)).toHaveAttribute('inert', '');

  // Opened, it is a real control again — announced, and no longer inert.
  await swipeLeft(page, 'Pay Power');
  await expect(page.getByRole('button', { name: 'Mark paid' })).toHaveCount(1);
  await expect(page.getByTestId(`${POWER_ACTION}-fence`)).not.toHaveAttribute('inert', '');

  // Either way the checkbox is the accessible path, and it is announced exactly once.
  await expect(page.getByRole('checkbox', { name: 'Mark Pay Power paid' })).toHaveCount(1);
});

test('a healthy autopay row has no swipe action — the same rule that hides its checkbox', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      paycheck: { amount: '2000', nextPaycheckDate: day(10) },
      requiredExpenses: [
        { id: 'e1', name: 'Internet', amount: 70, dueDate: day(4), recurrence: 'monthly', category: 'utilities', isAutopay: true },
      ],
      prefs: { onboardingComplete: true },
    }),
  );
  await page.goto('/');

  // An autopay row reports its own state, so there is nothing to mark — and `canMark` drives BOTH the
  // absent checkbox and the absent swipe. That single predicate is the point: they cannot disagree.
  await swipeLeft(page, 'Reserve autopay for Internet');
  await expect(page.getByTestId('swipe-mark-autopay_expense-e1')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /Internet/ })).toHaveCount(0);
  await expect(page.getByText('Autopay', { exact: true })).toBeVisible();
});
