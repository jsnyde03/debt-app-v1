import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { isLastLiveDebt, selectCelebrationStats, selectPaidOffDebts } from '@/store/celebrationSelectors';

/**
 * 3.3.1.1 — the debt-paid-off celebration's pure read layer: the "paid off" archive, the last-debt/finale
 * detector, and the honest finale stat-trio (no fabricated interest-saved — see the selector's header).
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function debt(over: Partial<Debt>): Debt {
  return { id: 'd', name: 'D', balance: 0, minimumPayment: 0, apr: 0, dueDate: '2026-08-01', type: 'debt', recurrence: 'monthly', ...over };
}

function storeWith(debts: Debt[], onboardedAt: string | null = '2026-01-01'): DebtStore {
  const s = createDefaultStore();
  return { ...s, debts, onboardedAt, paycheck: { ...s.paycheck, currentDate: '2026-09-01' } };
}

function run() {
  console.log('Running celebration selectors (3.3.1.1) tests...');

  // Archive — only $0 debts, most-recently-cleared first, honest amount/date, bnpl flag.
  const arch = selectPaidOffDebts(
    storeWith([
      debt({ id: 'a', name: 'Chase', balance: 0, originalBalance: 4200, lastVerifiedDate: '2026-06-15' }),
      debt({ id: 'b', name: 'Klarna', balance: 0, originalBalance: 320, lastVerifiedDate: '2026-08-08', type: 'bnpl' }),
      debt({ id: 'c', name: 'Live', balance: 900, originalBalance: 1000 }), // still owed → excluded
      debt({ id: 'z', name: 'NoOrig', balance: 0 }), // cleared but original never captured
    ]),
  );
  assert(arch.length === 3, `archive excludes live debts (3 cleared) — got ${arch.length}`);
  assert(arch[0].id === 'b', `most-recently-cleared first (Klarna 08-08) — got ${arch[0].id}`);
  assert(arch.find((v) => v.id === 'a')!.amount === 4200, 'amount = originalBalance');
  assert(arch.find((v) => v.id === 'z')!.amount === null, 'missing originalBalance → null (not fabricated)');
  assert(arch.find((v) => v.id === 'b')!.isBnpl === true, 'bnpl flagged');

  // isLastLiveDebt — true only when the id is the SOLE live debt (drives beat-vs-finale at confirm time).
  assert(isLastLiveDebt([debt({ id: 'x', balance: 500 }), debt({ id: 'y', balance: 0 })], 'x') === true, 'x is the only live debt → finale');
  assert(isLastLiveDebt([debt({ id: 'x', balance: 500 }), debt({ id: 'w', balance: 200 })], 'x') === false, 'two live debts → not the last');
  assert(isLastLiveDebt([debt({ id: 'y', balance: 0 })], 'y') === false, 'an already-$0 debt is not a live-last');

  // Finale stats — total = Σ originalBalance, count of cleared, months onboardedAt→latest clear.
  const stats = selectCelebrationStats(
    storeWith(
      [
        debt({ id: 'a', balance: 0, originalBalance: 4200, lastVerifiedDate: '2026-06-15' }),
        debt({ id: 'b', balance: 0, originalBalance: 800, lastVerifiedDate: '2026-08-08' }),
      ],
      '2026-01-01',
    ),
  );
  assert(stats.totalPaid === 5000, `total paid off = 4200+800 — got ${stats.totalPaid}`);
  assert(stats.debtsCleared === 2, `2 cleared — got ${stats.debtsCleared}`);
  assert(stats.monthsToFreedom === 7, `Jan→Aug = 7 months — got ${stats.monthsToFreedom}`);

  // No onboarding anchor → months is null (honest), not 0.
  const noAnchor = selectCelebrationStats(storeWith([debt({ id: 'a', balance: 0, originalBalance: 100, lastVerifiedDate: '2026-08-08' })], null));
  assert(noAnchor.monthsToFreedom === null, 'no onboardedAt → monthsToFreedom null');

  console.log(`✅ Celebration selectors (3.3.1.1) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
