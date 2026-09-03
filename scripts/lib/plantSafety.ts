/**
 * ⛔ **A PLANT MUST SURVIVE THE PROCESS NOT SURVIVING.**
 * [S1.13.7.12.6 · class-1 re-audit 3 `T13`, re-audit 4 `U15`]
 *
 * Both plant harnesses restore in a `finally`. **A `finally` does not run on a signal**, and neither
 * harness had a pre-flight that would recover from one. `T13` filed exactly this; round 4's commit
 * recorded it closed and the remedy was never written.
 *
 * ⚡ **It then fired twice in one session, and the second time it shipped.**
 *
 * 1. A `test:wrap-escapes` run was killed at a tool timeout. `git status` immediately afterwards:
 *    ` M apps/rn/src/utils/a11y.ts` and an untracked `a11y.ts.wrapescape-backup` — a planted defect
 *    sitting in tracked production source, which every later gate run then read as the tree.
 * 2. `prove:guards` keeps its originals **in memory only**, so a killed run loses them outright. One
 *    such plant reached `git add -A` and was **committed**: `check-runner-completeness.ts` shipped as
 *    `const missing: string[] = [];`, which made that gate report every test file wired, forever.
 *
 * ⛔ **So the recovery information has to be ON DISK before the plant is, and something has to look for
 * it.** Three layers, because each covers what the others cannot:
 *
 * | layer | covers |
 * |---|---|
 * | sidecar written BEFORE the plant | the process dying between plant and restore |
 * | `SIGINT`/`SIGTERM`/`SIGHUP`/`uncaughtException`/`exit` handlers | an interruption the runtime still sees |
 * | pre-flight over the whole repo | a run whose process was killed outright — `SIGKILL`, a crash, a reboot |
 *
 * ⚠️ **The pre-flight RESTORES rather than refusing.** A harness that merely refuses to start leaves the
 * planted file in the tree for `git add -A` to find, which is the path that actually shipped one.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** ⚠️ Both suffixes are recognised: `.wrapescape-backup` is what `test-wrap-escapes` wrote before this. */
export const SIDECAR_SUFFIXES = ['.plant-backup', '.wrapescape-backup'] as const;

/**
 * ⛔ **A SIDECAR WHOSE OWNER IS STILL ALIVE IS NOT ABANDONED, AND RECOVERING IT IS A FAIL-OPEN.**
 * [S1.13.7.12.6 round 5 — self-inflicted while fixing `U15`, found by `prove:guards`]
 *
 * ⚡ **Measured.** `prove:guards` arms a plant in `check-finding-guards.ts`, then runs
 * `test:wrap-escapes` to see it red. That harness's own pre-flight found the parent's **live** sidecar,
 * announced *"pre-flight restored 1 file(s) left planted by an interrupted run"*, **reverted the plant**,
 * and then measured a clean tree — so `S1P7-U10` and `S1P7-U11` both scored `planted=exit 0` while the
 * un-fix was still, as far as the parent knew, on disk.
 *
 * ⛔ **A recovery mechanism that silently undoes a live plant makes every proof run through it vacuous** —
 * the same class as the defect `U15` was written to close, arriving inside its fix. Two independent marks,
 * because they cover different things:
 *
 * - **`PLANT_SAFETY_LIVE`** is inherited by child processes, which is the parent→child case above.
 * - **the owner PID** covers a concurrent SIBLING — two `prove:guards` processes at once, which has
 *   already left a plant in this repo once.
 */
const LIVE_ENV = 'PLANT_SAFETY_LIVE';
const OWNER_SUFFIX = '.plant-owner';

function liveFromEnv(): Set<string> {
  return new Set((process.env[LIVE_ENV] ?? '').split('\n').filter(Boolean));
}

