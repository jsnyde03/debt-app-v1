import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * L3 render probe — MEASURES, does not judge. Each test waits for a positive render first, then LOGS what the
 * screen shows, so the same file runs unchanged at the pin and at c7df99c2. Copied into
 * apps/rn/tests/e2e/ of the worktree under test; the master copy lives in class5-reaudit-probes/L3/.
 */
const log = (tag: string, v: unknown) => console.log(`L3PROBE ${tag} :: ${JSON.stringify(v)}`);

async function storeBlob(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) as string;
      try {
        const v = JSON.parse(localStorage.getItem(k) as string);
        if (v && Array.isArray(v.goals)) return v;
      } catch {
        /* not the store */
      }
    }
    return null;
  });
}

const HERO_SHAPES: Record<string, Record<string, unknown>> = {
  'P1a lost APR (trust-claims .5.4d store)': scenario({ debts: [{ id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 150, apr: '', dueDate: day(6), type: 'debt', recurrence: 'monthly' }] }),
  'P1b lost minimum on Car, Visa readable': scenario({
    debts: [
      { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 150, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      { id: 'd1', name: 'Car', balance: 9000, originalBalance: 12000, minimumPayment: '', apr: 6, dueDate: day(12), type: 'debt', recurrence: 'monthly' },
    ],
  }),
  'P1c control, both readable': scenario({
    debts: [
      { id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 150, apr: 20, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      { id: 'd1', name: 'Car', balance: 9000, originalBalance: 12000, minimumPayment: 300, apr: 6, dueDate: day(12), type: 'debt', recurrence: 'monthly' },
    ],
  }),
};

for (const [name, blob] of Object.entries(HERO_SHAPES)) {
  test(`L3 P1 plan hero · ${name}`, async ({ page }) => {
    await seedStore(page, blob);
    await page.goto('/');
    const hero = page.getByTestId('plan-hero');
    await expect(hero).toBeVisible({ timeout: 15_000 });
    await expect(hero).toContainText(/On track|Short this paycheck|Overdue|could not be read/, { timeout: 15_000 });
    const a11y = await hero.locator('[aria-label^="This paycheck"]').first().getAttribute('aria-label');
    log(`P1 ${name} innerText`, (await hero.innerText()).replace(/\s+/g, ' '));
    log(`P1 ${name} suggestVisible`, await hero.getByText(/^Suggested ·/).count());
    log(`P1 ${name} a11y`, a11y);
  });
}

const JOURNEY = (tier: 'free' | 'premium', apr: number | string) =>
  scenario({
    subscriptionPlan: tier,
    genuineCycleCount: 6,
    requiredExpenses: [],
    debts: [
      { id: 'd0', name: 'Chase card', balance: 8000, originalBalance: 8000, minimumPayment: 100, apr, dueDate: day(4), type: 'debt', recurrence: 'monthly', balanceAsOfDate: day(-90), lastVerifiedDate: day(-90) },
      { id: 'd1', name: 'Visa', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
    ],
  });

for (const tier of ['free', 'premium'] as const) {
  for (const apr of ['', 19] as const) {
    test(`L3 P2 progress + money · ${tier} · apr=${apr === '' ? 'unread' : apr}`, async ({ page }) => {
      await seedStore(page, JOURNEY(tier, apr));
      await page.goto('/progress');
      const journey = page.getByTestId('progress-hero-journey');
      await expect(journey).toBeVisible({ timeout: 15_000 });
      await expect(journey).not.toHaveText('', { timeout: 15_000 });
      log(`P2 ${tier} apr=${apr} progress-journey`, await journey.innerText());
      log(`P2 ${tier} apr=${apr} progress-date`, await page.getByTestId('progress-hero-date').innerText());
      await page.goto('/money');
      await expect(page.getByText('Visa').first()).toBeVisible({ timeout: 15_000 });
      log(`P2 ${tier} apr=${apr} money-hero`, await page.getByTestId('money-hero-debts-value').innerText());
    });
  }
}

/** Premium, a paycheck the bills eat to the line — the selector probe measured capacity 0 here. */
const SHORT = () =>
  scenario({
    paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(31) },
    requiredExpenses: [{ id: 'rent', name: 'rent', amount: 1700, dueDate: day(10), recurrence: 'monthly', category: 'housing' }],
    debts: [{ id: 'd0', name: 'Card', balance: 3000, minimumPayment: 100, apr: 22, dueDate: day(9), type: 'debt', recurrence: 'monthly' }],
    cushionFloor: 200,
    prefs: { onboardingComplete: true },
  });

test('L3 P3 save-for-it · a typed pace on a paycheck with no room', async ({ page }) => {
  await seedStore(page, SHORT());
  await page.goto('/');
  await page.getByPlaceholder('e.g. 400').fill('500');
  await page.getByRole('button', { name: 'Save for it →' }).click({ timeout: 15_000 });
  const own = page.getByText('Set your own', { exact: true });
  await expect(own).toBeVisible({ timeout: 15_000 });
  log('P3 options on the sheet', (await page.getByRole('dialog').first().innerText().catch(() => '(no dialog role)')).replace(/\s+/g, ' ').slice(0, 600));
  await own.click();
  const field = page.getByTestId('saveforit-custom-per');
  await field.fill('300');
  const ready = page.getByTestId('saveforit-custom-ready');
  await expect(ready).toBeVisible({ timeout: 15_000 });
  log('P3 ready line', await ready.innerText());
  await page.getByRole('button', { name: 'Start saving' }).click();
  const confirmation = page.getByText(/Now saving|Saving toward/).first();
  await expect(confirmation).toBeVisible({ timeout: 15_000 });
  log('P3 confirmation', await confirmation.innerText());
  await page.waitForTimeout(1500); // autosave debounce
  const blob = await storeBlob(page);
  log('P3 stored goals', blob?.goals);
});
