/**
 * L1 probe 2 — liveness reads the CONFIRMED balance; a premium debt PROJECTS to $0 unconfirmed.
 * Who names it as a destination, does the partition still total, and what does the plan say when every
 * debt projects to $0? Run from <tree>/apps/rn:  npx tsx --tsconfig <tree>/apps/rn/tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances, selectProvisionalPayoffs } from '@/store/balanceSelectors';
import { selectPaydayGuardian, selectReserveRelease } from '@/store/guardianSelectors';
import { selectPlanState, selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';
import { liveDebts, partitionDebts, debtLiveness } from '@/store/trustSelectors';

const DAY = '2026-08-26';
const NEXT = '2026-09-09';
const ANCHOR = '2026-05-01';
function store(strategy: 'snowball' | 'avalanche', withY: boolean, xApr: number): DebtStore {
  const s = runMigrations({
    version: 8,
    paycheck: { amount: '2500', currentDate: DAY, nextPaycheckDate: NEXT },
    debts: [
      { id: 'x', name: 'StoreCard', balance: 100, originalBalance: 800, minimumPayment: 120, apr: xApr, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
      ...(withY
        ? [{ id: 'y', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY }]
        : []),
    ],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    cushionFloor: 200,
    payoffStrategy: strategy,
    prefs: { onboardingComplete: true, hasSavingsElsewhere: true },
  });
  return { ...s, subscriptionPlan: 'premium', payoffStrategy: strategy, pendingReserveRelease: { tapped: false, covered: 150 } };
}
function run(label: string, s: DebtStore) {
  const e = withProjectedBalances(s, true);
  const a = selectAllocation(e);
  const p = partitionDebts(e);
  const brief = selectPaydayGuardian(e);
  const summary = a ? selectPlanSummary(e, a, selectRequiredRows(e, a)) : null;
  console.log(
    JSON.stringify({
      label,
      raw: s.debts.map((d) => `${d.id}:${d.balance}`),
      projected: e.debts.map((d) => `${d.id}:${d.balance}`),
      provisional: selectProvisionalPayoffs(s, true).map((d) => d.id),
      live: liveDebts(e).map((d) => d.id),
      partition: { live: p.live.length, cleared: p.cleared.length, unread: p.unreadBalance.length, total: e.debts.length },
      liveness: debtLiveness(e),
      planState: selectPlanState(e, a),
      snowballTo: a?.allocations.filter((x) => x.category === 'snowball').map((x) => `${x.debtId ?? x.targetId}:${x.amount}`),
      reserveReleaseTarget: selectReserveRelease(e)?.targetName,
      briefTitle: brief?.title,
      briefDetail: brief?.detail,
      briefSafeMove: brief?.safeMove,
      debtFreeDate: summary?.debtFreeDate,
      heroLabel: summary?.heroLabel,
    }),
  );
}
run('S1 snowball · X projects $0 · Y live', store('snowball', true, 20));
run('S2 avalanche · X (29% APR) projects $0 · Y live', store('avalanche', true, 29));
run('S3 snowball · ONLY X, projects $0', store('snowball', false, 20));
