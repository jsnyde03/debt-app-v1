import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { importDoor, webkitDoor } from '@/data/migrationAudit/doors';
import { checkAll } from '@/data/migrationAudit/invariants';

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

  for (const testCase of CASES) {
    assert(!!testCase.blob && typeof testCase.blob === 'object', `${testCase.id}: has a blob`);
    const viaFile = importDoor(testCase.blob);
    const viaKeys = await webkitDoor(testCase.blob);

    for (const violation of [...checkAll(viaFile), ...checkAll(viaKeys)]) {
      violations.push(`${testCase.id} → ${violation.invariant}: ${violation.detail}`);
    }
    // The differential oracle applies here too — two doors, one dataset, no expected values authored.
    if (viaFile.store && viaKeys.store && JSON.stringify(viaFile.store) !== JSON.stringify(viaKeys.store)) {
      drift++;
      violations.push(`${testCase.id} → doors disagree`);
    }
  }

  console.log(`  5.10.5 — ${CASES.length} agent-generated hostile v1.6 states × 2 doors × 8 invariants`);
  if (violations.length) {
    console.log(`  ⛔ ${violations.length} violation(s):`);
    for (const line of violations.slice(0, 12)) console.log(`     ${line}`);
  }
  assert(violations.length === 0, `no invariant violations across the hostile corpus (${violations.length})`);
  assert(drift === 0, `the two doors agree on every hostile state (${drift} disagreed)`);

  console.log(`✅ 5.10.5 hostile-state tests passed (${passed} asserts).`);
}
