import { selectJourneyTotals } from '@/store/journeySelectors';

/**
 * [P6.8.9.7.11.12.10 · C-D] — the Progress hero's journey line. Self-runs on import via `test:app`.
 *
 * ⛔ **The matrix, not one case.** The defect survived because the only shape anyone pictured was the one
 * where the two totals are EQUAL — a new user who has paid nothing — and there the wrong figure is right.
 * `.11.12.8`'s lesson one level down: *a test that picks the one member of a class that works reports on
 * the member, not the class.*
 *
 * ⚠️ A test on this file alone would be `.11.11`'s defect exactly — *a tested helper is not a used helper*.
 * The CALL is pinned by `progress-hero-total.spec.ts`, against the rendered hero.
 */
let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [journeySelectors: ${label}]`);
  passed++;
}
function eq(actual: unknown, expected: unknown, label: string) {
  assert(actual === expected, `${label} — got ${String(actual)}, expected ${String(expected)}`);
}

const debt = (balance: number, originalBalance?: number) => ({ balance, originalBalance });

// A new user who has paid nothing: the two totals agree, and this is the ONLY shape where the old code
// was right. Kept first so a regression here is unmistakable.
{
  const t = selectJourneyTotals([debt(5000, 5000)]);
  eq(t.totalPaid, 0, 'nothing paid');
  eq(t.pct, 0, 'nothing paid → 0%');
  eq(t.line, '$5,000 to go', 'a fresh portfolio leads forward with what is owed');
}

// ⛔ THE DEFECT. Balance revised UPWARD before anything was paid: `totalPaid` clamps to 0, the "to go"
// branch fires, and it used to print the ORIGINAL — telling the user they owe $400 less than they do.
{
  const t = selectJourneyTotals([debt(5400, 5000)]);
  eq(t.totalOriginal, 5000, 'the original is still what it was');
  eq(t.totalCurrent, 5400, 'and the current total has grown past it');
  eq(t.totalPaid, 0, 'growth is not negative progress');
  eq(t.line, '$5,400 to go', '"to go" is what is owed TODAY, never the original');
}

// The same shape across several debts, one of which grew enough to swallow another's paydown.
{
  const t = selectJourneyTotals([debt(6000, 5000), debt(900, 1000)]);
  eq(t.totalPaid, 0, 'net-unpaid-down across the portfolio');
  eq(t.line, '$6,900 to go', 'the aggregate is what is owed, not the aggregate of originals');
}

// Genuine progress → the other branch, which is measured against where the journey STARTED.
{
  const t = selectJourneyTotals([debt(4000, 5000)]);
  eq(t.totalPaid, 1000, 'paid down');
  eq(t.pct, 20, '20% of the original cleared');
  eq(t.line, '$1,000 of $5,000 paid', 'progress is measured against the original — that is what "paid" means');
}

// Cleared debts stay in `store.debts` with `balance: 0` (`models.ts`), carrying their original.
{
  const t = selectJourneyTotals([debt(0, 5000), debt(0, 1200)]);
  eq(t.pct, 100, 'every balance cleared → 100%');
  eq(t.line, '$6,200 of $6,200 paid', 'a finished journey states its whole size');
}

// No `originalBalance` (a debt that predates the field and missed the backfill) falls back to the balance,
// so it contributes to neither progress nor a false original.
{
  const t = selectJourneyTotals([debt(2500)]);
  eq(t.totalOriginal, 2500, 'absent original reads as the current balance');
  eq(t.line, '$2,500 to go', 'and the line still states what is owed');
}

// An empty portfolio never reaches this on Progress (the screen shows its empty state first), but the
// division has to be safe for the day something else reads it.
{
  const t = selectJourneyTotals([]);
  eq(t.pct, 0, 'no debts → 0%, not NaN');
  eq(t.line, '$0 to go', 'and no division by zero');
}

// ⛔ THE TWO BALANCE SETS. Premium projects the anchors forward, and 2.4 puts the two figures on opposite
// sides of that: "% paid" is measured against what was CONFIRMED paid, "to go" against what is owed today.
// A first cut put both on the projection, which makes progress fall while the user does nothing.
{
  // Nothing paid, and three months of interest projected on top.
  const t = selectJourneyTotals([debt(5000, 5000)], [debt(5096)]);
  eq(t.totalConfirmed, 5000, 'the confirmed anchor is untouched by the projection');
  eq(t.totalPaid, 0, 'and no progress is invented or destroyed by it');
  eq(t.pct, 0, '"% paid" does not move because interest accrued');
  eq(t.line, '$5,096 to go', 'but "to go" states what is owed today');
}
{
  // Genuine progress AND a live projection: the paid branch must not quietly start reading the estimate.
  const t = selectJourneyTotals([debt(4000, 5000)], [debt(4050)]);
  eq(t.totalPaid, 1000, 'progress is what was confirmed paid, not original-minus-estimate');
  eq(t.line, '$1,000 of $5,000 paid', 'and the sentence says so');
}
// Free users pass one array; the default must behave exactly like passing it twice.
{
  const one = selectJourneyTotals([debt(5400, 5000)]);
  const two = selectJourneyTotals([debt(5400, 5000)], [debt(5400)]);
  eq(one.line, two.line, 'the single-argument call is the no-projection case, not a different rule');
  eq(one.totalCurrent, two.totalCurrent, '…including its remaining total');
}

console.log(`✅ journeySelectors: ${passed} assertions`);
