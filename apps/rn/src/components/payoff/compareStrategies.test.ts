import type { DebtClearPoint, TrajectoryPoint } from '@/store/payoffSelectors';

import { buildStrategyComparison, comparisonTakeaway } from './compareStrategies';

/**
 * P6.8.7g.5 (audit C7 / [D59]) — the strategy comparison.
 *
 * ⛔ **The cases here are the MEASURED ones, not invented ones.** They come from
 * `docs/evidence/2026-08-24-c7-strategy-divergence/`, where the two strategies were run against real
 * portfolios: identical dates and identical order on most, a nineteen-month first-win gap on one, and a
 * reshuffled order on another. If the engine ever stops producing those shapes, these should fail.
 *
 * ⚠️ **The "no difference" case is a first-class assertion, not an edge case.** Most portfolios genuinely
 * produce the same plan either way, and a comparison that manufactures a distinction there is the app
 * arguing for a choice the user does not have.
 */

let passed = 0;

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function eq<T>(actual: T, expected: T, label: string) {
  assert(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

/** A curve reaching zero at `to`. */
function curve(to: number): TrajectoryPoint[] {
  return Array.from({ length: to + 1 }, (_, m) => ({ month: m, balance: Math.max(0, 100 * (1 - m / to)) }));
}
const clears = (...xs: [string, number][]): DebtClearPoint[] => xs.map(([name, month]) => ({ name, month }));

function run() {
  console.log('Running strategy comparison (C7) tests...');

  // ── the measured "classic 3-card": identical dates AND identical order ──
  {
    const cmp = buildStrategyComparison({
      snowball: curve(27),
      avalanche: curve(27),
      snowballClears: clears(['Store card', 3], ['Visa', 18], ['Car loan', 27]),
      avalancheClears: clears(['Store card', 3], ['Visa', 18], ['Car loan', 27]),
    });
    eq(cmp.differs, false, 'identical date and order → nothing to choose between');
    eq(comparisonTakeaway(cmp), 'On your debts, these two produce exactly the same plan.', 'and it says so plainly');
  }

  // ── the measured "tiny cheap + huge expensive": same date, first win 19 months apart ──
  {
    const cmp = buildStrategyComparison({
      snowball: curve(42),
      avalanche: curve(42),
      snowballClears: clears(['Tiny cheap', 1], ['Huge expensive', 42]),
      avalancheClears: clears(['Tiny cheap', 20], ['Huge expensive', 42]),
    });
    eq(cmp.differs, true, 'same date but a different first win still differs');
    eq(cmp.finishSooner, 0, 'the finish is a tie');
    eq(cmp.firstWinSooner, 19, 'snowball wins the first debt 19 months sooner');
    eq(
      comparisonTakeaway(cmp),
      'Same debt-free date, snowball clears your first debt 19 months sooner.',
      'the takeaway leads with the tie and then names the real difference',
    );
  }

  // ── the measured "five mixed": the ORDER reshuffles ──
  {
    const cmp = buildStrategyComparison({
      snowball: curve(28),
      avalanche: curve(28),
      snowballClears: clears(['A', 2], ['D', 4], ['B', 10], ['C', 18], ['E', 28]),
      avalancheClears: clears(['D', 3], ['B', 9], ['A', 10], ['C', 18], ['E', 28]),
    });
    eq(cmp.differs, true, 'a reshuffled order differs');
    eq(cmp.snowball.clears[0].name, 'A', 'snowball clears the smallest first');
    eq(cmp.avalanche.clears[0].name, 'D', 'avalanche clears the most expensive first');
    eq(cmp.firstWinSooner, 1, 'and snowball is one month sooner to a first win');
  }

  // ── avalanche genuinely finishing sooner (the measured 53 vs 51) ──
  {
    const cmp = buildStrategyComparison({
      snowball: curve(53),
      avalanche: curve(51),
      snowballClears: clears(['a', 5], ['big', 53]),
      avalancheClears: clears(['big', 51], ['a', 12]),
    });
    eq(cmp.finishSooner, 2, 'avalanche finishes 2 months sooner');
    assert(comparisonTakeaway(cmp).startsWith('Avalanche finishes 2 months sooner'), 'and the takeaway leads with it');
  }

  // ── ⛔ no interest figure is produced, and that is deliberate ([D59]) ──
  {
    const cmp = buildStrategyComparison({
      snowball: curve(20),
      avalanche: curve(18),
      snowballClears: clears(['a', 4], ['b', 20]),
      avalancheClears: clears(['b', 18], ['a', 9]),
    });
    const text = comparisonTakeaway(cmp);
    assert(!/\$|interest|cheaper|save/i.test(text), 'the takeaway states no dollar or interest claim');
    assert(!('interestSaved' in cmp), 'and the comparison carries no interest field to render');
  }

  // ── degenerate inputs ──
  {
    const cmp = buildStrategyComparison({ snowball: [], avalanche: [], snowballClears: [], avalancheClears: [] });
    eq(cmp.snowball.debtFreeMonth, null, 'no curve → no debt-free month');
    eq(cmp.firstWinSooner, null, 'no clears → no first-win comparison');
    eq(cmp.differs, false, 'nothing to compare is not a difference');
  }
  {
    // A plan that never clears on one side only — the comparison must not invent a delta.
    const cmp = buildStrategyComparison({
      snowball: curve(30),
      avalanche: [{ month: 0, balance: 100 }],
      snowballClears: clears(['a', 5]),
      avalancheClears: [],
    });
    eq(cmp.finishSooner, null, 'one side never clearing yields no finish delta');
    eq(cmp.firstWinSooner, null, 'and no first-win delta');
  }
  {
    // A clear recorded at month 0 is the seed row, not a win the plan produced.
    const cmp = buildStrategyComparison({
      snowball: curve(10),
      avalanche: curve(10),
      snowballClears: clears(['already paid', 0], ['real', 4]),
      avalancheClears: clears(['already paid', 0], ['real', 4]),
    });
    eq(cmp.snowball.firstWinMonth, 4, 'a month-0 clear is not counted as the first win');
  }

  console.log(`\n✅ strategy comparison: ${passed} assertions passed\n`);
}

run();