function ownerIsAlive(backupAbs: string): boolean {
  const ownerFile = `${backupAbs}${OWNER_SUFFIX}`;
  if (!existsSync(ownerFile)) return false;
  const pid = Number(readFileSync(ownerFile, 'utf8').trim());
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    // ⚠️ Signal 0 checks existence without delivering anything. Works on Windows.
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore anything a previous run left planted, before this run reads the tree.
 *
 * ⛔ Uses `git status` rather than a directory walk: a sidecar is untracked and can be written beside ANY
 * target, so enumerating the plant sites would be the same short-list mistake this cluster keeps paying
 * for. Returns the repo-relative paths it recovered, so the caller can say so out loud.
 */
export function preflightRestore(repoRoot: string): string[] {
  let out = '';
  try {
    out = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
  } catch {
    return []; // not a git tree, or git is unavailable — the sidecar layers still apply
  }
  const recovered: string[] = [];
  const live = liveFromEnv();
  for (const line of out.split('\n')) {
    const path = line.slice(3).trim().replace(/^"|"$/g, '');
    if (path.endsWith(OWNER_SUFFIX)) continue;
    const suffix = SIDECAR_SUFFIXES.find((s) => path.endsWith(s));
    if (!suffix) continue;
    const target = path.slice(0, -suffix.length);
    const absBackup = join(repoRoot, path);
    const absTarget = join(repoRoot, target);
    if (!existsSync(absBackup)) continue;
    // ⛔ See the note on LIVE_ENV: an ABANDONED plant is recovered, a LIVE one is left strictly alone.
    if (live.has(absBackup) || ownerIsAlive(absBackup)) continue;
    if (existsSync(absTarget)) {
      const original = readFileSync(absBackup, 'utf8');
      if (readFileSync(absTarget, 'utf8') !== original) {
        writeFileSync(absTarget, original, 'utf8');
        recovered.push(target);
      }
    }
    rmSync(absBackup, { force: true });
    // ⚠️ The owner mark goes with it, or the next `git status` still shows a stray file and the "tree is
    // clean" claim this whole mechanism makes is false by one path.
    rmSync(`${absBackup}${OWNER_SUFFIX}`, { force: true });
  }
  return recovered;
}

let armed: { abs: string; backup: string; original: string }[] = [];
let handlersInstalled = false;

function restoreArmed(): void {
  for (const a of armed) {
    try {
      if (readFileSync(a.abs, 'utf8') !== a.original) writeFileSync(a.abs, a.original, 'utf8');
      rmSync(a.backup, { force: true });
      rmSync(`${a.backup}${OWNER_SUFFIX}`, { force: true });
    } catch {
      /* best effort — the sidecar is still on disk for the next run's pre-flight */
    }
  }
  armed = [];
}

/**
 * Write a sidecar for each file about to be planted and arm the interruption handlers.
 *
 * Returns `disarm()`, which restores, removes the sidecars and clears the arming. Call it in the
 * `finally` the harness already has — this does not replace that, it covers the paths it cannot reach.
 *
 * ⚠️ **`exit` is included deliberately.** `fault()` in `prove-guards.ts` calls `process.exit`, and this
 * cluster has already recorded a fix that *"exits before the restore, so nothing runs after it and the
 * tree it leaves behind is unverified"*.
 */
export function armPlant(files: { abs: string; original: string }[]): () => void {
  for (const f of files) {
    const backup = `${f.abs}${SIDECAR_SUFFIXES[0]}`;
    writeFileSync(backup, f.original, 'utf8');
    // ⛔ Both marks written BEFORE the plant, for the reason in LIVE_ENV's note: a child harness that
    // recovers a live plant measures a tree its parent did not create, and reports MATCHED over it.
    writeFileSync(`${backup}${OWNER_SUFFIX}`, String(process.pid), 'utf8');
    armed.push({ abs: f.abs, backup, original: f.original });
  }
  // ⚠️ Inherited by every child process, which is how the gate a proof runs learns not to touch this.
  process.env[LIVE_ENV] = [...liveFromEnv(), ...armed.map((a) => a.backup)].join('\n');
  if (!handlersInstalled) {
    handlersInstalled = true;
    for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
      process.on(sig, () => {
        restoreArmed();
        // ⚠️ Re-raise rather than swallow: a harness that eats Ctrl-C is worse than one that leaves a file.
        process.exit(130);
      });
    }
    process.on('uncaughtException', (err) => {
      restoreArmed();
      throw err;
    });
    process.on('exit', restoreArmed);
  }
  return restoreArmed;
}
