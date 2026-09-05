import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectDebtFreeBand } from '@/store/planSelectors';

/**
 * VIS-5 (closeout) — the variable-income debt-free BAND. Pure "one engine, two runs" derivation.
 * Self-runs on import via `test:app`.
 */
let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [debtFreeBand: ${label}]`);
  passed++;
}

function storeWith(over: Partial<DebtStore['paycheck']>): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    debts: [
      { id: 'd0', name: 'Card', balance: 12000, minimumPayment: 200, apr: 22, dueDate: '2026-08-01', type: 'debt', recurrence: 'monthly', originalBalance: 12000, balanceAsOfDate: '2026-08-01', lastVerifiedDate: '2026-08-01' },
    ],
    /**
     * ⛔ **A WINDOW IS A PAIR, AND PINNING ONE END IS NOT PINNING THE WINDOW.**
     * [S1.13.7.12.6 `.4.11` — found by a 365-day walk while fixing the same defect in `F2`]
     *
     * ⚡ `currentDate` was pinned to `2026-08-01` and `nextPaycheckDate` was left to come from
     * `createDefaultStore()`, **which derives it from the clock.** The window between them therefore
     * **widened by one day per day**: 49 days at the time of writing, growing without bound. Measured by
     * running this suite under a pinned clock — green through 2027-04-09, then **red every sampled date
     * after it**, on `variable income yields both dates`, because the lean run's payoff eventually goes
     * `DEBT_FREE_DATE_UNPAYABLE` and `selectDebtFreeDate` maps that to `null`.
     *
     * ⚠️ **`lint:fixture-dates` cannot see this and is not wrong to miss it** — it looks for a literal
     * date about to arrive, and this literal is in the PAST. The fuse is the *unpinned other end*, which
     * is not a date in this file at all. Both ends are pinned now.
     */
    paycheck: { ...s.paycheck, amount: '3000', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01', payCycle: 'monthly', ...over },
  };
}

// Fixed income → exactly one date, no band.
{
  const band = selectDebtFreeBand(storeWith({ incomeVaries: false, leanAmount: 0 }));
  assert(band.hasBand === false, 'fixed income has no band');
  assert(band.lean === null, 'fixed income lean is null');
  assert(band.typical !== null, 'fixed income still has a typical date');
}

// Variable income but lean === typical income → the two runs match → still no band.
{
  const band = selectDebtFreeBand(storeWith({ incomeVaries: true, leanAmount: 3000 }));
  assert(band.hasBand === false, 'equal typical/lean income → dates match → no band');
}

// Variable income with a materially lower lean → both dates + a real band, lean no earlier than typical.
{
  const band = selectDebtFreeBand(storeWith({ incomeVaries: true, leanAmount: 2000 }));
  assert(band.typical !== null && band.lean !== null, 'variable income yields both dates');
  assert(band.hasBand === true, 'a materially lower lean income produces a band');
  assert(new Date(band.lean as string).getTime() >= new Date(band.typical as string).getTime(), 'lean payoff is not earlier than typical');
}

console.log(`\n  debtFreeBand: ${passed} assertions passed\n`);
