import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { ON_PLAN_STREAK_MIN, selectOnPlanStreak, selectOnPlanStreakLabel, selectRequiredRows } from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';

/**
 * 3.7.B.1 — the paid-required-row RE-ADD, on BOTH paid-state shapes.
 *
 * The allocation drops items already paid this cycle, so `selectRequiredRows` re-adds them (struck
 * through, undo-able) — a paid bill must never silently vanish from Today. Every other reader of a
 * debt's paid state falls back (`minimumPaidThisCycle ?? isPaidThisCycle`) because
 * `minimumPaidThisCycle` is OPTIONAL and pre-[D2] data carries only `isPaidThisCycle`; the re-add
 * filter did not. The allocator dropped such a debt and the re-add declined to restore it, so the row
 * disappeared outright — for the whole Phase-5 migration population, whose data predates the field.
 *
 * Also carries 3.7.B.3 (F10.3) — the free on-plan streak caption and, more importantly, its FLOOR, which
 * is what keeps a track-record claim off a day-one demo.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

/** One debt whose minimum is covered, in whichever paid-state shape the caller asks for. */
function storeWithPaidDebt(paid: { minimumPaidThisCycle?: boolean; isPaidThisCycle?: boolean }): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    paycheck: { ...s.paycheck, amount: '2000' },
    debts: [
      { id: 'card', name: 'Card', balance: 5000, minimumPayment: 50, apr: 20, dueDate: today, type: 'debt', recurrence: 'monthly', ...paid },
    ],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

function rowsFor(store: DebtStore) {
  const allocation = selectAllocation(store);
  if (!allocation) throw new Error('FAIL [setup] — no allocation');
  return selectRequiredRows(store, allocation);
}

function run() {
  console.log('Running required-row re-add (3.7.B.1) tests...');

  // Baseline: an UNPAID minimum is a live row straight off the allocation.
  const unpaid = rowsFor(storeWithPaidDebt({}));
  assert(unpaid.length === 1, 'unpaid minimum → one required row');
  assert(unpaid[0].view.isPaid === false, 'unpaid minimum → the row does not read as paid');

  // [D2]'s owner field — the shape every write since 3.4 produces.
  const current = rowsFor(storeWithPaidDebt({ minimumPaidThisCycle: true }));
  assert(current.length === 1, '`minimumPaidThisCycle` → the paid row is re-added, not dropped');
  assert(current[0].view.isPaid === true, '`minimumPaidThisCycle` → the row reads as paid (struck through)');

  // The legacy shape: paid state recorded ONLY on `isPaidThisCycle`. The allocator already honours it
  // (`minimumPaidThisCycle ?? isPaidThisCycle`), so the row is dropped there and MUST be re-added here.
  const legacy = rowsFor(storeWithPaidDebt({ isPaidThisCycle: true }));
  assert(legacy.length === 1, 'legacy `isPaidThisCycle` → the paid row is re-added, not dropped');
  assert(legacy[0].view.isPaid === true, 'legacy `isPaidThisCycle` → the row reads as paid (struck through)');

  // Both set (what the payday checkpoint writes) — still exactly one row, never a duplicate.
  const both = rowsFor(storeWithPaidDebt({ minimumPaidThisCycle: true, isPaidThisCycle: true }));
  assert(both.length === 1, 'both flags → one row, not two (the re-add respects `shownDebts`)');

  // ── 3.7.B.3 (F10.3) — the free on-plan streak caption ──
  const withHistory = (onPlan: boolean[]): DebtStore => ({
    ...createDefaultStore(),
    cycleHistory: onPlan.map((allRequiredMet, i) => ({ cycleEndDate: `2026-0${i + 1}-01`, allRequiredMet }) as DebtStore['cycleHistory'][number]),
  });

  assert(selectOnPlanStreak(withHistory([])) === 0, 'no history → no streak');
  assert(selectOnPlanStreak(withHistory([true, true, true])) === 3, 'three on-plan cycles → 3');
  assert(selectOnPlanStreak(withHistory([true, false, true, true])) === 2, 'a broken cycle ends the run (counts back from the latest)');
  assert(selectOnPlanStreak(withHistory([true, true, false])) === 0, 'the MOST RECENT cycle off-plan → 0, whatever came before');

  // The floor is the honesty rule, not a formatting detail: at 1 the line would fire the first time
  // anyone completes a cycle. It is also what keeps this off the day-one demo by construction.
  assert(selectOnPlanStreakLabel(withHistory([true])) === null, `a single cycle is below the floor (${ON_PLAN_STREAK_MIN}) → no claim`);
  assert(selectOnPlanStreakLabel(withHistory([true, true])) === '2 paychecks on plan', 'at the floor → the caption');
  assert(selectOnPlanStreakLabel(withHistory([true, true, true, true])) === '4 paychecks on plan', '…and counts up');
  assert(selectOnPlanStreakLabel(withHistory([false])) === null, 'an off-plan cycle → nothing to say');

  // Legacy snapshots predate `allRequiredMet`; they default on-plan so a later fix never retroactively
  // zeroes a real streak (`isCycleOnPlan`). Pinned here because the display rule now depends on it.
  const legacySnapshots = { ...createDefaultStore(), cycleHistory: [{ cycleEndDate: '2026-01-01' }, { cycleEndDate: '2026-02-01' }] as DebtStore['cycleHistory'] };
  assert(selectOnPlanStreakLabel(legacySnapshots) === '2 paychecks on plan', 'legacy snapshots with no `allRequiredMet` count as on-plan');

  console.log(`✅ required-row re-add + on-plan streak (3.7.B.1/B.3) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
