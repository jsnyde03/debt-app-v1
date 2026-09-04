/**
 * ⛔ **`lib/plantSafety.ts`, PINNED — the net that catches a plant when the process does not survive,
 * and the brake that stops it eating work it did not write.**
 * [S1.13.7.12.6 · class-1 re-audit 3 `T13`, re-audit 4 `U15`, re-audit 5 `V4`]
 *
 * ⚡ **This file exists because the thing it tests was recorded as done and was not written**, and then
 * fired twice in one session. The second time a plant reached `git add -A` and was committed:
 * `check-runner-completeness.ts` shipped as `const missing: string[] = [];`, a gate that reported every
 * test file wired, forever, over any hole. **Nothing in the repo would have noticed.**
 *
 * ⛔ **AND THEN THE FIX ITSELF DESTROYED UNCOMMITTED WORK** — `V4`, a blocker: 83 bytes of a tracked file
 * overwritten, reported as *recovered*, with the sidecar that would have shown what happened deleted in
 * the same pass. So this file asserts BOTH directions, and the second one is the one with no undo:
 *
 * | direction | failure |
 * |---|---|
 * | recovery does not happen | a planted defect stays in the tree and every later gate reads it |
 * | recovery happens WRONGLY | somebody's work is gone, and gone from everywhere |
 *
 * ⛔ **A recovery mechanism nobody exercises is a recovery mechanism nobody has.** The signal handlers
 * cannot be asserted in-process without killing this process, so what is pinned here is the layer that
 * carries the recovery: the sidecar and the plant fingerprint are on disk before the plant is, and the
 * pre-flight acts only on what it can prove it wrote.
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

import { SIDECAR_SUFFIXES, armPlant, notePlant, preflightRestore } from './lib/plantSafety';

let passed = 0;
const failures: string[] = [];
const check = (cond: boolean, label: string) => {
  if (cond) passed++;
  else failures.push(label);
};

const NL = String.fromCharCode(10);
const root = mkdtempSync(join(tmpdir(), 'plant-safety-'));
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

const rel = 'src/target.ts';
const abs = join(root, rel);
const sidecar = `${abs}${SIDECAR_SUFFIXES[0]}`;
const ORIGINAL = 'export const real = 1;\n';
const PLANTED = `${ORIGINAL}export const planted = 2;\n`;

/** The state a `SIGKILL` leaves: the marks on disk with no process behind them. */
function abandon(): void {
  delete process.env.PLANT_SAFETY_LIVE;
  writeFileSync(`${sidecar}.plant-owner`, '2147483646', 'utf8');
}

/** Put the scratch tree back to its committed state, marks and all. */
function reset(): void {
  for (const s of ['', '.plant-owner', '.plant-hash']) rmSync(`${sidecar}${s}`, { force: true });
  rmSync(`${abs}.wrapescape-backup`, { force: true });
  writeFileSync(abs, ORIGINAL, 'utf8');
}

/**
 * ⛔ **NO SIDECAR MAY BE TRACKED — measured after fifteen of them were COMMITTED.**
 * [round 6, self-inflicted while fixing `V4`]
 *
 * ⚡ `V4` added the plant fingerprint; `restoreArmed` removed the backup and the owner mark and **not the
 * hash**. They are tiny and nobody looks, so they accumulated until a `git add -A` swept **fifteen** into
 * `ab8cdf91`. ⛔ **That is the same path that committed a live plant earlier in this cluster**: a harness
 * artifact nobody was watching, plus a broad add.
 *
 * ⚠️ **Gitignoring them would be the wrong fix** and it is worth writing down: the pre-flight finds
 * abandoned sidecars through `git status --untracked-files=all`, which does **not** list ignored files.
 * Hiding them would blind the recovery mechanism. So they stay visible, and being TRACKED is what reds.
 *
 * ⛔ This runs against the REAL repo, before the scratch fixture, because it is a fact about this tree.
 */
{
  const tracked = execFileSync('git', ['ls-files'], { cwd: join(import.meta.dirname, '..'), encoding: 'utf8' })
    .split(NL)
    .map((l) => l.trim())
    .filter((l) => /\.(plant-backup|plant-owner|plant-hash|wrapescape-backup)$/.test(l));
  check(
    tracked.length === 0,
    `no plant sidecar is tracked in git (found ${tracked.length}: ${tracked.slice(0, 3).join(', ')})`,
  );
}

