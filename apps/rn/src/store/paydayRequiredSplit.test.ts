import { readFileSync } from 'node:fs';

import { createDefaultStore } from '@/data/defaults';
import type { DebtStore, RequiredExpense } from '@/data/models';
import { requiredRowId, selectRequiredRows, selectRequiredSplit } from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';

/**
 * `S1.13.7.11` [pass-6 D3-5] — the payday sheet's *"$X paid · $Y carries"* caption.
 *
 * ⛔ **The two figures used to come from DIFFERENT POPULATIONS and the caption printed a NEGATIVE
 * amount as money the user PAID.** `requiredTotal` is `allocation.totalRequired`, a sum over the
 * items due before the next paycheck. `carryForward` sums `selectRequiredRows`, which ALSO carries
 * the re-add block's paid-early items — required items marked paid this cycle whose due date lands
 * AFTER the next paycheck, and which the allocation therefore never counted. Every such row is a
 * tappable checkbox, so unticking enough of them drove `requiredTotal - carryForward` below zero:
 * `-$150 paid · $200 carries`.
 *
 * ⚠️ D3's own report stopped one step short of this file on purpose — *"I have NOT observed
 * `-$150 paid` on a rendered screen … the remaining question is purely whether a required item can
 * hold `isPaidThisCycle === true` while `isDueBeforeNextPaycheck(dueDate) === false`. That is one
 * fixture, and it is the whole finding."* **This is that fixture, built on the real producers.**
 *
 * ⛔ **The obvious remedy is the wrong one.** `Math.max(0, requiredTotal - carryForward)` is what
 * `formatCurrency`'s own header forbids — it trades a visibly-false number for an invisibly-false
 * one, reading *"$0 paid"* while the user looks at rows they marked paid. The fix is that both
 * figures are reduced from **one** array, so the paid figure is a real sum and non-negativity holds
 * by construction rather than by a clamp.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
const R = (n: number) => Math.round(n * 100) / 100;
const eq = (actual: number, expected: number, label: string) =>
  assert(R(actual) === R(expected), `${label} (expected ${R(expected)}, got ${R(actual)})`);

const bill = (id: string, amount: number, dueDate: string, over: Partial<RequiredExpense> = {}): RequiredExpense =>
  ({ id, name: id, amount, dueDate, recurrence: 'monthly', category: 'housing', ...over }) as RequiredExpense;

const base = createDefaultStore();

/**
 * `rent` falls inside this cycle; `elec` and `nflx` land AFTER the 6/15 payday, so the allocation
 * never counts them. Marking the two late bills paid is what puts them on the sheet anyway, via
 * `selectRequiredRows`' re-add block.
 */
const store = (over: Partial<DebtStore> = {}): DebtStore => ({
  ...base,
  paycheck: { ...base.paycheck, amount: '1200', payCycle: 'biweekly', currentDate: '2026-06-01', nextPaycheckDate: '2026-06-15' },
  requiredExpenses: [
    bill('rent', 350, '2026-06-06'),
    bill('elec', 120, '2026-06-20', { isPaidThisCycle: true }),
    bill('nflx', 130, '2026-06-25', { isPaidThisCycle: true }),
  ],
  debts: [],
  ...over,
});

/** ⛔ The REAL identity function the sheet's checkbox writes — not a copy of it. */
const rowId = requiredRowId;

console.log('\n▶ D3-5 — the payday "paid · carries" caption reads ONE population');

const s = store();
const alloc = selectAllocation(s)!;
const rows = selectRequiredRows(s, alloc);

// ── the measurement D3 left owed: the two populations really do differ ──────────
const rowsTotal = rows.reduce((sum, r) => sum + r.item.amount, 0);
assert(rows.length === 3, `all three bills reach the sheet (got ${rows.length})`);
assert(
  alloc.totalRequired < rowsTotal,
  `the allocation's population is SMALLER than the sheet's (totalRequired ${alloc.totalRequired} < rows ${rowsTotal})`,
);
assert(
  rows.some((r) => rowId(r) === 'elec') && rows.some((r) => rowId(r) === 'nflx'),
  'both paid-early bills are on the sheet, due AFTER the next paycheck and absent from totalRequired',
);

