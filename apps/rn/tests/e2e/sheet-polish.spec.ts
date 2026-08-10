import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 3.4.5 — FormSheet premium polish. Guards the two new dismissal affordances: the ✕-in-circle close
 * button, and swipe-down-to-dismiss (a touch pan on the grabber/header zone — driven via CDP touch,
 * since gesture-handler's pan needs touch, not a mouse drag).
 */

test.use({ viewport: { width: 402, height: 874 }, hasTouch: true, isMobile: true });

const SEED = scenario({
  debts: [{ id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
  prefs: { onboardingComplete: true, guardianIntroSeen: true },
});

async function openAddSheet(page: import('@playwright/test').Page) {
  await seedStore(page, SEED);
  await page.goto('/money');
  // 3.7.A10.1 [D22a] — Money's add rows no longer name a type; they open the chooser, which routes.
  // This spec is about the SHEET's dismissal affordances, so it takes the real user path to get one.
  await page.getByTestId('money-add').first().click();
  await page.getByTestId('add-choice-debt').click();
  await expect(page.getByText('Add a debt')).toBeVisible();
  await page.waitForTimeout(400); // let the spring-in settle
}

test('§3.4.5 the ✕-in-circle close button dismisses the sheet', async ({ page }) => {
  await openAddSheet(page);
  await page.getByTestId('sheet-close').click();
  await expect(page.getByText('Add a debt')).toHaveCount(0);
});

test('§3.4.5 swipe-down on the grabber dismisses the sheet', async ({ page }) => {
  await openAddSheet(page);
  // Drag the grabber handle (the ONLY drag zone — header buttons live outside the gesture so they
  // stay tappable on native; 3.4.5 device fix).
  const handle = page.getByTestId('sheet-drag-handle');
  const box = await handle.boundingBox();
  if (!box) throw new Error('no drag handle');
  const x = Math.round(box.x + box.width / 2);
  const yTop = Math.round(box.y + box.height / 2);

  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: yTop }] });
  for (let dy = 0; dy <= 260; dy += 20) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: yTop + dy }] });
    await page.waitForTimeout(12);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect(page.getByText('Add a debt')).toHaveCount(0);
});
