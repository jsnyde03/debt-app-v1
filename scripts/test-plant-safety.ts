/**
 * ⛔ **`lib/plantSafety.ts`, PINNED — the net that catches a plant when the process does not survive.**
 * [S1.13.7.12.6 · class-1 re-audit 3 `T13`, re-audit 4 `U15`]
 *
 * ⚡ **This file exists because the thing it tests was recorded as done and was not written**, and then
 * fired twice in one session. The second time a plant reached `git add -A` and was committed:
 * `check-runner-completeness.ts` shipped as `const missing: string[] = [];`, a gate that reported every
 * test file wired, forever, over any hole. **Nothing in the repo would have noticed.**
 *
 * ⛔ **A recovery mechanism nobody exercises is a recovery mechanism nobody has.** The signal handlers
 * cannot be asserted in-process without killing this process, so what is pinned here is the layer that
 * carries the recovery: **the sidecar is on disk before the plant, and the pre-flight uses it.**
 *
 * ⚠️ Everything happens inside a scratch directory that is its own git repo, so a failure here can never
 * modify the real tree — the harness this tests is the one that already did that once.
 *
 * Usage: npm run test:plant-safety
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SIDECAR_SUFFIXES, armPlant, preflightRestore } from './lib/plantSafety';

let passed = 0;
const failures: string[] = [];
const check = (cond: boolean, label: string) => {
  if (cond) passed++;
  else failures.push(label);
};

const root = mkdtempSync(join(tmpdir(), 'plant-safety-'));
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

try {
  mkdirSync(join(root, 'src'), { recursive: true });
  const rel = 'src/target.ts';
  const abs = join(root, rel);
  const ORIGINAL = 'export const real = 1;\n';
  writeFileSync(abs, ORIGINAL, 'utf8');
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  git('add', '-A');
  git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'base');

  // ── Layer 1: the sidecar is written BEFORE the plant ────────────────────────────────────────────
  /**
   * ⛔ This is the layer that makes recovery POSSIBLE. `prove-guards.ts` held its originals in memory
   * only, so a killed run lost them outright and the plant was unrecoverable — which is how one shipped.
   */
  const disarm = armPlant([{ abs, original: ORIGINAL }]);
  const sidecar = `${abs}${SIDECAR_SUFFIXES[0]}`;
  check(existsSync(sidecar), 'the sidecar exists as soon as the plant is armed, BEFORE anything is written');
  check(readFileSync(sidecar, 'utf8') === ORIGINAL, '…and it holds the original bytes');

  writeFileSync(abs, `${ORIGINAL}export const planted = 2;\n`, 'utf8');
  check(readFileSync(abs, 'utf8') !== ORIGINAL, 'the plant is actually on disk — else the rest of this file is vacuous');

  // ── Layer 3: the pre-flight recovers a plant whose process never restored ───────────────────────
  /**
   * ⛔ **The arming is deliberately ABANDONED here, not disarmed** — that is the state a `SIGKILL` leaves:
   * a modified tracked file and a sidecar beside it, with no process left to run a `finally`.
   */
  const recovered = preflightRestore(root);
  check(recovered.includes(rel), `the pre-flight names the file it recovered (got ${JSON.stringify(recovered)})`);
  check(readFileSync(abs, 'utf8') === ORIGINAL, 'the target is byte-identical to the original after recovery');
  check(!existsSync(sidecar), 'the sidecar is removed once used, so the next run does not re-recover a clean file');
  check(git('status', '--porcelain').trim() === '', 'the tree is CLEAN — which is the whole claim');

  // ── Non-vacuity: the pre-flight must not "recover" what it cannot see ───────────────────────────
  /**
   * ⛔ Without this, a `preflightRestore` rewritten to `return []` passes every assertion above except
   * one — and a mechanism that reports success over an untouched tree is the failure mode this whole
   * cluster is about. A stray plant with NO sidecar must be left alone AND must not be claimed.
   */
  writeFileSync(abs, `${ORIGINAL}export const orphan = 3;\n`, 'utf8');
  const second = preflightRestore(root);
  check(second.length === 0, 'a modified file with NO sidecar is not claimed as recovered');
  check(readFileSync(abs, 'utf8') !== ORIGINAL, '…and is not silently reverted either — a plant is not the only reason a file is dirty');
  writeFileSync(abs, ORIGINAL, 'utf8');

  // ── The legacy suffix is still honoured ─────────────────────────────────────────────────────────
  // ⚠️ `test-wrap-escapes` wrote `.wrapescape-backup` before this lib existed; a tree carrying one from
  // an interrupted run predates the fix by definition, which is exactly when it needs recovering.
  writeFileSync(`${abs}.wrapescape-backup`, ORIGINAL, 'utf8');
  writeFileSync(abs, `${ORIGINAL}export const legacy = 4;\n`, 'utf8');
  check(preflightRestore(root).includes(rel), 'a legacy `.wrapescape-backup` is recovered too');
  check(readFileSync(abs, 'utf8') === ORIGINAL, '…and restores the same bytes');

  disarm();
} finally {
  rmSync(root, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n❌ plant safety: ${failures.length} failure(s).\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error(
    '\n  ⛔ U15 — a plant left in the tree by an interrupted run has already been COMMITTED once,\n' +
      '  and it made lint:runner-completeness vacuous. This is the net that catches it.\n',
  );
  process.exit(1);
}

console.log(`✅ plant safety: ${passed} assertions — sidecar before plant, pre-flight recovers, tree left clean.`);
