import { readFileSync } from 'node:fs';

import { createDefaultStore } from '@/data/defaults';
import type { DebtStore, RequiredExpense } from '@/data/models';
import { requiredRowId, selectRequiredRows, selectRequiredSplit } from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';
import { roundMoney } from '@core/utils/money';

/**
 * `S1.13.7.11` [pass-6 **D3-5** and **C1-4**] — the payday sheet's required rows and the sentences above
 * them. Two findings, one root: the sheet reads a figure that does not mean what the sentence says.
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
 *
 * ⛔ **C1-4 — and the row's own number was wrong in the other direction.** `item.amount` is what THIS
 * PAYCHECK puts in; the biller is owed `amount + reserveCovered`. A $350 rent the expense reserve fully
 * covers has `amount === 0`, so the sheet rendered **$0.00** for it, carried **$0** when the user marked
 * it *"Didn't pay"*, and — because the verdict was gated on `carryForward > 0` — announced **"All
 * confirmed paid"** about the bill they had just said they had not paid. `RequiredActionsCard` has
 * headlined the gross figure since `[T6.6 · L4-6]`; this sheet consumes the SAME `RequiredRow[]` from the
 * same `selectRequiredRows` call and was never visited. ⛔ **Gross for the sentences, NET for
 * `capturedTotal`** — `allocatePaycheck` nets the reserve draw out of `totalRequired` too, so a gross
 * carry against a net total under-reports the capture by the reserve share, the mirror of the same bug.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
/** ⛔ `lint:rounding` — the ONE owner. A private `Math.round(n * 100) / 100` here is the copy the cap exists to stop. */
const R = roundMoney;
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

console.log('\n▶ D3-5 + C1-4 — the payday required split: ONE population, and the BILL not its share');

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

// ══ C1-4 — a reserve-covered bill: the sentence states the BILL, the capture stays NET ══
//
// ⛔ The sheet keyed *"All confirmed paid"* on `carryForward > 0`. A $350 rent the expense reserve fully
// covers has `item.amount === 0`, so marking it *"Didn't pay"* carried $0, the carry line did not render,
// and the sheet announced *"All confirmed paid"* about the bill the user had just said they had not paid.
// ⚠️ And the two figures are NOT interchangeable: `allocatePaycheck` nets the reserve draw out of
// `totalRequired` too, so a gross carry subtracted from a net total under-reports the capture by the
// reserve share — the mirror of the same defect. Gross for the sentence, net for `capturedTotal`.
const covered = store({
  requiredExpenses: [bill('rent', 350, '2026-06-06')],
  expenseReserve: { balance: 350, contribution: { forCycle: '2026-06-15', amount: 0 } },
});
const coveredAlloc = selectAllocation(covered)!;
const coveredRows = selectRequiredRows(covered, coveredAlloc);
const rentRow = coveredRows.find((r) => rowId(r) === 'rent');
assert(rentRow != null, 'the reserve-covered rent row reaches the sheet');
eq(rentRow!.item.reserveCovered ?? 0, 350, "the reserve covers the whole bill — the engine's own row");
eq(rentRow!.item.amount, 0, 'so THIS PAYCHECK puts in nothing, which is what the sheet used to print');

const unpaidRent = selectRequiredSplit(coveredRows, { rent: false });
// ⛔ The defect, stated as the condition that used to gate the sentence:
eq(unpaidRent.carries, 0, 'the NET carry is $0 — this is why `carryForward > 0` said "All confirmed paid"');
assert(unpaidRent.anyUnpaid, 'but the user DID mark it unpaid, and that is what the verdict now reads');
eq(unpaidRent.carriesGross, 350, 'the sentence states the BILL: $350 carries, not $0');
eq(unpaidRent.paidGross, 0, 'and nothing was paid');

const paidRent = selectRequiredSplit(coveredRows, { rent: true });
assert(!paidRent.anyUnpaid, 'marking it paid leaves no unpaid row — "All confirmed paid" is then true');
eq(paidRent.paidGross, 350, 'the paid sentence also states the bill');
eq(paidRent.paid, 0, "⛔ and the NET stays 0 — `capturedTotal` must not gain the reserve share it never spent");

// the partial case the finding names: pot 300 against a 350 bill
const partial = store({
  requiredExpenses: [bill('rent', 350, '2026-06-06')],
  expenseReserve: { balance: 300, contribution: { forCycle: '2026-06-15', amount: 0 } },
});
const partialRows = selectRequiredRows(partial, selectAllocation(partial)!);
const partialSplit = selectRequiredSplit(partialRows, { rent: false });
eq(partialSplit.carriesGross, 350, 'partial cover still carries the whole $350 bill in the sentence');
assert(
  partialSplit.carries > 0 && partialSplit.carries < 350,
  `and the net carry is the paycheck's share alone (${partialSplit.carries}) — understated by the reserve`,
);

// ── C1-4's call site, same rule: the selector being right proves nothing about the sheet ────
assert(
  /formatCurrency\(row\.item\.amount \+ Math\.max\(0, row\.item\.reserveCovered \?\? 0\)\)/.test(sheetCode),
  'the row headlines the BILL (amount + reserveCovered), matching RequiredActionsCard',
);
assert(
  !/formatCurrency\(row\.item\.amount\)/.test(sheetCode),
  'and no row renders this paycheck\u2019s share alone — the $0.00-for-$350-rent render is gone',
);
assert(
  sheetCode.includes('row.item.reserveCovered ?? 0) > 0 ?') && sheetCode.includes('from your reserve'),
  'the row carries the "from your reserve" caption, so the gross headline is explained',
);
assert(
  !/carryForward > 0/.test(sheetCode),
  '\u26d4 no sentence is gated on a dollar sum any more — a verdict about the user\u2019s answers reads `anyUnpaid`',
);
assert(
  /\? anyUnpaid\b/.test(sheetCode) && /\{anyUnpaid \?/.test(sheetCode),
  'both the caption verdict and the carry line are gated on the user\u2019s own answers',
);
assert(
  sheetCode.includes('hasAdjustedRequired ? requiredPaidTotal : requiredTotal'),
  '\u26d4 capturedTotal keeps the NET figure — a gross carry against a net total is the mirror defect',
);

console.log(`
✅ D3-5 + C1-4 — ${passed} assertion(s) passed
`);
