import path from 'path';

import { test } from '@playwright/test';

import { day, scenario, seedStore } from '../e2e/helpers/seed';

/**
 * 3.7.A10.2 — the hint, next to the rent it must NOT accuse.
 *
 * The whole design risk is tone: this is the app guessing about someone's money, so it has to read as a
 * question they can wave off, not a warning they have to answer. No assertion can judge that.
 */
const OUT = path.resolve(__dirname, '../../capture-ref/misfiled');

test.use({ viewport: { width: 402, height: 874 } });

const MORTGAGE = { id: 'e-mortgage', name: 'Mortgage', amount: 1600, dueDate: day(1), recurrence: 'monthly', category: 'housing' };
const RENT = { id: 'e-rent', name: 'Rent', amount: 1450, dueDate: day(1), recurrence: 'monthly', category: 'housing' };
const PHONE = { id: 'e-phone', name: 'Phone', amount: 60, dueDate: day(5), recurrence: 'monthly', category: 'utilities' };

for (const theme of ['light', 'dark'] as const) {
  test(`the mis-filed hint beside untouched expenses (${theme})`, async ({ page }) => {
    await seedStore(page, scenario({ requiredExpenses: [MORTGAGE, RENT, PHONE], prefs: { onboardingComplete: true, themeMode: theme } }));
    await page.goto('/money');
    await page.getByText('Expenses', { exact: true }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `hint-${theme}.png`) });
  });
}