// ── the defect: unticking the paid-early rows drives the RETIRED expression negative ──
const allUnpaid: Record<string, boolean> = {};
for (const r of rows) {
  const id = rowId(r);
  if (id) allUnpaid[id] = false;
}
const split = selectRequiredSplit(rows, allUnpaid);
assert(
  alloc.totalRequired - split.carries < 0,
  `the RETIRED expression goes negative on real producers (${alloc.totalRequired} - ${split.carries} = ${alloc.totalRequired - split.carries})`,
);

// ── the fix: one population, so `paid` is a real sum and cannot go negative ──────
eq(split.carries, 600, 'everything unticked carries');
eq(split.paid, 0, 'nothing is reported paid — and it is 0, NOT the negative the subtraction gave');
assert(split.paid >= 0, 'the paid figure is non-negative BY CONSTRUCTION, not by a clamp');

// ── the mixed case: the number the clamp got wrong in the OTHER direction ────────
const rentUnpaid = { rent: false, elec: true, nflx: true };
const mixed = selectRequiredSplit(rows, rentUnpaid);
eq(mixed.carries, 350, 'only the unticked rent carries');
eq(mixed.paid, 250, 'the two paid-early bills are the paid figure — the clamp reported 0 here');
eq(mixed.paid + mixed.carries, rowsTotal, 'paid + carries is identically the rows total');

// ── the control: with no paid-early rows the two populations agree ───────────────
// ⛔ This is what lets `capturedTotal`'s unadjusted branch keep reading `requiredTotal`. If the two
// ever stop agreeing on the ordinary case, THIS assertion is the one that says so.
const plain = store({
  requiredExpenses: [bill('rent', 350, '2026-06-06'), bill('water', 60, '2026-06-10')],
});
const plainAlloc = selectAllocation(plain)!;
const plainRows = selectRequiredRows(plain, plainAlloc);
const plainTotal = plainRows.reduce((sum, r) => sum + r.item.amount, 0);
eq(plainTotal, plainAlloc.totalRequired, 'no paid-early rows ⇒ the sheet and the allocation sum the same set');
eq(selectRequiredSplit(plainRows, {}).paid, plainTotal, 'nothing ticked off ⇒ everything reads paid (the sheet default)');
eq(selectRequiredSplit(plainRows, {}).carries, 0, 'and nothing carries');

// ── the USER-FACING PATH: a tested helper is not a used helper ───────────────────
// ⛔ Everything above proves `selectRequiredSplit` is right. None of it proves the SHEET calls it —
// which is the whole shape of this defect class: the clamp at `capturedTotal` existed, was correct,
// and the un-clamped sibling twelve lines below shipped anyway. So pin the call site by source.
// ⚠️ Both directions, because an absence assertion over a file that was never read is trivially true:
// the positive anchor is what proves the bytes are here at all.
const sheetSrc = readFileSync(
  new URL('../components/payday/PaydayCaptureSheet.tsx', import.meta.url),
  'utf8',
);
// ⛔ Comments are stripped first: this file's own docblocks NAME the retired expression, and a scan
// that reads them cannot tell a warning about the defect from the defect.
const sheetCode = sheetSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
assert(sheetCode.includes('export function PaydayCaptureSheet('), 'the sheet source was actually read');
assert(
  sheetCode.includes('selectRequiredSplit(requiredRows, requiredPaid)'),
  'the sheet derives both figures from the shared split — not from a local copy of it',
);
assert(
  !/requiredTotal\s*-\s*carryForward/.test(sheetCode),
  'the retired cross-population subtraction is gone from the sheet code, clamped or otherwise',
);

console.log(`
✅ D3-5 — ${passed} assertion(s) passed
`);
