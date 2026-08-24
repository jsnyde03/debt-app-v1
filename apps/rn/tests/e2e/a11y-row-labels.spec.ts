import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7f.4 (A1-7 · A1-8) — what a `ListRow` actually says, and what it should not be saying at all.
 *
 * Both defects were found by dumping the accessibility tree and reading it, and neither is visible from a
 * screenshot: the row's spoken name silently dropped its badges, and the swipe-revealed Delete pane sat in
 * the tree at rest, announced BEFORE the row it belongs to. A destructive action for a debt the user has
 * not been told about yet is the wrong first thing to meet.
 *
 * ⚠️ The absence check below is deliberately paired with a presence check on the same page. An assertion
 * that something is not there passes just as happily against a page that has not rendered — this repo has
 * shipped two specs that stayed green with the defect planted back for exactly that reason.
 */
test.describe('a11y — what a list row announces', () => {
  test.use({ viewport: { width: 440, height: 956 } });

  test('the badges are part of the row’s name, and the swipe Delete is not in the tree', async ({ page }) => {
    await seedStore(page, scenario());
    await page.goto('/money');

    // Presence first: the row exists, and its name carries the badge word that `groupLabel` used to drop.
    // The badge is the ONLY place the word appears — `meta` is the balance and the APR — so a name that
    // contains it cannot have come from anywhere else.
    const row = page.getByRole('button', { name: /^Card, Focus,/ });
    await expect(row).toBeVisible();

    // …and only now the absence. The pane mounts with the row, so if it were still exposed it would be on
    // this page, in this state, with no interaction needed to reveal it.
    await expect(page.getByRole('button', { name: 'Delete Card' })).toHaveCount(0);
  });
});
