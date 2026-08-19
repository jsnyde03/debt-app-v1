import { generateV16Cases, healthyV16Items, healthyV16File, type Case } from '@/data/migrationAudit/corpus';
import { checkAll, type DoorOutcome, type Violation } from '@/data/migrationAudit/invariants';
import { mapLegacyStore } from '@/data/legacyBridge/mapLegacyStore';
import { LEGACY_KEY_PREFIX } from '@/data/legacyBridge/webkitLocalStorage';
import { runMigrations } from '@/data/migrations';
import { readBackup } from '@/data/readBackup';
import { type DebtStore } from '@/data/models';

/**
 * 5.10 — the adversarial migration audit.
 *
 * ⛔ **NARROWED (🎯 2026-08-19) to one question: can the migration lose or corrupt data?** Boundary money
 * values, leap-year/timezone arithmetic and huge portfolios belong to Phase 6's money lens, and the broad
 * gap sweep to Phase 6's FINISH sweep — *gaps get caught at the freeze, when the thing being audited is
 * the thing that ships.*
 *
 * ⚡ **Invariants over a GENERATED corpus, not expected values over an enumerated one.** Authoring an
 * expected output per case costs tokens linear in the corpus and is wrong about as often as the code,
 * since both come from the same understanding. Seven properties × N cases means the cost is fixed and the
 * coverage is not limited by what anyone thought to write down.
 *
 * Failures are reported BY CLASS: thousands of cases collapse to *k* invariant violations, each naming
 * one example. Run via `npm run test:app`.
 */

let checked = 0;
const violations: Violation[] = [];
const examples = new Map<string, string>();

function record(caseId: string, found: Violation[]) {
  checked++;
  for (const violation of found) {
    violations.push(violation);
    const key = `${violation.invariant}`;
    if (!examples.has(key)) examples.set(key, `${caseId} → ${violation.detail}`);
  }
}

// ── Door A: the IMPORT door, over a v1.6 backup file. ────────────────────────────────────────────
function runImportDoor(testCase: Case): DoorOutcome {
  const text = JSON.stringify(testCase.value);
  const before = text;
  let store: DebtStore | null = null;
  let refused = false;
  let threw: Error | null = null;
  let second: DebtStore | null | undefined;
  try {
    const result = readBackup(text);
    if (result.ok) {
      store = result.store;
      // Idempotence: the store's own re-migration must be a no-op.
      second = runMigrations(JSON.parse(JSON.stringify(store)));
    } else {
      refused = true;
    }
  } catch (e) {
    threw = e as Error;
  }
  return { door: 'import(v1.6 file)', input: testCase.value, inputBefore: before, inputAfter: JSON.stringify(testCase.value), store, refused, threw, second };
}

// ── Door B: the WEBKIT door, over the SAME data as localStorage keys. ────────────────────────────
function runWebkitDoor(testCase: Case): DoorOutcome {
  const items: Record<string, string> = {};
  for (const [key, value] of Object.entries(testCase.value)) {
    if (key === 'version' || key === 'exportedAt') continue;
    items[`${LEGACY_KEY_PREFIX}${key}`] = JSON.stringify(value);
  }
  const before = JSON.stringify(items);
  let store: DebtStore | null = null;
  let threw: Error | null = null;
  let accounting: DoorOutcome['accounting'];
  let second: DebtStore | null | undefined;
  try {
    const { partial, report } = mapLegacyStore(items);
    accounting = {
      mapped: report.mapped,
      dropped: report.dropped.map((d) => d.key),
      unknown: report.unknown,
      unparseable: report.unparseable,
      total: Object.keys(items).length,
    };
    store = runMigrations(partial);
    second = runMigrations(JSON.parse(JSON.stringify(store)));
  } catch (e) {
    threw = e as Error;
  }
  return { door: 'webkit(v1.6 keys)', input: items, inputBefore: before, inputAfter: JSON.stringify(items), store, refused: false, threw, accounting, second };
}

// ══ Run the corpus through both doors ════════════════════════════════════════════════════════════
const cases = generateV16Cases();
if (cases.length < 100) throw new Error(`FAIL [the generator produced only ${cases.length} cases — it is not generating]`);

for (const testCase of cases) {
  record(`import/${testCase.id}`, checkAll(runImportDoor(testCase)));
  record(`webkit/${testCase.id}`, checkAll(runWebkitDoor(testCase)));
}

// ── 5.10.3 — the DIFFERENTIAL oracle. Two doors, one dataset, no expected values authored. ───────
// ⛔ This is the check that needs no oracle of its own: the WebKit door and the file door translate the
// SAME v1.6 data, so whatever the right answer is, they must both give it. Any disagreement is a defect
// in one of them regardless of which.
let differentialChecked = 0;
const differentialDrift: string[] = [];
for (const testCase of cases) {
  const viaFile = runImportDoor(testCase);
  const viaKeys = runWebkitDoor(testCase);
  if (!viaFile.store || !viaKeys.store) continue; // one refused — compared in the refusal class, not here
  differentialChecked++;
  const a = JSON.stringify(viaFile.store);
  const b = JSON.stringify(viaKeys.store);
  if (a !== b) differentialDrift.push(testCase.id);
}

// ── Report BY CLASS ──────────────────────────────────────────────────────────────────────────────
console.log(`\n  migration audit — ${cases.length} cases × 2 doors, ${checked} outcomes, 7 invariants each`);
console.log(`  differential: ${differentialChecked} cases produced a store through BOTH doors`);

const byInvariant = new Map<string, number>();
for (const violation of violations) byInvariant.set(violation.invariant, (byInvariant.get(violation.invariant) ?? 0) + 1);

if (byInvariant.size > 0) {
  console.log('\n  ⛔ INVARIANT VIOLATIONS, by class:');
  for (const [invariant, count] of [...byInvariant].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(count).padStart(5)} × ${invariant}`);
    console.log(`          e.g. ${examples.get(invariant)}`);
  }
}
if (differentialDrift.length > 0) {
  console.log(`\n  ⛔ DIFFERENTIAL DRIFT: ${differentialDrift.length} case(s) where the two doors disagree`);
  console.log(`          e.g. ${differentialDrift.slice(0, 5).join(', ')}`);
}

// ⚠️ The healthy control must produce a store through both doors. A corpus that refuses EVERYTHING would
// satisfy every invariant vacuously — the shape where a suite is green because it tested nothing.
{
  const control = cases.find((c) => c.id === 'control:healthy')!;
  const viaFile = runImportDoor(control);
  const viaKeys = runWebkitDoor(control);
  if (!viaFile.store) throw new Error('FAIL [the healthy control was REFUSED by the import door — the corpus is vacuous]');
  if (!viaKeys.store) throw new Error('FAIL [the healthy control produced no store through the WebKit door]');
  if (viaFile.store.paycheck.amount !== '2100') {
    throw new Error(`FAIL [the healthy control lost its income: ${JSON.stringify(viaFile.store.paycheck.amount)}]`);
  }
  console.log(`  ✓ the healthy control survives both doors with its income intact`);
}

console.log(
  `\n  ${byInvariant.size === 0 && differentialDrift.length === 0 ? '✅' : '⛔'} migration audit: ` +
    `${violations.length} invariant violation(s) in ${byInvariant.size} class(es), ${differentialDrift.length} differential drift(s).\n`,
);

// Also emit the raw counts for the plan, then leave the pass/fail to the caller below.
export const AUDIT_SUMMARY = {
  cases: cases.length,
  outcomes: checked,
  violations: violations.length,
  classes: [...byInvariant.keys()],
  differentialDrift: differentialDrift.length,
};
