import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectJourneyTotals } from '@/store/journeySelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { mayClaim } from '@/store/trustSelectors';

const ELEVEN_MONTHS_AGO = '2025-04-02';
function aged(ov: Record<string, unknown>): DebtStore {
  const st = runMigrations({
    version: 8, subscriptionPlan: 'premium', genuineCycleCount: 6,
    paycheck: { amount: '1400', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
    debts: [{ id: 'a', name: 'Chase', balance: 18000, originalBalance: 20000, minimumPayment: 400, apr: 27.99, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly', ...ov }],
    prefs: { onboardingComplete: true },
  });
  return { ...st, debts: st.debts.map((d) => ({ ...d, lastVerifiedDate: ELEVEN_MONTHS_AGO, balanceAsOfDate: ELEVEN_MONTHS_AGO })) };
}

for (const [label, ov] of [
  ['CONTROL — every field readable', {}],
  ['apr unreadable', { apr: 'n/a' }],
  ['minimumPayment unreadable', { minimumPayment: 'n/a' }],
] as [string, Record<string, unknown>][]) {
  const store = aged(ov);
  const engineStore = withProjectedBalances(store, true);
  // progress.tsx:283-286, verbatim.
  const mayStateBalances = mayClaim(store, 'debt-balances');
  const journey = selectJourneyTotals(store.debts, engineStore.debts);
  const view = selectPayoffView(engineStore);
  console.log(`${label}
  repairs                     = ${JSON.stringify(store.pendingDataRepairs.map((r) => r.field))}
  mayClaim('debt-balances')   = ${mayClaim(store, 'debt-balances')}   <- progress.tsx's ONLY guard
  mayClaim('row-figures')     = ${mayClaim(store, 'row-figures')}   <- what the widget also asks
  ring "% paid"              -> ${mayStateBalances ? `${Math.round(journey.pct)}%` : '—'}
  journey line               -> ${JSON.stringify(mayStateBalances ? journey.line : 'UNREAD_JOURNEY_LINE')}
  hero debt-free date        -> ${JSON.stringify(mayStateBalances ? (view.debtFreeDate ?? '—') : '—')}`);
}
