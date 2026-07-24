import type { Page } from '@playwright/test';

/**
 * RS.6 e2e seed — inject a (partial) persisted store into the web app's `localStorage` BEFORE it loads,
 * so the app hydrates straight into a chosen scenario. The store's `hydrate` runs `runMigrations`, which
 * backfills a partial blob onto the current defaults, so a minimal blob is enough to drive a state.
 * Premium is a pure `subscriptionPlan === 'premium'` check (no IAP seam on web), so the tier is just a
 * field here. Kept alias-free (plain objects) so it resolves under Playwright's own loader.
 */

const KEY = 'debtPlanner.rnStore';

const DEBT = { id: 'd0', name: 'Card', balance: 5000, minimumPayment: 100, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' };

/** A plan-ready scenario: positive paycheck, one debt, onboarded, established (no cold-start dampening). */
export function scenario(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    storeVersion: 5,
    subscriptionPlan: 'premium',
    cushionFloor: 200,
    genuineCycleCount: 6,
    paycheck: { amount: '2000' },
    debts: [DEBT],
    prefs: { onboardingComplete: true },
    ...over,
  };
}

/** Seed a store blob into localStorage before the first navigation. */
export async function seedStore(page: Page, store: Record<string, unknown>) {
  await page.addInitScript(
    (arg) => {
      window.localStorage.setItem(arg.key, arg.blob);
    },
    { key: KEY, blob: JSON.stringify(store) },
  );
}
