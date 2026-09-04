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
 * ⛔ **AND THE PRE-FLIGHT RESTORES ONLY WHAT IT CAN PROVE IT WROTE.** [`V4`, blocker]
 *
 * The first cut of this file argued *restore over refuse* - *"a harness that merely refuses to start leaves
 * the planted file in the tree for `git add -A` to find"* - which is true, and it never measured the other
 * side. ⚡ **Measured: it overwrote 83 bytes of uncommitted work in a tracked file, reported the file
 * `recovered`, and deleted the sidecar that would have shown what happened.** A refusal costs a human one
 * command; a wrong restore costs work that no longer exists anywhere.
 *
 * So recovery now requires two independent facts - the target is DIRTY against `HEAD`, and its bytes are
 * the plant this mechanism recorded making. Anything else is refused, loudly, with both files untouched.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
const PLANT_SUFFIX = '.plant-hash';

const sha = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

/**
 * ⛔ **RECORD WHAT THE PLANT LOOKS LIKE, or the pre-flight is guessing — and it guessed wrong.**
 * [class-1 re-audit 5 `V4`, **blocker**: measured destroying 83 bytes of uncommitted work]
 *
 * ⚡ The first cut inferred *"this file is planted"* from *"a sidecar exists and the file differs from
 * it"*. **Those are not the same proposition.** The sidecar records the tree at plant time, so a plant, a
 * `git pull`, an editor save and a rebase all satisfy it identically. A real orphan sidecar — left beside
 * an ALREADY-CLEAN file by this session's own kill — plus one ordinary edit, and the production
 * pre-flight overwrote the file, reported it *recovered*, and deleted the sidecar in the same pass.
 *
 * ⛔ **The liveness marks did not help**: they separate a LIVE plant from an ABANDONED one. Nothing
 * separated an abandoned plant from an abandoned sidecar beside a file that needed nothing.
 *
 * So the harness now writes the plant's own fingerprint the moment it lands, and recovery happens only
 * when the bytes on disk are **the plant this mechanism made**. Anything else is somebody's work.
 */
export function notePlant(abs: string, plantedText: string): void {
  const backup = `${abs}${SIDECAR_SUFFIXES[0]}`;
  if (existsSync(backup)) writeFileSync(`${backup}${PLANT_SUFFIX}`, sha(plantedText), 'utf8');
}

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
/**
 * The result of a pre-flight. ⛔ `refused` is NOT advisory - see the note at the refusal site. A caller
 * that ignores it is back to guessing about a dirty tracked file, which is `V4`.
 */
export interface Preflight {
  /** repo-relative paths whose PLANT was undone */
  recovered: string[];
  /** human-readable refusals: a dirty target this mechanism cannot prove it wrote */
  refused: string[];
}

export function preflightRestore(repoRoot: string): Preflight {
  let out = '';
  try {
    out = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
  } catch {
    return { recovered: [], refused: [] }; // not a git tree — the sidecar layers still apply
  }
  const recovered: string[] = [];
  const refused: string[] = [];
  const live = liveFromEnv();
  for (const line of out.split('\n')) {
    const path = line.slice(3).trim().replace(/^"|"$/g, '');
    if (path.endsWith(OWNER_SUFFIX) || path.endsWith(PLANT_SUFFIX)) continue;
    const suffix = SIDECAR_SUFFIXES.find((s) => path.endsWith(s));
    if (!suffix) continue;
    const target = path.slice(0, -suffix.length);
    const absBackup = join(repoRoot, path);
    const absTarget = join(repoRoot, target);
    if (!existsSync(absBackup)) continue;
    // ⛔ See the note on LIVE_ENV: an ABANDONED plant is recovered, a LIVE one is left strictly alone.
    if (live.has(absBackup) || ownerIsAlive(absBackup)) continue;
    if (!existsSync(absTarget)) {
      dropMarks(absBackup);
      continue;
    }
    const onDisk = readFileSync(absTarget, 'utf8');

    /**
     * ⛔ **`V4` — CLEAN AGAINST `HEAD` MEANS THERE IS NOTHING TO RECOVER.** The signal handlers usually
     * win, so the commonest orphan is a sidecar beside an already-restored file. Overwriting it with the
     * sidecar's bytes is not a recovery, it is a revert of whatever happened since — and what happened
     * since was 83 bytes of somebody's work.
     */
    if (isCleanVsHead(repoRoot, target)) {
      /**
       * ⛔ **`W7` — IF THE SIDECAR DOES NOT MATCH `HEAD`, `HEAD` IS NOT THE PRE-PLANT STATE.**
       *
       * ⚡ The scenario this whole mechanism exists for is a plant that got COMMITTED. Then the target is
       * clean against `HEAD` — because `HEAD` *is* the plant — and the branch above silently deleted the
       * sidecar, which is the only copy of the original bytes. The mechanism destroying its own evidence
       * at exactly the case it was built for.
       */
      if (!sidecarMatchesHead(repoRoot, target, readFileSync(absBackup, 'utf8'))) {
        refused.push(
          `${target} is clean against HEAD, but its sidecar does NOT match HEAD.\n` +
            `        sidecar: ${path}\n` +
            '        ⛔ W7 — that means HEAD may BE the plant: a planted commit leaves exactly this state.\n' +
            '        Nothing deleted. Compare the two by hand before doing anything else.',
        );
        continue;
      }
      dropMarks(absBackup);
      continue;
    }

    /**
     * ⛔ **DIRTY: RESTORE ONLY THE BYTES THIS MECHANISM ITSELF WROTE, AND REFUSE OTHERWISE.**
     *
     * ⚠️ **Refusing is the safe direction here, and that is a reversal of `U15`'s reasoning.** `U15`
     * argued restore-over-refuse because *"a harness that merely refuses to start leaves the planted file
     * in the tree for `git add -A`"* — true, and it never measured the other side. A refusal costs a
     * human one command; a wrong restore costs work that no longer exists anywhere. So the refusal is
     * LOUD and the caller fails on it: an unexplained dirty target is not something to guess about.
     */
    const expected = existsSync(`${absBackup}${PLANT_SUFFIX}`)
      ? readFileSync(`${absBackup}${PLANT_SUFFIX}`, 'utf8').trim()
      : '';
    if (expected && expected === sha(onDisk)) {
      writeFileSync(absTarget, readFileSync(absBackup, 'utf8'), 'utf8');
      recovered.push(target);
      dropMarks(absBackup);
      continue;
    }
    // ⛔ Nothing is written and NOTHING IS DELETED — the sidecar is the only record of what happened.
    refused.push(
      `${target} is modified and its content is NOT the plant this harness would have made.\n` +
        `        sidecar: ${path}\n` +
        '        ⛔ Left untouched, both files. Restoring here would discard uncommitted work — measured\n' +
        '        doing exactly that (`V4`, 83 bytes). Inspect the two, then delete the sidecar by hand.',
    );
  }
  return { recovered, refused };
}

