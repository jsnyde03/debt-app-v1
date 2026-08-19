import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.7.A0 — reaching the payoff schedule.
 *
 * History: this feature was reported dead on device THREE times. It was a sheet opened from inside the
 * debt edit sheet, which on iOS meant either a nested Modal (never presented) or an absolute overlay
 * rendered as a SIBLING of the presented Modal (so it sat behind it). Both were invisible on device and
 * both passed on web, where everything is one DOM tree.
 *
 * So be honest about what this file can and cannot prove. It covers the JOURNEY and the wiring — the
 * entry exists, it navigates, the route renders the right debt's numbers. It CANNOT prove the device
 * presentation, because the web has no native Modal. That proof lives in the Maestro flow (iOS
 * Simulator, real UIKit presentation) and finally on hardware. The redesign is what makes the class
 * unreachable: there is no nested presentation left to fail.
 */
/**
 * The same tap resolves differently by layout, so both paths are locked. On compact it PUSHES the
 * route; on expanded it fills the master-detail pane, because a push would cover the split.
 */
test.describe('payoff schedule — compact (3.7.A0)', () => {
  test.use({ viewport: { width: 402, height: 874 } });

  test('the edit sheet offers a schedule entry that navigates to the route', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/money');

    // Open the seeded debt's editor.
    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();

    // The entry lives in the sheet BODY now, not the header (the header button was the dead one).
    const entry = page.getByTestId('debt-view-schedule');
    await expect(entry).toBeVisible();
    await entry.click();

    // It NAVIGATES — it does not open a sheet on top of a sheet.
    await expect(page).toHaveURL(/\/schedule\/d0/);
    await expect(page.getByText('Payoff schedule')).toBeVisible();
    // …and the sheet it came from is gone, so nothing can occlude the schedule.
    await expect(page.getByText('Edit debt')).toHaveCount(0);
  });
});

/**
 * [L5] The entry has to be REACHABLE, which is a different claim from the one above.
 *
 * `toBeVisible()` is satisfied by a node with a box anywhere in the document, and Playwright scrolls to
 * an element before clicking it — so the test above passed while the row sat below the fold on the
 * largest iPhone at default type, with a destructive Remove as its nearest neighbour. An entry nobody
 * scrolls to is the defect 3.7.A0 moved it to fix.
 *
 * ⚠️ **This deliberately does NOT assert viewport coordinates.** The web renders the sheet in normal
 * document flow, so the row's absolute `y` tracks the height of the Money list behind it, not any real
 * sheet position — the same "web has no native Modal" limit this file's header opens with. An earlier
 * draft asserted `y + height <= viewportH` and passed only by an accident of document height.
 *
 * What the web CAN prove is the structural change, which is the whole fix: the row is no longer a child
 * of the scrolling field body, so no amount of form content can push it out of reach. Where it lands in
 * device points stays the Maestro lane's question.
 */
test.describe('payoff schedule — the entry is reachable without scrolling [L5]', () => {
  // iPhone 17 Pro Max logical points — the device the L5 hierarchy dump came from.
  test.use({ viewport: { width: 440, height: 956 } });

  test('the schedule entry sits outside the scrolling body, ahead of the sticky actions', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/money');
    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();

    const facts = await page.evaluate(() => {
      const entry = document.querySelector('[data-testid="debt-view-schedule"]');
      if (!entry) return null;
      // Walk up looking for a scroll container — that ancestry is precisely what the fix removed.
      let insideScroll = false;
      for (let n = entry.parentElement; n; n = n.parentElement) {
        const oy = getComputedStyle(n).overflowY;
        if (oy === 'auto' || oy === 'scroll') { insideScroll = true; break; }
      }
      const label = (t: string) =>
        Array.from(document.querySelectorAll('div,span')).find(
          (n) => n.textContent?.trim() === t && n.children.length === 0,
        );
      const follows = (a: Element | undefined, b: Element | undefined) =>
        !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return {
        insideScroll,
        saveAfterEntry: follows(entry, label('Save')),
        removeAfterSave: follows(label('Save')!, label('Remove')),
      };
    });

    if (!facts) throw new Error('the sheet did not render the schedule entry');

    // The fix: pinned below the fields rather than last in the scroll.
    expect(facts.insideScroll).toBe(false);
    // And the destructive control is no longer its nearest neighbour — the submit sits between them.
    expect(facts.saveAfterEntry).toBe(true);
    expect(facts.removeAfterSave).toBe(true);
  });

  /**
   * 3.5.5.5 — the entry is also the first coach-mark subject, and the mark is rendered by a layer
   * `FormSheet` mounts INSIDE its Modal (the root layer would sit behind a presented Modal on device).
   *
   * ⚠️ Web proves the wiring only — the copy resolves, the layer renders, the control stays live under
   * it. It cannot prove the layering it exists for, because react-native-web has no native Modal. That
   * proof is the Maestro lane's.
   */
  test('the schedule entry carries its coach-mark, and the control stays live under it', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/money');
    await page.getByText('Card', { exact: true }).first().click();

    await expect(page.getByText('See the whole payoff')).toBeVisible();
    await expect(page.getByText('Every payment from here to debt-free, month by month.')).toBeVisible();

    // A hint, not a modal: the thing it names is still tappable while it is up.
    await page.getByTestId('debt-view-schedule').click();
    await expect(page).toHaveURL(/\/schedule\/d0/);
  });
});

