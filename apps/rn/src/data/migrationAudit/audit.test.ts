import { generateV16Cases, type Case } from '@/data/migrationAudit/corpus';
import { importDoor, webkitDoor } from '@/data/migrationAudit/doors';
import { INVARIANTS, checkAll, type DoorOutcome } from '@/data/migrationAudit/invariants';

/**
 * 5.10 — the adversarial migration audit.
 *
 * ⛔ **NARROWED (🎯 2026-08-19) to one question: can the migration lose or corrupt data?** Boundary money
 * values, leap-year/timezone arithmetic and huge portfolios are Phase 6's money lens; the broad gap sweep
 * is Phase 6's FINISH sweep — *gaps get caught at the freeze, when the thing being audited is the thing
 * that ships.*
 *
 * ⚡ **Invariants over a GENERATED corpus.** Authoring an expected output per case costs tokens linear in
 * the corpus and is wrong about as often as the code, since both come from the same understanding. Seven
 * properties × N cases keeps the cost fixed while the coverage stops depending on what anyone thought to
 * write down.
 *
 * Findings are grouped by ROOT CAUSE — invariant × damaged field — not merely by invariant. Run 1 reported
 * "128 × money-keeps-its-type", which is a number, not a finding: it could be one cause or forty, and
 * there is no way to tell from a count. Grouping by cause is what makes the report actionable without
 * reading every case.
 */

let checked = 0;
type Row = { invariant: string; cause: string; example: string };
const rows: Row[] = [];

function record(caseId: string, target: string, outcome: DoorOutcome) {
  checked++;
  for (const violation of checkAll(outcome)) {
    rows.push({ invariant: violation.invariant, cause: `${outcome.door} · ${target}`, example: `${caseId} → ${violation.detail}` });
  }
}

const cases: Case[] = generateV16Cases();
if (cases.length < 100) throw new Error(`FAIL [the generator produced only ${cases.length} cases — it is not generating]`);

export default async function run() {
  // ⛔ FIRST, and deliberately: prove this harness can fail before trusting it to say nothing is wrong.
  selfCheck();

  const drift: string[] = [];
  let bothProduced = 0;

  for (const testCase of cases) {
    const viaFile = importDoor(testCase.value);
    const viaKeys = await webkitDoor(testCase.value);
    record(`import/${testCase.id}`, testCase.target, viaFile);
    record(`webkit/${testCase.id}`, testCase.target, viaKeys);

    // ── 5.10.3 — the DIFFERENTIAL oracle, and it needs no expected values of its own. Two doors, one
    // dataset: whatever the right answer is, both must give it, so any disagreement is a defect in one
    // of them regardless of which.
    if (viaFile.store && viaKeys.store) {
      bothProduced++;
      if (JSON.stringify(viaFile.store) !== JSON.stringify(viaKeys.store)) drift.push(testCase.id);
    }
  }

  console.log(`\n  migration audit — ${cases.length} cases × 2 doors, ${checked} outcomes, ${INVARIANTS.length} invariants each`);
  console.log(`  differential — ${bothProduced} cases produced a store through BOTH doors, ${drift.length} disagreed`);

  // ⚠️ The healthy control must survive. A corpus that refuses EVERYTHING satisfies every invariant
  // vacuously — the shape where a suite is green because it tested nothing.
  const control = cases.find((c) => c.id === 'control:healthy')!;
  const controlFile = importDoor(control.value);
  const controlKeys = await webkitDoor(control.value);
  if (!controlFile.store) throw new Error('FAIL [the healthy control was REFUSED by the import door — the corpus is vacuous]');
  if (!controlKeys.store) throw new Error('FAIL [the healthy control did not migrate through the WebKit door]');
  if (controlFile.store.paycheck.amount !== '2100') throw new Error('FAIL [the healthy control lost its income]');
  console.log('  ✓ the healthy control survives both doors with its income intact');

  const byCause = new Map<string, { count: number; example: string }>();
  for (const row of rows) {
    const key = `${row.invariant}  ←  ${row.cause}`;
    const hit = byCause.get(key);
    if (hit) hit.count++;
    else byCause.set(key, { count: 1, example: row.example });
  }

  if (byCause.size > 0) {
    console.log(`\n  ⛔ ${rows.length} violation(s) in ${byCause.size} ROOT CAUSE(S):`);
    for (const [key, { count, example }] of [...byCause].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`    ${String(count).padStart(4)} × ${key}`);
      console.log(`           e.g. ${example}`);
    }
  }
  if (drift.length) console.log(`\n  ⛔ differential drift: ${drift.slice(0, 6).join(', ')}`);

  console.log(`\n  ${rows.length === 0 && drift.length === 0 ? '✅' : '⛔'} migration audit complete.\n`);

  /**
   * ⛔ **IT PRINTED `⛔` AND RETURNED CLEANLY, so a real corruption never failed anything.**
   * [P6.8.9.7.11.12 · B-J2-3] This is the adversarial corpus that exists to prove a restore cannot corrupt
   * the user's money, and its verdict reached a console and stopped there — while `hostile.test.ts`, which
   * runs **the same invariants over the same doors**, throws. Two harnesses, one judgement, opposite
   * consequences, and only the quieter one covered the generated corpus.
   *
   * ⚠️ **Measured clean before this was armed** — 522 cases × 2 doors, zero violations and zero drift — so
   * it is not being switched on over a known failure.
   */
  verdict(rows, drift, byCause.size);
}

