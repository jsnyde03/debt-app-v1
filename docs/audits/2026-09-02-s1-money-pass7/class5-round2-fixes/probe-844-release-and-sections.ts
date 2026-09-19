/**
 * 8.4.4 switch-in probe, on the tree at 69d1df71. Reuses round 1's L1 fixtures (p2-projected-zero-focus, p7-money-sections).
 *
 *  A · the LEAD — the reserve-release card asks no trust claim, and on avalanche `rankDebts` sorts by APR. Does a LOST rate make it
 *      name a different debt than the Guardian brief on the same store, while nothing refuses?
 *  B · L1-2 — a premium debt whose estimate reached $0, unconfirmed: what the card names vs the allocation's first snowball row.
 *  C · L1-R1 — Money's three sections (active = view.order on the projection; unread/paid off = partitionDebts on the raw store).
 *
 * Read-only. Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian, selectReserveRelease } from '@/store/guardianSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { selectAllocation } from '@/store/selectors';
import { mayClaim, partitionDebts } from '@/store/trustSelectors';

const DAY = '2026-08-26';
const NEXT = '2026-09-09';
const ANCHOR = '2026-05-01';

function firstSnowballName(s: DebtStore): string | null {
  const a = selectAllocation(s);
  const row = (a?.allocations ?? []).find((x) => x.category === 'snowball');
  const id = row ? (row.debtId ?? row.targetId) : undefined;
  return id ? (s.debts.find((d) => d.id === id)?.name ?? null) : null;
}

// ── A · the lead ───────────────────────────────────────────────────────────────────────────────────────────
console.log('== A · reserve release on avalanche, a lost Chase rate vs readable ==');
for (const chaseApr of [22, ''] as const) {
  const raw = runMigrations({
    version: 8,
    paycheck: { amount: '3000', currentDate: DAY, nextPaycheckDate: NEXT },
    debts: [
      { id: 'c', name: 'Chase', balance: 5000, originalBalance: 6000, minimumPayment: 150, apr: chaseApr, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
      { id: 'v', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
    ],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    cushionFloor: 200,
    payoffStrategy: 'avalanche',
    prefs: { onboardingComplete: true },
  });
  const s: DebtStore = { ...raw, subscriptionPlan: 'premium', payoffStrategy: 'avalanche', pendingReserveRelease: { tapped: false, covered: 150 } };
  const e = withProjectedBalances(s, true);
  console.log(JSON.stringify({
    chaseApr: chaseApr === '' ? "'' (lost)" : chaseApr,
    repairs: s.pendingDataRepairs.map((r) => `${r.entity}.${r.field}`),
    releaseNames: selectReserveRelease(e)?.targetName ?? null,
    guardianNames: selectPaydayGuardian(e)?.detail?.match(/toward ([A-Z][A-Za-z]+)/)?.[1] ?? null,
    allocationFirstSnowball: firstSnowballName(e),
    "mayClaim('paycheck-plan')": mayClaim(s, 'paycheck-plan'),
  }));
}

// ── B · L1-2 ───────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n== B · a debt projected to $0, unconfirmed: what the release names vs the plan ==');
for (const strategy of ['snowball', 'avalanche'] as const) {
  const raw = runMigrations({
    version: 8,
    paycheck: { amount: '2500', currentDate: DAY, nextPaycheckDate: NEXT },
    debts: [
      { id: 'x', name: 'StoreCard', balance: 100, originalBalance: 800, minimumPayment: 120, apr: 20, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
      { id: 'y', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
    ],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    cushionFloor: 200,
    payoffStrategy: strategy,
    prefs: { onboardingComplete: true },
  });
  const s: DebtStore = { ...raw, subscriptionPlan: 'premium', payoffStrategy: strategy, pendingReserveRelease: { tapped: false, covered: 150 } };
  const e = withProjectedBalances(s, true);
  console.log(JSON.stringify({
    strategy,
    projected: e.debts.map((d) => `${d.name}:${d.balance}`),
    releaseNames: selectReserveRelease(e)?.targetName ?? null,
    allocationFirstSnowball: firstSnowballName(e),
  }));
}

// ── C · L1-R1 ──────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n== C · Money's three sections — is every debt in exactly one? ==");
for (const plan of ['premium', 'free'] as const) {
  const raw = runMigrations({
    version: 8,
    paycheck: { amount: '2500', currentDate: DAY, nextPaycheckDate: NEXT },
    debts: [
      { id: 'x', name: 'StoreCard', balance: 100, originalBalance: 800, minimumPayment: 120, apr: 20, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
      { id: 'y', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
      { id: 'z', name: 'OldLoan', balance: 0, originalBalance: 500, minimumPayment: 50, apr: 5, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
    ],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    cushionFloor: 200,
    prefs: { onboardingComplete: true },
  });
  const s: DebtStore = { ...raw, subscriptionPlan: plan };
  const view = selectPayoffView(withProjectedBalances(s, plan === 'premium'));
  const { cleared, unreadBalance } = partitionDebts(s);
  const shown = [...view.order.map((d) => d.id), ...unreadBalance.map((d) => d.id), ...cleared.map((d) => d.id)];
  console.log(JSON.stringify({
    plan,
    active: view.order.map((d) => d.name),
    unread: unreadBalance.map((d) => d.name),
    paidOff: cleared.map((d) => d.name),
    missing: s.debts.filter((d) => !shown.includes(d.id)).map((d) => d.name),
    doubled: shown.filter((id, i) => shown.indexOf(id) !== i),
  }));
}
