import path from 'path';

import { test } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

/**
 * 3.5.10 — the explore demo, on the screens a user can now reach.
 *
 * The assertions cover the fences; these cover the thing no assertion can — whether a screen carrying
 * fake money, a live tab bar and a quiet way out reads as an honest sandbox rather than a broken app.
 */
const OUT = path.resolve(__dirname, '../../capture-ref/explore-demo');

test.use({ viewport: { width: 402, height: 874 } });

const COLD = (theme: string) =>
  scenario({ debts: [], paycheck: { amount: '' }, subscriptionPlan: 'free', prefs: { onboardingComplete: false, themeMode: theme } });

for (const theme of ['light', 'dark'] as const) {
  test(`explore: the three tabs a user can walk (${theme})`, async ({ page }) => {
    await seedStore(page, COLD(theme));
    await page.goto('/demo');
    await page.waitForURL(/money/, { timeout: 15_000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `money-${theme}.png`) });

    await page.getByTestId('tab-today').click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `today-${theme}.png`) });

    await page.getByTestId('tab-progress').click();
    await page.waitForTimeout(1200); // the ring + trajectory paint
    await page.screenshot({ path: path.join(OUT, `progress-${theme}.png`) });
  });
}
