import { expect, test, type Page } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7g.5 (audit C7 / [D59]) — snowball vs avalanche, compared by the clear ORDER.
 *
 * ⛔ **[D59] settled that this shows the order and NOT a second curve**, because the two total-balance
 * curves were measured at <0.1% apart on most portfolios. So the assertions here are about the two
 * ORDERS being on screen and being distinguishable — a spec that only checked "the section opened" would
 * pass over a comparison that rendered the same list twice.
 *
 * ⚠️ **And one asserts an ABSENCE with a render barrier first**, because `toHaveCount(0)` is satisfied by
 * a blank page — the trap that bit two specs in cluster c.
 */
test.use({ viewport: { width: 402, height: 874 } });

/** Two debts whose snowball and avalanche orders genuinely disagree: small+cheap vs large+expensive. */
const diverging = () =>
  scenario({
    debts: [
      { id: 'd0', name: 'Tiny cheap', balance: 300, minimumPayment: 15, apr: 0, dueDate: day(7), type: 'debt', recurrence: 'monthly' },
      { id: 'd1', name: 'Huge expensive', balance: 9000, minimumPayment: 200, apr: 29.99, dueDate: day(9), type: 'debt', recurrence: 'monthly' },
    ],
    requiredExpenses: [],
    goals: [],
  });

async function openCompare(page: Page) {
  await page.goto('/progress');
  const toggle = page.getByTestId('strategy-compare-toggle');
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  await toggle.click();
  await expect(page.getByTestId('strategy-compare')).toBeVisible({ timeout: 10_000 });
}

test('the comparison is collapsed at rest — the resting card stays calm', async ({ page }) => {
  await seedStore(page, diverging());
  await page.goto('/progress');
  // ⛔ Render barrier FIRST: the toggle proves the card laid out, so the absence below is a real absence
  // rather than a blank page satisfying a count of zero.
  await expect(page.getByTestId('strategy-compare-toggle')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('strategy-compare')).toHaveCount(0);
});

test('both payoff orders are on screen, and they are not the same list', async ({ page }) => {
  await seedStore(page, diverging());
  await openCompare(page);

  const snowball = page.getByTestId('strategy-compare-snowball');
  const avalanche = page.getByTestId('strategy-compare-avalanche');
  await expect(snowball).toBeVisible();
  await expect(avalanche).toBeVisible();

  // ⛔ The whole point of the feature: on THIS portfolio the two orders differ, so the rendered lists must
  // differ too. Comparing the text of the two columns catches a column that renders the wrong strategy —
  // which is the defect a "both sections are visible" assertion sails straight past.
  const snowballText = (await snowball.innerText()).trim();
  const avalancheText = (await avalanche.innerText()).trim();
  expect(snowballText).not.toBe(avalancheText);

  // Snowball takes the smallest balance first; avalanche takes the most expensive. ⚠️ Asserted as ORDER
  // OF APPEARANCE rather than by line index — the column also renders a header and a debt-free date, so
  // an index is a proxy for the position and would move the first time the header gains a row.
  expect(snowballText.indexOf('Tiny cheap')).toBeLessThan(snowballText.indexOf('Huge expensive'));
  expect(avalancheText.indexOf('Huge expensive')).toBeLessThan(avalancheText.indexOf('Tiny cheap'));
});

test('the takeaway names the real difference and claims no dollar saving', async ({ page }) => {
  await seedStore(page, diverging());
  await openCompare(page);

  const takeaway = page.getByTestId('strategy-compare-takeaway');
  await expect(takeaway).toBeVisible();
  const text = (await takeaway.innerText()).trim();

  expect(text.length).toBeGreaterThan(0);
  // ⛔ [D59] — the interest advantage was never measured, so the app must not assert one. This is the
  // assertion that stops a later "helpful" edit from inventing a number about the user's money.
  expect(text).not.toMatch(/\$|interest|cheaper|save/i);
});

test('the user’s current strategy is named, not just coloured', async ({ page }) => {
  await seedStore(page, diverging());
  await openCompare(page);
  // Colour alone fails greyscale and a colour-blind reader, and it is the anchor for reading the other
  // column at all.
  await expect(page.getByTestId('strategy-compare')).toContainText('yours');
});
