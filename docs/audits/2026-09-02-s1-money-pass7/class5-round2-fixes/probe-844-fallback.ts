/**
 * 8.4.4 build probe — the FALLBACK path of `payoffOrder`, which the release and the Guardian brief take only when the plan funds no
 * snowball row this cycle. Question: at which paycheck amounts does a store with a $0-estimate StoreCard fund no snowball, and what do
 * the release, the brief's copy and Money's order say there?
 *
 * Read-only. Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore, PayoffStrategy } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian, selectReserveRelease } from '@/store/guardianSelectors';
import { payoffOrder, selectPayoffView } from '@/store/payoffSelectors';
import { selectAllocation } from '@/store/selectors';
import { partitionDebts } from '@/store/trustSelectors';

const DAY = '2026-08-26';
const VERIFIED_IN_MAY = '2026-05-01';
const NAMES = ['Chase', 'Visa', 'StoreCard'];

const store = (strategy: PayoffStrategy, amount: string, plan: 'free' | 'premium'): DebtStore => ({
  ...runMigrations({
    version: 8,
    paycheck: { amount, currentDate: DAY, nextPaycheckDate: DAY },
    debts: [
      { id: 'c', name: 'Chase', balance: 5000, originalBalance: 6000, minimumPayment: 150, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
      { id: 'v', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
      { id: 'x', name: 'StoreCard', balance: 100, originalBalance: 800, minimumPayment: 120, apr: 20, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: VERIFIED_IN_MAY, lastVerifiedDate: VERIFIED_IN_MAY },
    ],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    cushionFloor: 200,
    prefs: { onboardingComplete: true },
  }),
  subscriptionPlan: plan,
  payoffStrategy: strategy,
  pendingReserveRelease: { tapped: false, covered: 150 },
});

for (const plan of ['premium', 'free'] as const) {
  for (const strategy of ['snowball', 'avalanche'] as PayoffStrategy[]) {
    // Run 1 read $1100–$3000 and every row funded a snowball, so the fallback was never reached; run 2 goes below the bills.
    for (const amount of ['200', '400', '600', '800', '1100', '3000']) {
      const raw = store(strategy, amount, plan);
      const s = withProjectedBalances(raw, plan === 'premium');
      const row = (selectAllocation(s)?.allocations ?? []).find((a) => a.category === 'snowball');
      const snow = row ? s.debts.find((d) => d.id === (row.debtId ?? row.targetId))?.name : '—';
      const brief = selectPaydayGuardian(s);
      const briefText = brief ? [brief.title, brief.detail, brief.safeMove ?? ''].join(' | ') : '(null)';
      const briefNames = NAMES.filter((n) => briefText.includes(n)).join('+') || '—';
      const po = payoffOrder(s);
      const view = selectPayoffView(s);
      const { unreadBalance, cleared } = partitionDebts(raw);
      const sections = [...view.order, ...unreadBalance, ...cleared].map((d) => d.id).sort().join('');
      console.log(
        `${plan.padEnd(7)} ${strategy.padEnd(9)} $${amount.padEnd(4)} · x=${s.debts[2].balance} · snowball=${snow} · release=${selectReserveRelease(s)?.targetName} · brief names ${briefNames} · order=${po.order.map((d) => d.id).join('')} focus=${po.focus?.id} · sections=${sections}`,
      );
      if (briefNames === '—' && !row) console.log(`        brief: ${briefText.slice(0, 220)}`);
    }
  }
}