test.describe('payoff schedule — expanded/iPad (3.7.A0)', () => {
  test.use({ viewport: { width: 1194, height: 834 } });

  test('the schedule fills the DETAIL PANE instead of pushing a route over the split', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/money');

    await page.getByText('Card', { exact: true }).first().click();
    await expect(page.getByText('Edit debt')).toBeVisible();
    await page.getByTestId('debt-view-schedule').click();

    // Stays on /money — the split is preserved, the schedule renders beside the list…
    await expect(page).toHaveURL(/\/money/);
    await expect(page.getByText(/debt-free ·/)).toBeVisible();
    // …and the pane has ONE owner: the editor it replaced is gone.
    await expect(page.getByText('Edit debt')).toHaveCount(0);
    // The master list is still there next to it — that's the point of not pushing.
    await expect(page.getByText('Card', { exact: true }).first()).toBeVisible();
  });
});

test.describe('payoff schedule route (3.7.A0)', () => {
  test.use({ viewport: { width: 402, height: 874 } });

  test('the route renders the schedule for the requested debt', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/schedule/d0');

    await expect(page.getByText('Payoff schedule')).toBeVisible();
    await expect(page.getByText('Card', { exact: true }).first()).toBeVisible();
    // A real derived schedule: the debt-free echo + at least one month row with a balance.
    await expect(page.getByText(/debt-free ·/)).toBeVisible();
    await expect(page.getByText(/interest ·/).first()).toBeVisible();
  });

  test('entered COLD (deep link, no history), back still goes somewhere', async ({ page }) => {
    await seedStore(page, scenario());
    // Straight to the route — no navigation history behind it, which `router.back()` alone can't handle.
    await page.goto('/schedule/d0');
    await expect(page.getByText('Payoff schedule')).toBeVisible();

    await page.getByRole('button', { name: /back/i }).first().click();
    await expect(page).toHaveURL(/\/money/);
  });

  test('an unknown debt id degrades gracefully instead of crashing the route', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/schedule/does-not-exist');

    await expect(page.getByText('Payoff schedule')).toBeVisible();
    await expect(page.getByText('No schedule to show.')).toBeVisible();
  });
});

/**
 * [T5 · L3-4] The composition caption — "what is this payment made of?"
 *
 * The caption used to branch on `isFocus`, which establishes only that this debt is FIRST IN PAYOFF
 * ORDER. It says nothing about whether any extra reaches it, and `monthlyExtra` is legitimately $0
 * whenever the steady-state plan has nothing spare after bills, minimums and the cushion floor. The
 * focus debt of a tight plan therefore read "minimum + your extra" over a payment that was exactly the
 * minimum — on the one screen whose entire job is to break the payment down.
 *
 * ⚠️ Both directions are asserted deliberately. A one-sided test passes an implementation that hardcodes
 * "the minimum", which trades one false caption for another.
 */
test.describe('payoff schedule — the payment composition is true [L3-4]', () => {
  /** Tight: $650 − $350 bill − $100 minimum − $200 cushion floor = $0 spare, so no extra is deployed. */
  const TIGHT = { paycheck: { amount: '650' } };

  test('a tight plan calls the focus debt payment what it is — the minimum', async ({ page }) => {
    await seedStore(page, scenario(TIGHT));
    await page.goto('/schedule/d0');
    await expect(page.getByText('Payoff schedule')).toBeVisible();

    await expect(page.getByText(/Paying .* — the minimum/)).toBeVisible();
    // The claim under test: it must NOT credit the user with an extra the plan is not sending.
    await expect(page.getByText(/your extra/)).toHaveCount(0);
  });

  test('a plan with real spare still says the extra is in there', async ({ page }) => {
    // The default scenario has $1,350 spare, and one debt — so it is the focus and the extra reaches it.
    await seedStore(page, scenario());
    await page.goto('/schedule/d0');
    await expect(page.getByText('Payoff schedule')).toBeVisible();

    await expect(page.getByText(/Paying .* — minimum \+ your extra/)).toBeVisible();
  });
});
