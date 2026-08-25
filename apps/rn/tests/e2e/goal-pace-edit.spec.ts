import { expect, test } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * ⛔ **[P6.8.9.7.11.13.4] `priorityPerPaycheck` HAD EXACTLY ONE WRITER AND IT WAS UNREACHABLE.**
 *
 * The pace was written only at `SaveForItSheet.tsx:109`, reachable only through
 * `AffordabilityCard.openSaveSheet`, which refuses a name a surviving goal already holds. So when
 * `runMigrations` stands a goal down for an unreadable pace, the repair card's *"until you set it again"*
 * named an action the app did not have — and two of `.11.13`'s findings are that one sentence.
 * `DataRepairsCard.tsx:38` says so in its own comment: *"`GoalSheet` edits name, target, current and type."*
 *
 * ⚠️ **ASSERTED ON THE PERSISTED STORE, NOT ON THE SCREEN** — the idiom `saveforit-pace.spec.ts` documents
 * for this exact field. A spec that only proved the form submits would pass against a version that wrote
 * the wrong value and re-rendered correctly.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

/** A stood-down sinking fund: the state `runMigrations` leaves behind, and the one with no way out. */
const STOOD_DOWN = () =>
  scenario({
    genuineCycleCount: 6,
    paycheck: { amount: '4000', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(28) },
    prefs: {
      onboardingComplete: true,
      guardianIntroSeen: true,
      coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'],
    },
    goals: [{ id: 'g0', name: 'Roof', targetAmount: 3000, currentAmount: 400, type: 'savings' }],
  });

async function goals(page: import('@playwright/test').Page) {
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
  return raw
    ? ((JSON.parse(raw) as { goals?: { id: string; priority?: boolean; priorityPerPaycheck?: number }[] }).goals ?? [])
    : [];
}

/** Money → Goals → the goal's row, which is what opens `GoalSheet` in edit mode. */
async function openGoal(page: import('@playwright/test').Page) {
  await seedStore(page, STOOD_DOWN());
  await page.goto('/money');
  await page.getByText('Goals', { exact: true }).click({ timeout: 15_000 });
  await page.getByText('Roof', { exact: true }).first().click({ timeout: 15_000 });
  await expect(page.getByText('Edit goal')).toBeVisible({ timeout: 15_000 });
}

test('the pace a stood-down goal lost can be set again, and it reaches the store', async ({ page }) => {
  await openGoal(page);

  // ⛔ The control has to be OFF to begin with, or the assertion below is true of a sheet that arrived
  // already prioritised and the toggle proved nothing.
  const toggle = page.getByLabel('Fund this ahead of my debt');
  await expect(toggle).toBeVisible();
  await expect(toggle).not.toBeChecked();

  await toggle.click();
  await page.getByLabel('Cap per paycheck').fill('120');
  await page.getByText('Save', { exact: true }).click();

  await expect
    .poll(async () => (await goals(page)).find((g) => g.id === 'g0')?.priorityPerPaycheck, { timeout: 15_000 })
    .toBe(120);
  expect((await goals(page)).find((g) => g.id === 'g0')?.priority).toBe(true);
});

/**
 * ⛔ **A PACE OF `0` IS THE UNCAPPED STATE — the exact corruption `runMigrations` stands goals down for.**
 * `allocatePaycheck.ts` reads `priorityPerPaycheck != null && > 0 ? pace : Infinity`, so a prioritised goal
 * saved with `0` funds at full speed ahead of the debt. ⚡ Same value, opposite meaning to every other
 * amount on this sheet: a target of `0` is merely wrong, a pace of `0` is unlimited. **A route that can
 * write it would re-create the defect it exists to let people recover from.**
 *
 * ⛔ **WHAT ENFORCES THIS IS THE CHOICE OF PARSER, and finding that out is why this comment exists.**
 * `parseAmountField` returns `null` unless `n > 0`; its sibling `parseOptionalAmount` accepts `0` and would
 * hand the defect straight through. The sheet briefly carried an explicit `paceN <= 0` clause as well —
 * **unreachable**, and planting its removal left this test GREEN, which is the plainest possible proof
 * that it was pinning somebody else's guard. ⚠️ **The mutation that reds this test is the parser swap**,
 * because that is the change a person could actually make.
 */
test('a pace of 0 is REFUSED, because 0 means uncapped', async ({ page }) => {
  await openGoal(page);
  await page.getByLabel('Fund this ahead of my debt').click();
  await page.getByLabel('Cap per paycheck').fill('0');
  await page.getByText('Save', { exact: true }).click();

  // The sheet stays open and says why…
  await expect(page.getByText('Enter how much to put toward this each paycheck.')).toBeVisible();
  // …and nothing was written. ⚠️ The store assertion is the load-bearing one: an error message with a
  // committed write is the failure this is here to exclude.
  const g = (await goals(page)).find((x) => x.id === 'g0');
  expect(g?.priority ?? false).toBe(false);
  expect(g?.priorityPerPaycheck ?? null).toBeNull();
});

/**
 * ⚠️ **THE emergency fund is funded by the starter-EF rung**, which consults neither `priority` nor the
 * pace — so these controls would do nothing there, and a control that does nothing is the *"built UI that
 * is dead"* class. ⛔ Asked of `@core/engine/emergencyFund`, not of `type === 'savings'`: a SECOND
 * emergency-typed goal DOES fund through the sinking-fund rung ([D61]), so the naive test would be wrong
 * for it.
 */
test('the controls are absent on THE emergency fund, and present on a second one', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      genuineCycleCount: 6,
      prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] },
      goals: [
        { id: 'g0', name: 'Emergency fund', targetAmount: 2000, currentAmount: 500, type: 'emergency' },
        { id: 'g1', name: 'Second cushion', targetAmount: 1000, currentAmount: 0, type: 'emergency' },
      ],
    }),
  );
  await page.goto('/money');
  await page.getByText('Goals', { exact: true }).click({ timeout: 15_000 });

  await page.getByText('Emergency fund', { exact: true }).first().click({ timeout: 15_000 });
  await expect(page.getByText('Edit goal')).toBeVisible({ timeout: 15_000 });
  // ⛔ The sheet is proven open FIRST — an absence assertion is trivially true of a screen that never
  // rendered, which this repo has shipped twice.
  await expect(page.getByLabel('Fund this ahead of my debt')).toHaveCount(0);
  await page.getByTestId('sheet-close').click();

  await page.getByText('Second cushion', { exact: true }).first().click({ timeout: 15_000 });
  await expect(page.getByText('Edit goal')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel('Fund this ahead of my debt')).toBeVisible();
});
