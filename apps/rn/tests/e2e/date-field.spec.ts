import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * 🎯-reported 2026-08-17 — the Money tab's edit sheets had no date PICKER: the date was a plain text box
 * whose label literally instructed the user to type `YYYY-MM-DD`.
 *
 * ⛔ **THESE FIELDS HAD ZERO COVERAGE, WHICH IS WHY IT SHIPPED.** Searching the whole suite and every
 * Maestro flow for "Due date", "Next payment" and "Full price starts" returned nothing — no spec had ever
 * touched them. A field that asks a human to hand-format a date is exactly the kind of thing a test
 * would have made someone look at.
 *
 * ⚠️ WEB ASSERTS THE WEB HALF, and that is the honest limit. `DateField` is platform-split: the native
 * file uses `@react-native-community/datetimepicker` (no web build at all), the `.web.tsx` uses
 * `<input type="date">`. So this proves the CONTRACT — a real date control, seeded correctly, writing a
 * local `YYYY-MM-DD` back — on the surface Playwright can reach. **The iOS wheel itself is device-owed**
 * and belongs on the checklist rather than being claimed here.
 */
test.use({ viewport: { width: 402, height: 874 } });

const onboarded = (over: Record<string, unknown> = {}) =>
  scenario({ prefs: { onboardingComplete: true }, ...over });

/** The seeded persona owns one debt, `Card`, so its edit sheet is one tap from the Money list. */
async function openDebtEditor(page: import('@playwright/test').Page) {
  await page.goto('/money');
  await page.getByText('Card', { exact: true }).first().click();
  await expect(page.getByText('APR %')).toBeVisible({ timeout: 10_000 });
}

test('the debt editor offers a real date control, not a formatted text box', async ({ page }) => {
  await seedStore(page, onboarded());
  await openDebtEditor(page);

  const due = page.getByTestId('field-debt-due-date');
  await expect(due).toBeVisible();
  // ⛔ THE ASSERTION THAT MATTERS. `type="date"` is what makes the platform supply a picker; a text input
  // would satisfy "a field exists" and satisfy nothing the report was about.
  await expect(due).toHaveAttribute('type', 'date');
  // Seeded from the record, in the format the store holds.
  await expect(due).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
});

test('picking a date writes it straight through, with no timezone drift', async ({ page }) => {
  await seedStore(page, onboarded());
  await openDebtEditor(page);

  const due = page.getByTestId('field-debt-due-date');
  // ⚠️ A DATE WITH A KNOWN ANSWER, not "today". The bug this guards is a UTC round-trip that shifts the
  // calendar date by one day east of UTC — and a test written against `today` cannot see a one-day slip,
  // because it has nothing to compare to. A fixed date makes the drift arithmetic, not vibes.
  await due.fill('2027-03-09');
  await expect(due).toHaveValue('2027-03-09');

  // Save, reopen, and read it back: the round trip through the store is where a conversion would happen.
  await page.getByText('Save', { exact: true }).click();
  await openDebtEditor(page);
  await expect(page.getByTestId('field-debt-due-date')).toHaveValue('2027-03-09');
});

test('the expense editor got the same control, and stopped teaching a format', async ({ page }) => {
  await seedStore(
    page,
    onboarded({
      requiredExpenses: [
        { id: 'e0', name: 'Power', amount: 90, dueDate: '2026-09-04', recurrence: 'monthly', category: 'utilities' },
      ],
    }),
  );
  await page.goto('/money');
  await page.getByText('Expenses', { exact: true }).click();
  await page.getByText('Power', { exact: true }).first().click();

  const due = page.getByTestId('field-expense-due-date');
  await expect(due).toBeVisible({ timeout: 10_000 });
  await expect(due).toHaveAttribute('type', 'date');
  await expect(due).toHaveValue('2026-09-04');
  // The label carried "(YYYY-MM-DD)" only because the control could not be trusted to produce one.
  await expect(page.getByText('Due date (YYYY-MM-DD)')).toHaveCount(0);
});
