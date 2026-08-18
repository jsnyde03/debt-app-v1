import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * 3.4.4 — swipe-to-delete on list rows. gesture-handler's pan is a TOUCH gesture (a mouse drag doesn't
 * activate it — nor would a real user expect it to on a phone), so this drives real touch events via CDP:
 * swipe a debt row left → the red Delete reveals → tap it → the destructive confirm → the row is removed.
 */

test.use({ viewport: { width: 402, height: 874 }, hasTouch: true, isMobile: true });


const SEED = scenario({
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: '2026-08-20', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' },
  ],
  prefs: { onboardingComplete: true, guardianIntroSeen: true },
});

test('§3.4.4 swipe-to-delete reveals Delete and removes the row after confirm', async ({ page }) => {
  page.on('dialog', (d) => d.accept()); // accept the destructive confirm (window.confirm on web)
  await seedStore(page, SEED);
  await page.goto('/money');

  const row = page.getByText('Visa', { exact: true }).first();
  await expect(row).toBeVisible();
  const box = await row.boundingBox();
  if (!box) throw new Error('no row box');
  const cy = Math.round(box.y + box.height / 2);

  const client = await page.context().newCDPSession(page);
  const touch = (type: string, x?: number) =>
    client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || x === undefined ? [] : [{ x, y: cy }] });

  // Swipe the row left to reveal the right-side Delete action.
  await touch('touchStart', 360);
  for (let x = 360; x >= 120; x -= 20) {
    await touch('touchMove', x);
    await page.waitForTimeout(15);
  }
  await page.waitForTimeout(200);
  // A swipe, not a tap — the edit sheet must NOT have opened.
  await expect(page.getByText('Edit debt')).toHaveCount(0);
  await touch('touchEnd');

  // Tap the revealed Delete → confirm → the Visa row is gone (Car remains).
  const del = page.getByText('Delete', { exact: true }).first();
  const dbox = await del.boundingBox();
  if (!dbox) throw new Error('Delete not revealed');
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(dbox.x + dbox.width / 2), y: Math.round(dbox.y + dbox.height / 2) }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect(page.getByText('Visa', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Car', { exact: true })).toBeVisible();
});

/**
 * T3.6 (audit L5-5) — deleting a bill while searching used to strand an invisible filter.
 *
 * The search field rendered on `grouped` (>= 8 expenses) alone, while the un-grouped branch still
 * FILTERED by `query`. Delete a bill mid-search, the count drops below the threshold, and the field
 * unmounts with its query still live: one row (or "No bills match") and no control to clear it. The
 * only way out was leaving the tab.
 *
 * The invariant: never unmount the only control that can undo a state the user is still in.
 */
test('the search field survives dropping below the grouping threshold', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  // Exactly 8 -> grouped, so the field renders; deleting one drops it to 7 and un-groups the list.
  const bills = Array.from({ length: 8 }, (_, i) => ({
    id: `e${i}`, name: i === 0 ? 'Netflix' : `Bill ${i}`, amount: 20, dueDate: day(4),
    recurrence: 'monthly', category: 'subscriptions',
  }));
  await seedStore(page, scenario({ requiredExpenses: bills }));
  await page.goto('/money');
  await page.waitForTimeout(500);
  // Money opens on Debts; the bill list (and its search) lives under Expenses.
  await page.getByRole('radio', { name: 'Expenses' }).click();
  await page.waitForTimeout(400);

  const search = page.getByPlaceholder('Search expenses');
  await expect(search).toBeVisible();
  await search.fill('Netflix');
  await page.waitForTimeout(300);

  // Delete a bill through the real UI while the query is live — the state L5-5 describes. Storage
  // cannot be poked here: the app has already hydrated, so a localStorage write would change nothing
  // and the assertions below would pass without the fix.
  const row = page.getByText('Netflix', { exact: true }).first();
  await row.scrollIntoViewIfNeeded();
  const box = await row.boundingBox();
  if (!box) throw new Error('no row box');
  const cy = Math.round(box.y + box.height / 2);
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 360, y: cy }] });
  for (let x = 360; x >= 120; x -= 20) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: cy }] });
    await page.waitForTimeout(15);
  }
  await page.waitForTimeout(200);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const del = page.getByText('Delete', { exact: true }).first();
  const dbox = await del.boundingBox();
  if (!dbox) throw new Error('Delete not revealed');
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(dbox.x + dbox.width / 2), y: Math.round(dbox.y + dbox.height / 2) }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(400);

  // Now below the threshold, with the query still live: the field must still be here, and clearable.
  await expect(search).toBeVisible();
  await expect(page.getByLabel('Clear search')).toBeVisible();
});
