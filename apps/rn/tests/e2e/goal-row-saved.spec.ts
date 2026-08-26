import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * [S1 · pass 1 · M2] A goal past its target reported the TARGET under the label `saved` — *"$1,000 saved"*
 * over a pot holding $5,000 — one inch under a hero that totals `currentAmount` correctly. The two figures
 * are equal only when the goal sits exactly on its target, and nothing prevents over-funding:
 * `GoalSheet.submit()` validates target and current independently and never compares them, and a negative
 * `applyTightTopUp` (a top-up undo) can push `currentAmount` past the target on its own.
 *
 * ⛔ The assertions read the ROW, not a selector. The defect was entirely in what the row printed; every
 * number behind it was already right, which is why nothing upstream could have caught it.
 *
 * ⚠️ All three funding states are asserted — over, exactly at, and under. The fix touches only the
 * `funded` branch, so the under-funded row is what falsifies a plant that widens `funded`, and the
 * exactly-at row is what proves the fix did not simply swap one number for another everywhere.
 */
test.use({ viewport: { width: 402, height: 874 } });

const GOALS = [
  // Over-funded: the defect's own case. Row must say what is actually saved.
  { id: 'g-over', name: 'Emergency Fund', targetAmount: 1000, currentAmount: 5000, type: 'emergency' },
  // Exactly at target: the one case where the old code was accidentally right.
  { id: 'g-exact', name: 'New Laptop', targetAmount: 2000, currentAmount: 2000, type: 'savings' },
  // Under target: the untouched branch, and the assertion a widened `funded` reds.
  { id: 'g-under', name: 'Vacation', targetAmount: 2000, currentAmount: 500, type: 'savings' },
];

async function openGoals(page: import('@playwright/test').Page) {
  await page.goto('/money');
  await page.getByText('Goals', { exact: true }).click();
  await expect(page.getByText('Vacation', { exact: true })).toBeVisible({ timeout: 10_000 });
}

test('an over-funded goal reports what is actually saved — and agrees with the hero above it', async ({ page }) => {
  await seedStore(page, scenario({ goals: GOALS }));
  await openGoals(page);

  // ⛔ The accessible row label, which is `${amount}${amountSuffix}` — asserting "$5,000" alone would also
  // be satisfied by the hero, and asserting the absence of "$1,000" would be satisfied by a row that
  // failed to render at all.
  await expect(page.getByRole('button', { name: /^Emergency Fund,/ })).toHaveAccessibleName(/\$5,000 saved/);

  // The hero the row was caught disagreeing with: 5000 + 2000 + 500 = $7,500 saved.
  await expect(page.getByText('$7,500', { exact: true })).toBeVisible();
});

test('the two branches the fix must NOT move — exactly at target, and short of it', async ({ page }) => {
  await seedStore(page, scenario({ goals: GOALS }));
  await openGoals(page);

  // Exactly at target: target === current, so the row reads the same either way. This is the assertion a
  // "print the target everywhere" plant cannot red, and it is here to prove the fix is a correction and
  // not a substitution.
  await expect(page.getByRole('button', { name: /^New Laptop,/ })).toHaveAccessibleName(/\$2,000 saved/);

  // Short of target: still a REMAINDER, still labelled `left`. Widening `funded` reds this line.
  await expect(page.getByRole('button', { name: /^Vacation,/ })).toHaveAccessibleName(/\$1,500 left/);
});

/**
 * ⚡ Found by M2's after-scan, and MEASURED on the real screen before it was believed: `"House Fund,
 * Savings, $0 left"`. `.11.4` stopped a goal with an unreadable target from wearing a **Funded** pill and
 * then let the row fall through to the `left` branch, where `Math.max(0, 0 - currentAmount)` is `$0`. The
 * guard was on the badge and absent from the sentence beside it — this pass's B1 and B5, a third time.
 *
 * ⛔ The positive assertion comes FIRST and is the load-bearing one. "`$0 left` is absent" is also true of
 * a row that failed to render, and of a fix that swapped one falsehood for a quieter one — which is
 * exactly what the badge-only fix did.
 */
test('a goal whose target could not be read says what IS saved — not that $0 is left', async ({ page }) => {
  await seedStore(page, scenario({
    goals: [
      { id: 'g-unread', name: 'House Fund', targetAmount: 0, currentAmount: 500, type: 'savings' },
      { id: 'g-ok', name: 'Vacation', targetAmount: 2000, currentAmount: 500, type: 'savings' },
    ],
    pendingDataRepairs: [{ entity: 'goal', id: 'g-unread', name: 'House Fund', field: 'targetAmount', kind: 'lost' }],
  }));
  await openGoals(page);

  const row = page.getByRole('button', { name: /^House Fund,/ });
  await expect(row).toHaveAccessibleName(/\$500 saved/);
  await expect(row).toHaveAccessibleName(/Target could not be read/);
  // ⛔ No Funded pill either — `.11.4`'s guard must survive this change, not be replaced by it.
  await expect(row).not.toHaveAccessibleName(/Funded/);

  // The neighbouring readable goal is untouched, so "the screen broke" cannot satisfy the above.
  await expect(page.getByRole('button', { name: /^Vacation,/ })).toHaveAccessibleName(/\$1,500 left/);
});
