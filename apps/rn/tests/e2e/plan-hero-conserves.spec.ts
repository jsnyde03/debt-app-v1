import { expect, test, type Page } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * [S1 · pass 1 · M4] `PlanHero` partitions the paycheck — the headline is exactly `paycheckAmount` and the
 * three segments are supposed to divide it. In a shortfall they did not: `required` was
 * `summary.requiredTotal`, which is what is **owed**, and in a shortfall that is larger than the headline.
 * The bar is drawn with `flexGrow`, which normalises whatever it is given to the full track, so a legend
 * reading *"Required $1,400 · Spoken for $300"* sat under a **$1,000** headline looking perfectly ordinary.
 *
 * ⛔ **THE INVARIANT IS ASSERTED, NOT THE NUMBERS.** A row of hard-coded figures passes for one fixture
 * and says nothing about the class; the file's own comment states the rule — *"a partition that does not
 * conserve is not a partition"* — and that is what is checked here. The specific measured figures are
 * asserted too, so a hero that renders no segments at all cannot satisfy a sum of `0 === 0`.
 *
 * ⚠️ Read from the hero's accessibility label, which is composed at `PlanHero.tsx` as
 * `"This paycheck $X. Required $A, Spoken for $B, Flexible $C. … Short this paycheck"` — the one place
 * every segment and the headline appear together, which is exactly what conservation is about.
 */
test.use({ viewport: { width: 402, height: 874 } });

async function heroParts(page: Page) {
  const hero = page.getByTestId('plan-hero');
  await expect(hero).toBeVisible({ timeout: 10_000 });
  const label = (await hero.getByLabel(/This paycheck/).first().getAttribute('aria-label')) ?? '';
  const money = (re: RegExp) => {
    const m = label.match(re);
    return m ? Number(m[1].replace(/,/g, '')) : null;
  };
  return {
    label,
    headline: money(/This paycheck \$([\d,]+)/),
    required: money(/Required \$([\d,]+)/),
    spokenFor: money(/Spoken for \$([\d,]+)/),
    flexible: money(/Flexible \$([\d,]+)/),
  };
}

/** $1,000 in · $1,400 of bills · a $300 everyday reserve → the audit's own third case. */
const SHORT = scenario({
  paycheck: { amount: '1000', nextPaycheckDate: day(10) },
  debts: [],
  requiredExpenses: [{ id: 'e-rent', name: 'Rent', amount: 1400, dueDate: day(3), recurrence: 'monthly', category: 'housing' }],
  livingExpenses: [{ id: 'liv', name: 'Everyday', amount: 300, enabled: true }],
});

const HEALTHY = scenario({
  paycheck: { amount: '2000', nextPaycheckDate: day(10) },
  debts: [],
  requiredExpenses: [{ id: 'e-rent', name: 'Rent', amount: 950, dueDate: day(3), recurrence: 'monthly', category: 'housing' }],
  livingExpenses: [{ id: 'liv', name: 'Everyday', amount: 400, enabled: true }],
});

test('the paycheck split conserves in a SHORTFALL — the state the hero matters most in', async ({ page }) => {
  await seedStore(page, SHORT);
  await page.goto('/');
  const p = await heroParts(page);

  // Guard the parse before trusting the sum: a label that failed to match every field yields nulls, and
  // `0 === 0` would otherwise read as a conserving partition.
  expect(p.headline, `headline missing from: ${p.label}`).not.toBeNull();
  expect(p.required, `Required missing from: ${p.label}`).not.toBeNull();

  const sum = (p.required ?? 0) + (p.spokenFor ?? 0) + (p.flexible ?? 0);
  expect(sum, `segments must sum to the headline — got ${sum} of ${p.headline} in: ${p.label}`).toBe(p.headline);

  // …and the fixture really is the defect's shape, so the assertion above is not passing on a covered cycle.
  await expect(page.getByTestId('plan-hero')).toContainText(/Short this paycheck/);
});

test('…and still conserves on a healthy cycle — the branch the fix must not move', async ({ page }) => {
  await seedStore(page, HEALTHY);
  await page.goto('/');
  const p = await heroParts(page);

  expect(p.headline, `headline missing from: ${p.label}`).not.toBeNull();
  expect(p.required, `Required missing from: ${p.label}`).not.toBeNull();
  const sum = (p.required ?? 0) + (p.spokenFor ?? 0) + (p.flexible ?? 0);
  expect(sum, `segments must sum to the headline — got ${sum} of ${p.headline} in: ${p.label}`).toBe(p.headline);

  // ⛔ The measured value, not just the invariant. `required = 0` conserves trivially whenever the whole
  // paycheck lands in `Flexible`, so a fix that zeroed the segment would pass every sum above.
  expect(p.required).toBe(950);
  await expect(page.getByTestId('plan-hero')).not.toContainText(/Short this paycheck/);
});
