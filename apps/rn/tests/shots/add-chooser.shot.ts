import path from 'path';

import { test } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

/**
 * 3.7.A10.1 — the add chooser, both themes, and the empty state that now routes through it.
 *
 * Evidence only. The routing itself is asserted in `money-add-chooser.spec.ts`; these frames exist
 * because the whole point of the change is whether a stranger can tell which one is theirs at a glance,
 * and no assertion can answer that.
 */
const OUT = path.resolve(__dirname, '../../capture-ref/add-chooser');

test.use({ viewport: { width: 402, height: 874 } });

for (const theme of ['light', 'dark'] as const) {
  test(`the chooser (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: true, themeMode: theme } }));
    await page.goto('/money');
    await page.getByTestId('money-add').first().click();
    await page.getByText('What are you adding?').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `chooser-${theme}.png`) });
  });

  test(`the EMPTY Money screen, which is where a stranger starts (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({ debts: [], prefs: { onboardingComplete: true, themeMode: theme } }));
    await page.goto('/money');
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `empty-${theme}.png`) });
  });
}
