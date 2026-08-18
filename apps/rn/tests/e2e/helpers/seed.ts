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
/** One recurring bill — see `scenario`.
 *  ⚠️ Deliberately JUST a bill. An everyday-spending default was tried and reverted: it shifted every
 *  financial assertion by a flat $300 and re-broke six specs that pin their own tight/shortfall states,
 *  while adding no coverage the measured hole called for. The hole was `requiredExpenses`. */
const BILL = { id: 'e0', name: 'Rent', amount: 350, dueDate: '2026-07-01', recurrence: 'monthly', category: 'housing' };

/**
 * A plan-ready scenario: positive paycheck, one debt, ONE RECURRING BILL, an everyday reserve, onboarded,
 * established (no cold-start dampening).
 *
 * ⛔ **The bill and the everyday reserve are load-bearing, and their absence was a measured coverage hole.**
 * Until 2026-08-18 this seeded no `requiredExpenses`, so 25 of 39 specs drove an app whose entire
 * bills/reserve half was in its EMPTY branch — a shape no real user has. `route-smoke.spec.ts`, which
 * exists verbatim for *"a blank route passes silently"*, passed 10/10 while Today rendered blank for every
 * user with a bill: the offending selector returns a stable `null` on an empty plan, so the fixture could
 * not reach the defect class the guard was written for.
 *
 * ⚠️ A spec that genuinely needs the empty case passes `requiredExpenses: []` explicitly — which then reads
 * as a deliberate choice rather than an accident of the default.
 */
export function scenario(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    storeVersion: 5,
    subscriptionPlan: 'premium',
    cushionFloor: 200,
    genuineCycleCount: 6,
    paycheck: { amount: '2000' },
    debts: [DEBT],
    requiredExpenses: [BILL],
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
  // ⛔ NOT `toISOString().slice(0, 10)`. The app stores calendar dates, so the fixture has to spell the
  // same LOCAL day the app will compute — and the old form did not: west of UTC it rolls to tomorrow
  // once the local clock passes evening, so a suite that was green all afternoon seeds a different
  // "today" at night. `@core/utils/localDate` owns this rule; the body is inlined because this file is
  // deliberately alias-free (it resolves under Playwright's own loader, see the header).
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
