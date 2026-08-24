import { mintDebtIds, newDebtId } from './debtIds';

/**
 * P6.8.7g.2 (audit C8) — debt id minting, for one debt and for a whole imported batch.
 *
 * ⛔ **The batch case is the reason this file exists.** `newDebtId` derives uniqueness from the ids that
 * already exist, which is correct and is exactly why calling it in a loop over an UNCHANGED list returns
 * the same id every time — the list has not grown. A CSV import is the first caller that mints more than
 * one id at once, so the failure had nowhere to show up before.
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

const DATE = '2026-09-01';

function run() {
  console.log('Running debt id minting (C8) tests...');

  // ── one at a time, the shape the debt sheet uses ──
  eq(newDebtId(DATE, []), 'debt-2026-09-01-1', 'the first debt of a cycle is -1');
  eq(newDebtId(DATE, [{ id: 'debt-2026-09-01-1' }]), 'debt-2026-09-01-2', 'the next debt takes the next number');

  // ── the id is derived from what EXISTS, so a gap does not produce a collision ──
  eq(
    newDebtId(DATE, [{ id: 'debt-2026-09-01-1' }, { id: 'debt-2026-09-01-2' }, { id: 'legacy-uuid' }]),
    'debt-2026-09-01-4',
    'a foreign id still counts toward the length, and the result is unused',
  );
  {
    // The length-based start can land on a taken id; the loop must walk past it rather than collide.
    const existing = [{ id: 'debt-2026-09-01-2' }];
    const id = newDebtId(DATE, existing);
    assert(id !== 'debt-2026-09-01-2', 'a start that is already taken is walked past');
  }

  // ── a batch: every id unique against the portfolio AND against the rest of the batch ──
  {
    const ids = mintDebtIds(DATE, [], 3);
    eq(ids.length, 3, 'a batch of 3 mints 3 ids');
    eq(new Set(ids).size, 3, 'the ids within a batch are distinct');
    eq(ids[0], 'debt-2026-09-01-1', 'a batch starts where a single mint would');
  }
  {
    const existing = [{ id: 'debt-2026-09-01-1' }, { id: 'debt-2026-09-01-2' }];
    const ids = mintDebtIds(DATE, existing, 3);
    eq(new Set([...ids, ...existing.map((e) => e.id)]).size, 5, 'a batch collides with neither the portfolio nor itself');
  }
  {
    // ⛔ The regression this file is for: the loop-over-an-unchanged-list bug hands out one id N times.
    const naive = Array.from({ length: 4 }, () => newDebtId(DATE, []));
    eq(new Set(naive).size, 1, 'minting without an accumulator DOES collide — which is why mintDebtIds exists');
    const ids = mintDebtIds(DATE, [], 4);
    eq(new Set(ids).size, 4, 'mintDebtIds does not');
  }

  eq(mintDebtIds(DATE, [], 0).length, 0, 'a batch of nothing mints nothing');

  console.log(`\n✅ debt id minting: ${passed} assertions passed\n`);
}

run();
