import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { selectDebtBalanceView } from '@/store/balanceSelectors';
import { hasUnreadDebtBalances, mayClaim, partitionDebts } from '@/store/trustSelectors';
import { buildWidgetSnapshot } from '@/widget/snapshot';
import { formatWhole } from '@/utils/format';

const ELEVEN_MONTHS_AGO = '2025-04-02';
function aged(overrides: Record<string, unknown>): DebtStore {
  const st = runMigrations({
    version: 8, subscriptionPlan: 'premium', genuineCycleCount: 6,
    paycheck: { amount: '2000', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
    debts: [{ id: 'a', name: 'Chase', balance: 9000, originalBalance: 12000, minimumPayment: 25, apr: 29.99, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly', ...overrides }],
    prefs: { onboardingComplete: true },
  });
  return { ...st, debts: st.debts.map((d) => ({ ...d, lastVerifiedDate: ELEVEN_MONTHS_AGO, balanceAsOfDate: ELEVEN_MONTHS_AGO })) };
}

// money.tsx:385 — the hero's own expression, verbatim.
function moneyHero(store: DebtStore): string {
  const unreadDebts = hasUnreadDebtBalances(store);
  if (unreadDebts) return 'Some balances unread';
  const cpm = payCyclesPerMonth(store.paycheck.payCycle);
  const active = partitionDebts(store).live; // money.tsx ranks `active` from the live set
  const total = active.reduce((s, d) => s + selectDebtBalanceView(d, store.paycheck.currentDate, true, cpm).currentBalance, 0);
  return formatWhole(total);
}

for (const [label, ov] of [
  ['CONTROL — every field readable', {}],
  ['apr unreadable', { apr: 'n/a' }],
  ['minimumPayment unreadable', { minimumPayment: 'n/a' }],
  ['balance unreadable', { balance: 'n/a' }],
] as [string, Record<string, unknown>][]) {
  const s = aged(ov);
  const snap = buildWidgetSnapshot(s, 1);
  console.log(`${label}
  repairs                       = ${JSON.stringify(s.pendingDataRepairs.map((r) => r.field))}
  hasUnreadDebtBalances (money) = ${hasUnreadDebtBalances(s)}
  mayClaim('debt-balances')     = ${mayClaim(s, 'debt-balances')}
  mayClaim('row-figures')       = ${mayClaim(s, 'row-figures')}
  MONEY tab hero               -> ${JSON.stringify(moneyHero(s))}
  WIDGET / Siri "remaining"    -> ${JSON.stringify(snap.remaining)}`);
}