try {
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(abs, ORIGINAL, 'utf8');
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  git('add', '-A');
  git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'base');

  // ── Layer 1: the marks are on disk BEFORE the plant ─────────────────────────────────────────────
  /**
   * ⛔ This is what makes recovery POSSIBLE at all. `prove-guards.ts` held its originals in memory only,
   * so a killed run lost them outright — which is how a plant came to be committed.
   */
  {
    armPlant([{ abs, original: ORIGINAL }]);
    check(existsSync(sidecar), 'the sidecar exists as soon as the plant is armed, BEFORE anything is written');
    check(readFileSync(sidecar, 'utf8') === ORIGINAL, '…and it holds the original bytes');

    writeFileSync(abs, PLANTED, 'utf8');
    notePlant(abs, PLANTED);
    check(existsSync(`${sidecar}.plant-hash`), 'the plant FINGERPRINT is recorded — without it recovery is a guess (V4)');
    check(readFileSync(abs, 'utf8') !== ORIGINAL, 'the plant is actually on disk — else the rest of this file is vacuous');

    // ── Layer 3: an ABANDONED plant is recovered ────────────────────────────────────────────────
    abandon();
    const r = preflightRestore(root);
    check(r.recovered.includes(rel), `the pre-flight names the file it recovered (got ${JSON.stringify(r.recovered)})`);
    check(r.refused.length === 0, '…and refuses nothing, because it can prove it wrote these bytes');
    check(readFileSync(abs, 'utf8') === ORIGINAL, 'the target is byte-identical to the original after recovery');
    check(!existsSync(sidecar), 'the sidecar is removed once used, so the next run does not re-recover a clean file');
    check(git('status', '--porcelain').trim() === '', 'the tree is CLEAN — which is the whole claim');
  }
  reset();

  // ── `V4`: A DIRTY TARGET THE MECHANISM DID NOT WRITE IS NEVER TOUCHED ───────────────────────────
  /**
   * ⛔ **THE BLOCKER, staged exactly as it happened.** `prove:guards` was killed mid-proof; its signal
   * handler worked, so the tracked file came back CLEAN and only the sidecar was orphaned. Then one
   * ordinary edit — and the production pre-flight overwrote the file, reported it *recovered*, and
   * deleted the sidecar. **83 bytes of uncommitted work, gone from everywhere.**
   *
   * ⚠️ The old rule was *"a sidecar exists and the target differs from it"*, which is as true of an
   * editor save as of a plant. These two rows are the difference.
   */
  {
    writeFileSync(sidecar, ORIGINAL, 'utf8');
    abandon();
    const EDIT = `${ORIGINAL}export const myWork = 42;\n`;
    writeFileSync(abs, EDIT, 'utf8');

    const r = preflightRestore(root);
    check(r.recovered.length === 0, 'V4: an edit the mechanism cannot prove it wrote is NOT recovered');
    check(readFileSync(abs, 'utf8') === EDIT, 'V4: …the uncommitted work SURVIVES — this is the assertion with no undo');
    check(r.refused.length === 1, 'V4: …and the refusal is REPORTED, not swallowed');
    check(existsSync(sidecar), 'V4: …with the sidecar left on disk, since it is the only record of what happened');
  }
  reset();

  /**
   * ⛔ **The commonest orphan of all: a sidecar beside an ALREADY-CLEAN file.** The signal handlers
   * usually win, so this is what a kill normally leaves. There is no plant to undo, so the marks are
   * dropped and nothing is written — and crucially it is not reported as a recovery either.
   */
  {
    writeFileSync(sidecar, ORIGINAL, 'utf8');
    abandon();
    const r = preflightRestore(root);
    check(r.recovered.length === 0 && r.refused.length === 0, 'a sidecar beside a CLEAN target is neither recovered nor refused');
    check(readFileSync(abs, 'utf8') === ORIGINAL, '…the target is untouched');
    check(!existsSync(sidecar), '…and the stale marks are dropped, so the tree is left clean');
  }
  reset();

  // ── Non-vacuity: nothing is claimed that was not seen ───────────────────────────────────────────
  /**
   * ⛔ Without this, a `preflightRestore` rewritten to return nothing passes most of the file — and a
   * mechanism that reports success over an untouched tree is the failure mode this whole cluster is about.
   */
  {
    writeFileSync(abs, `${ORIGINAL}export const orphan = 3;\n`, 'utf8');
    const r = preflightRestore(root);
    check(r.recovered.length === 0, 'a modified file with NO sidecar is not claimed as recovered');
    check(readFileSync(abs, 'utf8') !== ORIGINAL, '…and is not silently reverted either');
  }
  reset();

  // ── A LIVE plant is left strictly alone ────────────────────────────────────────────────────────
  /**
   * ⛔ **THE FAIL-OPEN `U15`'s FIX ITSELF SHIPPED, AND IT MADE TWO PROOFS VACUOUS.**
   *
   * ⚡ `prove:guards` arms a plant and then runs a gate to see it red. That gate's own pre-flight found
   * the parent's LIVE sidecar, reverted the plant, and measured a clean tree — so `S1P7-U10` and
   * `S1P7-U11` both scored `planted=exit 0` while the un-fix was, as far as the parent knew, on disk.
   *
   * ⚠️ Both marks are exercised separately: the env var covers a CHILD process, the owner PID a concurrent
   * SIBLING.
   */
  {
    writeFileSync(sidecar, ORIGINAL, 'utf8');
    writeFileSync(`${sidecar}.plant-owner`, String(process.pid), 'utf8');
    writeFileSync(abs, PLANTED, 'utf8');
    notePlant(abs, PLANTED);
    check(preflightRestore(root).recovered.length === 0, 'a sidecar whose OWNER PID is alive is not recovered');
    check(readFileSync(abs, 'utf8') === PLANTED, '…and the live plant is still on disk, untouched');

    // ⚠️ The SAME sidecar with a dead owner IS abandoned — the liveness check cannot be a blanket refusal.
    abandon();
    check(preflightRestore(root).recovered.includes(rel), '…while the same sidecar with a DEAD owner is recovered');
    check(readFileSync(abs, 'utf8') === ORIGINAL, '…and restored');

    writeFileSync(sidecar, ORIGINAL, 'utf8');
    writeFileSync(abs, PLANTED, 'utf8');
    notePlant(abs, PLANTED);
    process.env.PLANT_SAFETY_LIVE = sidecar;
    check(preflightRestore(root).recovered.length === 0, 'a sidecar named in PLANT_SAFETY_LIVE is not recovered — the child-process case');
    delete process.env.PLANT_SAFETY_LIVE;
  }
  reset();

  // ── The legacy suffix is DETECTED, and refused rather than trusted ──────────────────────────────
  /**
   * ⚠️ `test-wrap-escapes` wrote `.wrapescape-backup` before this lib existed, so such a sidecar carries
   * no fingerprint by definition. ⛔ Under `V4`'s rule that makes it unprovable, and the honest handling
   * of unprovable is a loud refusal — not a restore of bytes nobody can attribute.
   */
  {
    writeFileSync(`${abs}.wrapescape-backup`, ORIGINAL, 'utf8');
    const EDIT = `${ORIGINAL}export const legacy = 4;\n`;
    writeFileSync(abs, EDIT, 'utf8');
    const r = preflightRestore(root);
    check(r.refused.length === 1, 'a legacy sidecar beside a DIRTY target is REFUSED, because nothing can attribute the bytes');
    check(readFileSync(abs, 'utf8') === EDIT, '…and the file is left exactly as it was found');
  }
  reset();
} finally {
  rmSync(root, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n❌ plant safety: ${failures.length} failure(s).\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error(
    '\n  ⛔ U15 — a plant left in the tree by an interrupted run has already been COMMITTED once, and it\n' +
      '  made lint:runner-completeness vacuous.\n' +
      '  ⛔ V4 — and the fix for that then overwrote 83 bytes of uncommitted work in a tracked file.\n' +
      '  Both directions are load-bearing. Neither number is allowed to grow.\n',
  );
  process.exit(1);
}

console.log(
  `✅ plant safety: ${passed} assertions — marks before the plant, only provable bytes recovered, ` +
    'a live plant untouched, an unattributable edit refused.',
);
