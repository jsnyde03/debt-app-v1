/**
 * U15 re-audit, on a REAL orphan this session produced.
 *
 * Killing `prove:guards` mid-proof restored the planted TRACKED file (the signal handler worked) and left
 * `packages/core/utils/percentComplete.ts.plant-backup` + `.plant-owner` behind. From that state,
 * `preflightRestore` — which runs at `test-wrap-escapes.ts:38`, inside `npm run lint:rn`, and at
 * `prove-guards.ts:310` — will overwrite the tracked file with the sidecar's bytes the next time the target
 * and the sidecar differ, for ANY reason.
 *
 * This calls the production function. It does not create the sidecar; it only edits the target the way a
 * developer would, and reports what the pre-flight then did.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { preflightRestore } from '../../../../scripts/lib/plantSafety';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const REL = 'packages/core/utils/percentComplete.ts';
const ABS = join(REPO_ROOT, REL);
const SIDECAR = `${ABS}.plant-backup`;
const OWNER = `${SIDECAR}.plant-owner`;

console.log('sidecar present :', existsSync(SIDECAR));
if (existsSync(OWNER)) {
  const pid = Number(readFileSync(OWNER, 'utf8').trim());
  let alive = false;
  try {
    process.kill(pid, 0);
    alive = true;
  } catch {
    alive = false;
  }
  console.log(`owner pid       : ${pid}  alive=${alive}  (a dead owner makes the sidecar "abandoned")`);
}
const before = readFileSync(ABS, 'utf8');
console.log('target === sidecar before the edit :', before === readFileSync(SIDECAR, 'utf8'));
console.log('target length before :', before.length);
console.log('recovered by pre-flight:', JSON.stringify(preflightRestore(REPO_ROOT)));
console.log('target length after  :', readFileSync(ABS, 'utf8').length);
console.log('sidecar still on disk:', existsSync(SIDECAR), ' owner mark:', existsSync(OWNER));