/** The sidecar and its marks, gone together — a stray one makes the "tree is clean" claim false. */
function dropMarks(absBackup: string): void {
  for (const s of ['', OWNER_SUFFIX, PLANT_SUFFIX]) rmSync(`${absBackup}${s}`, { force: true });
}

/**
 * ⛔ **ASK GIT THE QUESTION GIT CAN ANSWER — do not compare text.** [class-1 re-audit 6 `W6`, LIVE]
 *
 * ⚡ The first cut compared `git show HEAD:<path>` against the bytes on disk. **`git show` emits the blob
 * unfiltered; the working tree is filtered** — and this repo sets `core.autocrlf=true`, so on every CRLF
 * checkout a byte-identical file read as DIRTY. Measured in four scratch repos:
 *
 *     orphan beside a CLEAN file · autocrlf=false → recovered=0 refused=0 · sidecar dropped
 *     orphan beside a CLEAN file · autocrlf=true  → recovered=0 refused=1 · sidecar KEPT
 *
 * ⛔ **And that is the self-perpetuating shape.** The commonest orphan of all — a sidecar beside an
 * already-restored file, which this file's own note calls the common case — became a **fatal refusal**,
 * telling the reader *"Restoring here would discard uncommitted work"* about a file identical to `HEAD`.
 * The refusal path deliberately deletes nothing, so **it never clears itself**: every later `lint:rn`
 * fails the same way, with no way out but hand-deleting a file the message tells you to preserve.
 *
 * ⚠️ `git diff --quiet` applies exactly the filters the working tree has, which is the whole point. One
 * oracle, not two differently-filtered ones.
 */
function isCleanVsHead(repoRoot: string, repoRelative: string): boolean {
  try {
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--', repoRelative], { cwd: repoRoot, stdio: 'ignore' });
    return true;
  } catch {
    return false; // non-zero exit = differs from HEAD (or the path is unknown to HEAD)
  }
}

/** Is the SIDECAR the pre-plant state — i.e. does it match what `HEAD` holds? [`W7`] */
function sidecarMatchesHead(repoRoot: string, repoRelative: string, sidecar: string): boolean {
  try {
    const head = execFileSync('git', ['show', `HEAD:${repoRelative}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    // ⚠️ Compared with line endings normalised, for `W6`'s reason: `git show` is unfiltered.
    return head.replace(/\r\n/g, '\n') === sidecar.replace(/\r\n/g, '\n');
  } catch {
    return false;
  }
}

let armed: { abs: string; backup: string; original: string }[] = [];
let handlersInstalled = false;

function restoreArmed(): void {
  for (const a of armed) {
    try {
      if (readFileSync(a.abs, 'utf8') !== a.original) writeFileSync(a.abs, a.original, 'utf8');
      /**
       * ⛔ **ALL THREE MARKS, and missing one leaked 15 files into a COMMIT.** [round 6, self-inflicted]
       *
       * ⚡ `V4` added the plant fingerprint and this line removed the backup and the owner mark only. The
       * hashes accumulated silently — they are tiny and nobody looks — until a `git add -A` swept
       * **fifteen** of them into `ab8cdf91`. That is the same path that committed a live plant earlier in
       * this cluster: a harness artifact nobody was watching, plus a broad add.
       */
      dropMarks(a.backup);
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
