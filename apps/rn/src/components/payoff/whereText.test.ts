import type { ExtraPaymentAllocationItem } from '@core/debt/extraPaymentPlan';

import type { WhatIfResult } from '@/store/analysisSelectors';

import { whereText } from './whereText';

/**
 * ⛔ **S1.11.3.4 [pass-3 `m6`] — THE SENTENCE THE SIMULATOR EXISTS TO SAY, AND IT HAD NO TEST.**
 *
 * `m6` closed by adding the single-debt payoff branch, and the registered guard was that branch's own
 * line: a token proving the sentence is present in a file no runner can load. ⚡ Measured at S1.11.3.4:
 * **nothing in the tree asserts any of these four strings** — not a unit test, not an e2e. The rule was
 * extracted out of the component for that reason and this is the assertion that makes it falsifiable.
 *
 * ⚠️ **All four branches, because a plant reds only the assertion it reaches.** The `m6` row is the third;
 * the two above it exist so a fix that broke the pair case would not hide behind it, and the fall-through
 * is the row that proves the payoff branches are not simply swallowing everything.
 */
let passed = 0;
function eq(actual: string | null, expected: string | null, label: string) {
  if (actual !== expected) throw new Error(`FAIL [${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

const item = (debtName: string, amount: number, isPaidOff: boolean): ExtraPaymentAllocationItem => ({
  debtId: debtName.toLowerCase(),
  debtName,
  amount,
  remainingBalanceAfterPayment: isPaidOff ? 0 : 100,
  isPaidOff,
});

const result = (allocation: ExtraPaymentAllocationItem[]): WhatIfResult =>
  ({ allocation }) as unknown as WhatIfResult;

function run() {
  console.log('\n▶ what-if: where the extra goes');

  eq(whereText(result([])), null, 'nothing allocated says nothing');
  // ⚠️ A zero-amount row is not an allocation. Without the filter the sentence would name a debt the
  // extra never reached.
  eq(whereText(result([item('Chase', 0, false)])), null, 'a $0 row is not where the money went');
  eq(
    whereText(result([item('Chase', 300, true), item('Visa', 100, false)])),
    'Pays off your Chase, then hits Visa',
    'clearing the first debt with a second behind it names both',
  );
  eq(
    whereText(result([item('Chase', 300, true)])),
    'Pays off your Chase',
    '⛔ m6 — the extra clears the ONLY debt: this is a payoff, not a dent',
  );
  eq(
    whereText(result([item('Chase', 50, false)])),
    'Goes straight to your Chase',
    'a partial payment is still described as a partial payment',
  );

  console.log(`✅ what-if where-text: ${passed} assertions passed.\n`);
}

run();
