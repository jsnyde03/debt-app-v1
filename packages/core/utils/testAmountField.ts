import { parseAmountField, parseNonNegativeAmount, parseOptionalAmount } from './amountField';

/**
 * P6.8.7c.1 (audit B1) — the money-field parser.
 *
 * ⛔ **The inputs below are not edge cases, they are the defect.** Each `NaN`-producing string PASSED the
 * guard these functions replace, and was persisted; `JSON.stringify` then wrote it as `null`, which loads
 * as `0`, which files the debt under `PAID OFF`. So every one of them is pinned as a REFUSAL, and the
 * three refusal channels are pinned apart from each other — blank, unparseable and out-of-range answer
 * differently on purpose, and collapsing any two of them re-creates a shipped bug.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
/**
 * ⛔ **`String`, not `JSON.stringify`, and the reason is the defect itself.** The house idiom formats
 * failures with `JSON.stringify`, which renders `NaN` as **`null`** — so planting the old guard back
 * produced the failure message *"expected null, got null"*, describing a corrupt value with the exact
 * word the corrupt value serialises to. A money assertion has to be able to say `NaN` out loud.
 */
function show(v: unknown): string {
  return typeof v === 'number' ? String(v) : JSON.stringify(v);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${show(b)}, got ${show(a)})`);
}

function run() {
  console.log('Running money-field parser (B1) tests...');

  // ── the strings that shipped a corrupt store ──
  eq(parseAmountField('abc'), null, '"abc" is refused, not written as NaN');
  eq(parseAmountField('Infinity'), null, '"Infinity" is refused — it serialises to null exactly like NaN');
  eq(parseAmountField('-Infinity'), null, '"-Infinity" is refused');
  eq(parseAmountField('12.5.5'), null, 'a second decimal point is refused');
  eq(parseAmountField('1,2,3,4'), 1234, 'grouping commas are stripped wherever they fall');

  // ── separators mean what the person typing them meant ──
  eq(parseAmountField('1,200'), 1200, 'a grouped number is the amount, not a refusal');
  eq(parseAmountField('$1,200'), 1200, 'the currency symbol is stripped');
  eq(parseAmountField('1 200'), 1200, 'a space-grouped number parses');
  eq(parseAmountField(' 1200 '), 1200, 'surrounding whitespace is stripped');
  eq(parseAmountField('12.50'), 12.5, 'a period is the DECIMAL separator and survives stripping');

  // ── blank and zero and negative ──
  eq(parseAmountField(''), null, 'blank is refused');
  eq(parseAmountField('   '), null, 'whitespace-only is blank, not zero');
  eq(parseAmountField('0'), null, 'zero is refused where a positive amount is required');
  eq(parseAmountField('-5'), null, 'a negative amount is refused');
  eq(parseAmountField('0.01'), 0.01, 'a sub-dollar amount is a real amount');

  // ── optional: blank means zero, unparseable does NOT ──
  eq(parseOptionalAmount(''), 0, 'an empty optional field is zero');
  eq(parseOptionalAmount('   '), 0, 'whitespace-only optional field is zero');
  eq(parseOptionalAmount('0'), 0, 'an explicit zero is zero');
  eq(parseOptionalAmount('19.99'), 19.99, 'a typed optional amount parses');
  eq(parseOptionalAmount('5,5'), 55, 'a comma in an APR is stripped, not silently zeroed');
  eq(parseOptionalAmount('abc'), null, 'an unparseable optional field is REFUSED, not quietly zero');
  eq(parseOptionalAmount('Infinity'), null, '"Infinity" cannot become an APR');
  eq(parseOptionalAmount('-1'), null, 'a negative optional amount is refused');

  // ── non-negative: zero is an answer, blank is not ──
  eq(parseNonNegativeAmount('0'), 0, 'a balance confirmed at zero is a real confirmation');
  eq(parseNonNegativeAmount(''), null, 'a CLEARED field is not a confirmation of zero');
  eq(parseNonNegativeAmount('   '), null, 'whitespace-only is cleared, not zero');
  eq(parseNonNegativeAmount('1,450'), 1450, 'a grouped balance parses');
  eq(parseNonNegativeAmount('abc'), null, 'unparseable keeps the caller on its own estimate');
  eq(parseNonNegativeAmount('-1'), null, 'a negative balance is refused');

  // ── the three channels are distinguishable, which is the point ──
  assert(parseOptionalAmount('') === 0 && parseNonNegativeAmount('') === null, 'blank answers differently per channel');
  assert(parseAmountField('0') === null && parseNonNegativeAmount('0') === 0, 'zero answers differently per channel');

  // ── nothing this returns can round-trip to null through the store ──
  for (const raw of ['1,200', '$1,200', '0.01', '12.50', '1 200']) {
    const n = parseAmountField(raw);
    assert(n != null && JSON.parse(JSON.stringify({ n })).n === n, `${raw} survives JSON round-trip intact`);
  }

  console.log(`\n✅ money-field parser: ${passed} assertions passed\n`);
}

run();
