import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { importDoor, webkitDoor } from '@/data/migrationAudit/doors';
import { INVARIANTS, checkAll } from '@/data/migrationAudit/invariants';

/**
 * 5.10.5 — hostile v1.6 states the combinatorial generator structurally cannot produce.
 *
 * ⛔ **The agent generated INPUTS, never findings**, and that was the whole design. This project measured
 * 3 of 4 agent-declared blockers failing refutation, and every audit site-list undercounting — but an
 * input the harness judges cannot be wrong in the expensive way. The worst case is a case that proves
 * nothing, not a case that sends someone chasing a defect that isn't there.
 *
 * ⚡ What it was asked for is precisely what `corpus.ts` cannot reach: it damages ONE field of ONE healthy
 * base, so it can never produce **multi-field interactions** (a debt both paid off and flagged
 * autopay-failed), **structurally different plausible user states** (mid-onboarding, weekly pay, a
 * fourteen-month history, BNPL-heavy), or **v1.6-specific historical shapes** only reachable through that
 * app's real flows (a pre-v1.5 debt with no `originalBalance`, `isPaidThisCycle` without the later split
 * flags). ⚠️ Grounded in `origin/v1.6-dev`'s own source rather than invented — the agent was pointed at
 * `buildBackupData()` and the flows that write each key.
 *
 * The same eight invariants judge these as judge the generated corpus. Nothing here asserts an expected
 * output; if these shapes are safe, they are safe by the same properties everything else is.
 */

/**
 * ⛔ **THE CASES ALLOWED NOT TO OPEN, BY NAME — there are none today.** [S1.10.6.5.8.4 · GAP-7]
 *
 * ⚡ **A COUNT FLOOR COULD BE LOWERED WITH ONE KEYSTROKE AND LEFT NO RECORD OF WHICH CASE IT ABSORBED.**
 * That was `HOSTILE_FLOOR = 32`'s actual failure mode: its own docstring said *"never raise it to make a
 * run pass"* while the danger ran the other way — **lowering** it to swallow a fixture that stopped
 * reaching the migration logic. `32` → `31` is a digit; naming a case is a sentence someone has to write.
 *
 * ⛔ **GAP-7 PROPOSED `HOSTILE_FLOOR === CASES.length` AND THAT WOULD HAVE BEEN THE DEFECT.** The
 * non-vacuity control below says it outright: *"deliberately NOT 'all 32 must open' — a hostile blob that
 * a door safely REFUSES is a correct outcome and one of the things this corpus exists to produce."*
 * Hard-wiring equality would force a legitimately-refused case to be DELETED to get green, throwing away
 * the coverage it was written for. The floor is therefore **derived** from the corpus minus what is named
 * here, so slack cannot accumulate and a refusal cannot be absorbed silently.
 *
 * ⚠ **SELF-RATCHETING, like `MAX_EXEMPT`:** an id here that does not exist in the corpus reds, and an id
 * here that actually DOES open reds. A stale exemption is a hole with a comment in front of it.
 */
const EXPECTED_REFUSED: Record<string, string> = {};

/**
 * ⛔ **KEYED ON "DID NOT OPEN IN BOTH DOORS", NOT ON "REFUSED BY BOTH" — and a PLANT is why.**
 * [S1.10.6.5.8.4]
 *
 * ⚡ The first version of this ledger keyed on `refusedBoth`, and neutering a fixture proved that
 * incoherent: the plant was refused by the FILE door and opened by the WEBKIT one, so it tripped the floor
 * while never entering `refusedBoth` — **the exemption could never have excused the case it existed for,
 * and naming it would have red the stale-entry check instead.** A ledger whose entries cannot silence the
 * assertion they are written against is a ledger nobody can use.
 *
 * ⚠️ The webkit door opens a blob carrying **no legacy keys at all**, so "refused by both" is close to
 * unreachable from fixture content — which would have left the whole ledger vacuous. Measured, not assumed.
 */
const notReaching = (o: { file: boolean; webkit: boolean }) => !o.file || !o.webkit;

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
}

interface HostileCase {
  id: string;
  why: string;
  reachable: string;
  blob: Record<string, unknown>;
}

const CASES: HostileCase[] = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'hostile-v16-cases.json'), 'utf8'),
);

