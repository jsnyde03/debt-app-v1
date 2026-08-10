import path from 'path';

import { test } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

/** 3.7.A10.3/.4 — the renamed sections and their captions, which have to read as calm, not as a lecture. */
const OUT = path.resolve(__dirname, '../../capture-ref/money-sections');

test.use({ viewport: { width: 402, height: 874 } });

const EXPENSES = [
  { id: 'e-rent', name: 'Rent', amount: 1450, dueDate: '2026-09-01', recurrence: 'monthly', category: 'housing' },
  { id: 'e-phone', name: 'Phone', amount: 60, dueDate: '2026-09-05', recurrence: 'monthly', category: 'utilities' },
];

for (const theme of ['light', 'dark'] as const) {
  for (const section of ['Debts', 'Expenses', 'Goals'] as const) {
    test(`${section} with its caption (${theme})`, async ({ page }) => {
      await seedStore(page, scenario({ requiredExpenses: EXPENSES, prefs: { onboardingComplete: true, themeMode: theme } }));
      await page.goto('/money');
      if (section !== 'Debts') await page.getByText(section, { exact: true }).click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `${section.toLowerCase()}-${theme}.png`) });
    });
  }
}
