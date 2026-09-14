/**
 * L1 probe 3 — a LEGITIMATELY SET $0 cushion line (readable, no repair). What does the Guardian brief say?
 * The band (`computeState`) maps a non-positive floor to 200; since `.5.2` the brief keeps 0.
 * Run from <tree>/apps/rn:  npx tsx --tsconfig <tree>/apps/rn/tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { effectivePaycheckBuffer } from '@/store/selectors';

const DAY = '2026-08-26';
const NEXT = '2026-09-09';
function store(amount: number, plan: 'premium' | 'free', floor: number): DebtStore {
  const s = runMigrations({
    version: 8,
    paycheck: { amount: String(amount), currentDate: DAY, nextPaycheckDate: NEXT },
    debts: [{ id: 'd0', name: 'Chase', balance: 5000, minimumPayment: 150, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY }],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 600, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    livingExpenses: [{ id: 'l0', name: 'Groceries', amount: 150, enabled: true }],
    cushionFloor: floor,
    prefs: { onboardingComplete: true, hasSavingsElsewhere: true },
  });
  return { ...s, subscriptionPlan: plan };
}
const CASES: [number, 'premium' | 'free', number][] = [
  [1000, 'premium', 0],
  [1000, 'free', 0],
  [1060, 'premium', 0],
  [1000, 'premium', 25],
  [1000, 'premium', 200],
];
for (const [amount, plan, floor] of CASES) {
  const s = store(amount, plan, floor);
  const b = selectPaydayGuardian(s);
  console.log(
    JSON.stringify({
      label: `${plan} paycheck ${amount} line ${floor}`,
      repairs: s.pendingDataRepairs.length,
      storedFloor: s.cushionFloor,
      buffer: effectivePaycheckBuffer(s),
      state: b?.state,
      floor: b?.floor,
      reachedFloor: b?.reachedFloor,
      title: b?.title,
      detail: b?.detail,
      safeMove: b?.safeMove,
    }),
  );
}
