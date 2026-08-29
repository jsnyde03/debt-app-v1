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
  // ⛔ S1.11.4.2 [C4-2] takes the STORE now: an array cannot answer it, being silent about what was unread.
  assert(isLastLiveDebt(storeWith([debt({ id: 'x', balance: 500 }), debt({ id: 'y', balance: 0 })]), 'x') === true, 'x is the only live debt → finale');
  assert(isLastLiveDebt(storeWith([debt({ id: 'x', balance: 500 }), debt({ id: 'w', balance: 200 })]), 'x') === false, 'two live debts → not the last');
  assert(isLastLiveDebt(storeWith([debt({ id: 'y', balance: 0 })]), 'y') === false, 'an already-$0 debt is not a live-last');

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

  paidOffClaimClass();

  console.log(`✅ Celebration selectors (3.3.1.1) tests passed (${passed} asserts).`);
}

/**
 * ⛔ **S1.11.4.2 [pass-4 blocker `C4-2`] — *"THIS DEBT IS PAID OFF"* IS A CLAIM, AND FOUR SURFACES MADE IT
 * WITHOUT ASKING WHETHER THE BALANCE WAS READ.**
 *
 * ⚡ A balance the reader loses repairs to `0`, and `d.balance <= 0` is the one test that value passes.
 * Measured on one store with one variable — a $12,000 Chase balance lost, beside an intact Amex, so the
 * user is provably not debt-free — the permanent trophy shelf read *"Chase — $12,000 paid off"* with a
 * Share button composing *"I paid off 1 debt ($12,000) on my way to debt-free 🎉"*. ⛔ `C-4` had already
 * guarded the **amount** at both mount points and claimed in its own docblock that it *"fixes BOTH mount
 * points"*; it fixes the figure at both and the **membership** at neither, because `originalBalance` — the
 * field it guards — had been read perfectly.
 *
 * ⛔ **THE ASSERTION WALKS THE SURFACES, because fixing the one that was reported is what produced this
 * round.** Two of the four are latent rather than shipped *(`debtsCleared` renders only inside a finale
 * `selectCelebration` already gates; `isLastLiveDebt` has no production consumer today)* and they are in
 * the list anyway: the class is the question being asked, not the blast radius of today's wiring.
 *
 * ⚠️ **`money.tsx`'s section heading is the fifth surface and it is NOT here** — it is a render, proven by
 * `tests/e2e/trust-claims.spec.ts`. What this file can prove about it is the PRODUCER, and that is the
 * partition invariant in `trustSelectors.test.ts`: the row must move out of "PAID OFF" **without leaving
 * the screen**, which the finding's own stated remedy would have done.
 */
function paidOffClaimClass() {
  const chase = (balance: number) =>
    debt({ id: 'c1', name: 'Chase', balance, originalBalance: 12000, lastVerifiedDate: '2026-08-01' });
  const amex = debt({ id: 'a1', name: 'Amex', balance: 4000, originalBalance: 6000 });
  /** The repair `migrations.ts` records for a balance it could not parse — quoted from the producer's
   *  own shape rather than re-spelled, and `kind: 'lost'` is what makes the repaired `0` distinguishable
   *  from a real one. */
  const lostBalance = { entity: 'debt' as const, id: 'c1', name: 'Chase', field: 'balance', kind: 'lost' as const };

  const UNREAD = { ...storeWith([chase(0), amex]), pendingDataRepairs: [lostBalance] };
  const CONTROL = storeWith([chase(12000), amex]);

  assert(UNREAD.debts.length === CONTROL.debts.length, '⭐ fixture — one variable apart, same two debts');

  /** ⛔ ONE LIST. Each row states what its surface would put in front of the user, and every row is
   *  asserted in BOTH directions — a surface that stopped claiming anything at all would satisfy the
   *  refusal half on its own. */
  const SURFACES: { label: string; claims: (s: DebtStore) => number }[] = [
    { label: 'the trophy shelf · PaidOffArchive', claims: (s) => selectPaidOffDebts(s).length },
    { label: 'the finale stat-trio · debtsCleared', claims: (s) => selectCelebrationStats(s).debtsCleared },
    // A live-last of TRUE is the app saying "clearing Amex makes you debt-free" over an unread $12,000.
    { label: 'the beat-vs-finale decision · isLastLiveDebt', claims: (s) => (isLastLiveDebt(s, 'a1') ? 1 : 0) },
  ];

  for (const { label, claims } of SURFACES) {
    assert(claims(UNREAD) === 0, `⛔ ${label} — claims NOTHING about a balance the app could not read (got ${claims(UNREAD)})`);
  }
  // ⭐ THE CONTROLS, and they are not symmetric — each surface is asked for the thing it really says on a
  // store the app read in full, so a surface that had simply gone silent cannot pass this file.
  const reallyCleared = { ...storeWith([chase(0), amex]) };
  assert(selectPaidOffDebts(reallyCleared).length === 1, '⭐ control — a genuinely cleared Chase is still on the shelf');
  assert(selectPaidOffDebts(reallyCleared)[0].amount === 12000, '⭐ control — …at its real figure, not withheld');
  assert(selectCelebrationStats(reallyCleared).debtsCleared === 1, '⭐ control — …and the finale still counts it');
  assert(isLastLiveDebt(reallyCleared, 'a1') === true, '⭐ control — …and Amex really is the last live debt');
  assert(isLastLiveDebt(CONTROL, 'a1') === false, '⭐ control — with Chase readable and owed, Amex is not the last');
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
