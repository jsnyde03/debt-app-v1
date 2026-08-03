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

/**
 * A date N days from the RUN DATE, as `YYYY-MM-DD`.
 *
 * Fixtures must not write calendar literals. A hardcoded `nextPaycheckDate` becomes a payday in the
 * PAST the moment the real clock passes it — and Today then auto-opens the payday-capture sheet, whose
 * backdrop covers the tab bar. The suite starts failing overnight with "subtree intercepts pointer
 * events", which reads exactly like a UI regression and is nothing of the sort. That happened on
 * 2026-08-02, when `bnpl.spec`'s `2026-08-01` payday expired; nine other specs were queued to do the
 * same thing on 2026-09-01.
 *
 * Use `day(0)` for "today" and a comfortably future offset for the next payday.
 */
export function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
