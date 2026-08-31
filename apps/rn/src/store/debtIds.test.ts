import { mintDebtIds, newDebtId, reservedDebtIds } from './debtIds';

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

/** The reserved-id set the module now takes — see `reservedDebtIds`. */
const reserved = (...v: string[]) => new Set(v);

function run() {
  console.log('Running debt id minting (C8) tests...');

  // ── one at a time, the shape the debt sheet uses ──
  eq(newDebtId(DATE, reserved()), 'debt-2026-09-01-1', 'the first debt of a cycle is -1');
  eq(newDebtId(DATE, reserved('debt-2026-09-01-1')), 'debt-2026-09-01-2', 'the next debt takes the next number');

  // ── the id is derived from what EXISTS, so a gap does not produce a collision ──
  /**
   * ⛔ **THIS EXPECTED `-4` AND THE ANSWER IS `-3`, because the old expectation encoded the old
   * algorithm's quirk.** It started at `existing.length + 1`, so a foreign id inflated the start and a
   * FREE id was skipped. The rule the test's own label states — *"the result is unused"* — holds either
   * way; `-3` is simply the first one that is. [pass-5 `B5-9`]
   */
  eq(
    newDebtId(DATE, reserved('debt-2026-09-01-1', 'debt-2026-09-01-2', 'legacy-uuid')),
    'debt-2026-09-01-3',
    'a foreign id does not consume a debt number, and the result is unused',
  );
  {
    // The length-based start can land on a taken id; the loop must walk past it rather than collide.
    const id = newDebtId(DATE, reserved('debt-2026-09-01-2'));
    assert(id !== 'debt-2026-09-01-2', 'a start that is already taken is walked past');
  }


  /**
   * ⛔ **S1.12.5.7 [pass-5 `B5-9`] — A GAP IS THE ONLY SHAPE THAT REUSES AN ID, AND NO FIXTURE HAD ONE.**
   *
   * ⚡ Every one of this file's six pre-existing cases passed a contiguous, append-only list — `[]`,
   * `[-1]`, `[-1,-2,legacy]`. A gap is what a DELETE leaves behind, and `storeActions.test.ts` contains
   * **zero** occurrences of `removeDebt`, so the action that creates the dangling references was not
   * exercised anywhere.
   *
   * ⛔ **The measured consequence:** tick the extra-payment checkbox against a Store Card (**$500**),
   * delete it, add a Car loan → the Car loan took the dead id and was written down to **$10,967.54
   * instead of $11,467.54** at the next payday. $500 of a payment never made against it, persisted.
   */
  {
    // `-2` is gone (deleted) while `-1` and `-3` survive. The mint must not take `-2` if anything in the
    // store still names it — and `reservedDebtIds` is what puts it in this set.
    const withGap = reserved('debt-2026-09-01-1', 'debt-2026-09-01-2', 'debt-2026-09-01-3');
    eq(newDebtId(DATE, withGap), 'debt-2026-09-01-4', '⛔ B5-9 — a reserved id in a gap is never re-issued');
  }

  /**
   * ⛔ **AND THE SET IS THE WHOLE STORE, NOT THE `debts` ARRAY.** `reservedDebtIds` scans the serialized
   * store, so an id that survives only in `completedRecommendedActions` — the exact record that carried
   * the $500 — still reserves its number. ⚠️ Derived from the document rather than from a list of the
   * fields that key on debt id: such a list is right the day it is written and silent about the next
   * field anyone adds, which is the enumeration failure this round has watched eight times.
   */
  {
    const storeAfterDelete = {
      debts: [{ id: 'debt-2026-09-01-1', name: 'Visa' }],
      completedRecommendedActions: [{ category: 'snowball', targetId: 'debt-2026-09-01-2', actualAmount: 500 }],
      milestoneMaxProgress: { 'debt-2026-09-01-3': 75 },
      pendingPayoff: { debtId: 'debt-2026-09-01-4' },
    };
    const set = reservedDebtIds(storeAfterDelete);
    assert(set.has('debt-2026-09-01-2'), '⛔ B5-9 — an id surviving only in completedRecommendedActions is reserved');
    assert(set.has('debt-2026-09-01-3'), '⛔ B5-9 — …and one surviving only as a milestone key');
    assert(set.has('debt-2026-09-01-4'), '⛔ B5-9 — …and one surviving only in a pending payoff beat');
    eq(newDebtId(DATE, set), 'debt-2026-09-01-5', '⛔ B5-9 — so the new debt takes the first number nothing references');
  }

  /**
   * ⭐ **THE CONTROL, and without it "always mint a fresh high number" passes every row above.** On a
   * store with no dangling references the mint must still be the tight next number — otherwise the ids
   * march away from the portfolio and every delete costs a number forever.
   */
  {
    const clean = reservedDebtIds({ debts: [{ id: 'debt-2026-09-01-1' }, { id: 'debt-2026-09-01-2' }] });
    eq(newDebtId(DATE, clean), 'debt-2026-09-01-3', '⭐ B5-9 control — with nothing dangling, the next id is tight');
    eq(reservedDebtIds({ debts: [] }).size, 0, '⭐ B5-9 control — an empty store reserves nothing');
  }

  // ── a batch: every id unique against the portfolio AND against the rest of the batch ──
  {
    const ids = mintDebtIds(DATE, reserved(), 3);
    eq(ids.length, 3, 'a batch of 3 mints 3 ids');
    eq(new Set(ids).size, 3, 'the ids within a batch are distinct');
    eq(ids[0], 'debt-2026-09-01-1', 'a batch starts where a single mint would');
  }
  {
    const existing = ['debt-2026-09-01-1', 'debt-2026-09-01-2'];
    const ids = mintDebtIds(DATE, new Set(existing), 3);
    eq(new Set([...ids, ...existing]).size, 5, 'a batch collides with neither the portfolio nor itself');
  }
  {
    // ⛔ The regression this file is for: the loop-over-an-unchanged-list bug hands out one id N times.
    const naive = Array.from({ length: 4 }, () => newDebtId(DATE, reserved()));
    eq(new Set(naive).size, 1, 'minting without an accumulator DOES collide — which is why mintDebtIds exists');
    const ids = mintDebtIds(DATE, reserved(), 4);
    eq(new Set(ids).size, 4, 'mintDebtIds does not');
  }

  eq(mintDebtIds(DATE, reserved(), 0).length, 0, 'a batch of nothing mints nothing');

  console.log(`\n✅ debt id minting: ${passed} assertions passed\n`);
}

run();