/**
 * ⛔ **THE VERDICT, EXTRACTED SO IT CAN BE PINNED.** [P6.8.9.7.11.18 · S0.4 · M13]
 *
 * ⚠️ **Being armed was not the same as being guarded.** `.11.12` turned this suite from report-only into
 * a throwing one, and `.11.17` then measured that **deleting the throw returned it to report-only with
 * the entire repo green** — every suite, every gate, every CI run. The invariants are shared with
 * `hostile.test.ts`, which throws independently, so a plant in `invariants.ts` reds over *there* and says
 * nothing about this file; and `runAppTests.ts` would notice the *export* vanishing, not the *throw*.
 *
 * ⚡ **`tested-helper-is-not-a-used-helper`, one level up:** the judgement existed, was correct, and its
 * CONSEQUENCE was the unguarded part.
 */
export function verdict(rows: Row[], drift: string[], causes: number): void {
  if (rows.length > 0 || drift.length > 0) {
    throw new Error(
      `FAIL [migration audit: ${rows.length} invariant violation(s) in ${causes} root cause(s)` +
        `${drift.length ? `, ${drift.length} differential drift` : ''} — see the breakdown above]`,
    );
  }
}

/**
 * ⛔ **CAN THIS HARNESS FAIL AT ALL?** The mirror of the healthy control above, and the half that was
 * missing. That one proves the corpus is not vacuous — *something survives*. This proves the verdict is
 * not vacuous — *something is caught*. **A suite needs both, and only ever had the first.**
 *
 * Two independent links, because they break independently:
 *   ① the invariants still FIRE on a deliberately corrupt outcome, and
 *   ② the verdict still THROWS when they do.
 *
 * ⚠️ Deleting the throw at `verdict` now reds link ②. Deleting this block is no longer *"four lines"* —
 * it is removing a guard that says in its own name what it is for.
 */
export function selfCheck(): void {
  const poisoned: DoorOutcome = {
    door: 'self-check',
    input: {},
    inputBefore: '{}',
    inputAfter: '{}',
    store: null,
    refused: false,
    threw: new Error('deliberate: the self-check poisons invariant ①'),
  };
  const fired = checkAll(poisoned);
  if (fired.length === 0) {
    throw new Error('FAIL [self-check: the invariants did not fire on a deliberately corrupt outcome — this harness cannot detect anything]');
  }

  let threw = false;
  try {
    verdict([{ invariant: 'self-check', cause: 'self-check', example: 'deliberate' }], [], 1);
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error('FAIL [self-check: verdict() did not throw on a violation — the migration audit is REPORT-ONLY again]');
  }

  let threwOnDrift = false;
  try {
    verdict([], ['self-check-drift'], 0);
  } catch {
    threwOnDrift = true;
  }
  if (!threwOnDrift) {
    throw new Error('FAIL [self-check: verdict() ignored differential drift — the two-door oracle is unguarded]');
  }

  console.log(`  ✓ self-check: the invariants fire (${fired.length} on a poisoned outcome) and the verdict throws`);
}