export default async function run() {
  // ⚠️ A floor on the corpus itself. A fixture that silently emptied would satisfy every invariant
  // vacuously — green because it tested nothing, which is the failure this repo has hit twice.
  assert(CASES.length >= 20, `the hostile corpus is populated (${CASES.length} cases)`);

  const violations: string[] = [];
  let drift = 0;
  /** ⛔ The non-vacuity control — see the assertion after the loop. */
  let openedFile = 0;
  let openedKeys = 0;
  const refusedBoth: string[] = [];
  /** Per case, per door — the ledger above is keyed on this, not on the both-refused subset. */
  const reached = new Map<string, { file: boolean; webkit: boolean }>();

  for (const testCase of CASES) {
    assert(!!testCase.blob && typeof testCase.blob === 'object', `${testCase.id}: has a blob`);
    const viaFile = importDoor(testCase.blob);
    const viaKeys = await webkitDoor(testCase.blob);
    if (viaFile.store) openedFile++;
    if (viaKeys.store) openedKeys++;
    reached.set(testCase.id, { file: !!viaFile.store, webkit: !!viaKeys.store });
    if (!viaFile.store && !viaKeys.store) refusedBoth.push(testCase.id);

    for (const violation of [...checkAll(viaFile), ...checkAll(viaKeys)]) {
      violations.push(`${testCase.id} → ${violation.invariant}: ${violation.detail}`);
    }
    // The differential oracle applies here too — two doors, one dataset, no expected values authored.
    if (viaFile.store && viaKeys.store && JSON.stringify(viaFile.store) !== JSON.stringify(viaKeys.store)) {
      drift++;
      violations.push(`${testCase.id} → doors disagree`);
    }
  }

  console.log(`  5.10.5 — ${CASES.length} agent-generated hostile v1.6 states × 2 doors × ${INVARIANTS.length} invariants`);
  if (violations.length) {
    console.log(`  ⛔ ${violations.length} violation(s):`);
    for (const line of violations.slice(0, 12)) console.log(`     ${line}`);
  }
  /**
   * ⛔ **THE NON-VACUITY CONTROL — a refused corpus is this suite's PASS CONDITION without it.**
   * [P6.8.9.7.11.18 · S0.5 · M14]
   *
   * ⚠️ The `CASES.length >= 20` floor above guards the corpus going *empty*. It does not guard the corpus
   * going *unreadable* — and those are different failures with the same green. If these blobs stop being
   * recognised as v1.6 (a detection change, a renamed key, a version bump), **both doors refuse, no
   * invariant has anything to judge, `violations` is `[]`, and every assertion below passes** while not
   * one line of migration code ran.
   *
   * ⚡ **This is `.11.13.6`'s defect exactly** — four fixtures there asserted *"does not throw"* over a
   * door that never opened, because `raw-v17` detection needs `storeVersion` + `paycheck` + `debts`
   * **together**. The fixtures were fixed; the harness that could not have noticed was not.
   *
   * ⛔ **Deliberately NOT "all 32 must open."** A hostile blob that a door safely REFUSES is a correct
   * outcome and one of the things this corpus exists to produce. The floor asserts the corpus still
   * *reaches* the logic, not that every case survives it.
   */
  console.log(`  doors opened: ${openedFile}/${CASES.length} file · ${openedKeys}/${CASES.length} webkit · ${refusedBoth.length} refused by both`);
  if (refusedBoth.length) console.log(`     refused by both: ${refusedBoth.slice(0, 8).join(', ')}`);
  // ⛔ The exemption ledger is checked BEFORE it is spent — a stale entry must red, not quietly widen the
  // net. Both directions: an id that is not in the corpus, and an id that reaches both doors after all.
  const corpusIds = new Set(CASES.map((c) => c.id));
  const notReachingIds = CASES.map((c) => c.id).filter((id) => notReaching(reached.get(id)!));
  const notReachingSet = new Set(notReachingIds);
  for (const id of Object.keys(EXPECTED_REFUSED)) {
    assert(corpusIds.has(id), `EXPECTED_REFUSED names \`${id}\`, which is not in the corpus — delete the entry`);
    assert(
      notReachingSet.has(id),
      `EXPECTED_REFUSED excuses \`${id}\` but BOTH doors now open it — the exemption is stale, delete it`,
    );
  }

  // ⚠️ NAMED, NOT COUNTED. This is GAP-7's whole point: `32` → `31` is a keystroke that records nothing,
  // while excusing a case costs an id and a written reason in EXPECTED_REFUSED.
  const unexcused = notReachingIds.filter((id) => !(id in EXPECTED_REFUSED));
  assert(
    unexcused.length === 0,
    `every hostile case still REACHES the migration logic through BOTH doors — ${unexcused.length} unexcused: ${unexcused.join(', ')} (a case refused at the door satisfies every invariant vacuously). If a refusal is correct, name it in EXPECTED_REFUSED with the reason`,
  );

  // The aggregate stays as a second net, derived rather than typed, so slack cannot accumulate silently.
  const floor = CASES.length - Object.keys(EXPECTED_REFUSED).length;
  assert(
    openedFile >= floor && openedKeys >= floor,
    `both doors still reach the corpus — file ${openedFile}, webkit ${openedKeys}, derived floor ${floor} of ${CASES.length} cases`,
  );

  assert(violations.length === 0, `no invariant violations across the hostile corpus (${violations.length})`);
  assert(drift === 0, `the two doors agree on every hostile state (${drift} disagreed)`);

  console.log(`✅ 5.10.5 hostile-state tests passed (${passed} asserts).`);
}
