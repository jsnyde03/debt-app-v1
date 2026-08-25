/**
 * [D49] — WHAT "SOURCE" MEANS, owned in ONE place.
 *
 * `write-gate-status.ts` fingerprints this set when the gate passes; `check-gate-freshness.ts`
 * re-fingerprints it to decide whether that pass still describes the tree. **Two copies of this
 * definition is how a freshness check starts passing because it out-waited nothing** — the same reason
 * `SAVE_DEBOUNCE_MS` is exported rather than retyped, and the same reason R4's veto and its reporter
 * share `forbiddenRealStoreChanges`.
 *
 * ⚠️ **A CONTENT FINGERPRINT, NOT A GIT DIFF, and the difference is the whole failure [D49] exists for.**
 * The gate was red from `f4e5e11` to 2026-08-20 while three sessions recorded it green, each correctly
 * reasoning *"no source touched **this session**"*. A `git diff <sha> HEAD` would have said the same
 * thing about a tree with uncommitted work in it. Hashing the bytes covers committed and uncommitted
 * changes with one mechanism and needs no reasoning about which.
 *
 * ⛔ **SCOPE IS AN EXCLUSION LIST, NOT AN INCLUSION LIST — [W1-4].** An inclusion list fails *silent*: a
 * gate input nobody thought to enumerate is simply absent, and the freshness check then reports a green
 * that no longer describes the tree. An exclusion list fails *safe*: the worst case is a red that did not
 * need to be. This file previously hand-listed nine `EXTRA_FILES` and got most members of the class —
 * missing the RN eslint config, `app.config.js`, the canvaskit copier and all seven Expo plugins.
 *
 * ⛔ **`.github/**` AND `.maestro` ARE IN, because three links of `validate:release:rn` read them — [W1-12].**
 * `lint:rn` ends with `lint:lane`, which parses `.github/workflows/native-e2e.yml`, `app-preview.yml` and
 * both composite `.github/actions/<name>/action.yml` files and exits 1 on 87 structural assertions;
 * ⚠️ that path is written with `<name>` rather than a glob on purpose — a `*` followed by a `/` ends this
 * block comment, which is exactly how this docstring first failed to compile. `lint:selectors`
 * reads every `apps/rn/.maestro/*.yaml`. Edit any of them and the gate's verdict genuinely changes.
 * ⚠️ **That is why `SOURCE_EXT` carries `.yml`/`.yaml`** — adding the roots without the extensions would
 * have fingerprinted nothing at all and looked like it worked.
 *
 * ⚠️ **ONE KNOWN RESIDUE, accepted deliberately: `docs/`.** `lint:closure` reads
 * `DEBT_ELEVATION_PLAN.md`, `DEBT_ELEVATION_LOG.md` and the 2026-08-17 findings, so a docs-only commit
 * genuinely *can* red the gate. Fingerprinting them anyway would leave freshness red almost permanently —
 * those two files are edited many times per session — and a permanently-red check is the failure this
 * repo has already lived through once. **The residue is real and is stated rather than closed:** a plan or
 * log edit that breaks closure will not be caught by `lint:gate-freshness`.
 */
import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

export const REPO_ROOT = join(import.meta.dirname, '..');
export const GATE_STATUS_FILE = join(REPO_ROOT, 'gate-status.json');

/**
 * Directories walked for source. Broad by design — see the header: the pruning happens in `skipDir`,
 * so a new gate input is included by default rather than forgotten by default.
 *
 * `apps/rn/.maestro`, `.github/workflows` and `.github/actions` are named explicitly because `skipDir`
 * prunes dot-directories; naming a root calls `walk` on it directly, which bypasses that.
 */
const ROOTS = [
  'apps/rn',
  'packages/core',
  'scripts',
  'apps/rn/.maestro',
  '.github/workflows',
  '.github/actions',
  /**
   * ⛔ **THE LEGACY ROOT TREES — a gate READS them, so the fingerprint must SEE them.**
   * [P6.8.9.7.11.18 · S0.2b · REVERIFY-1 finding 7]
   *
   * `check-month-arithmetic`'s `PENDING_DELETION` scans these four and asserts they still exist, so its
   * output is a function of their contents. They were in no root here — which meant **P6.11's deletion
   * would change what that gate does while `lint:gate-freshness` still called the recorded pass fresh.**
   * That is [D49]'s own failure mode, arriving through a gate added to close a different one.
   *
   * ⚠️ **The coupling is intentional and it is temporary**: P6.11 deletes this tree, which will change
   * the fingerprint once and then remove these roots along with the `PENDING_DELETION` entry that
   * requires them. Until then a legacy-tree edit correctly invalidates the recorded pass, because a
   * legacy-tree edit can correctly change a gate's verdict.
   */
  'app',
  'components',
  'lib',
  'tests',
];

/** Repo-root files that change what the gate builds or runs and sit outside every root above. */
const EXTRA_FILES = ['package.json', 'package-lock.json', 'tsconfig.json', 'eslint.config.mjs'];

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yml', '.yaml']);

/** Never source: build output, dependencies, prose, and the record this check writes. */
function skipDir(name: string): boolean {
  return (
    name === 'node_modules' ||
    name === 'dist' ||
    name === 'dist-embed' ||
    name === '_site' ||
    name === 'test-results' ||
    name === 'playwright-report' ||
    name.startsWith('.')
  );
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return; // a root that does not exist yet (or was deleted) contributes nothing
  }
  for (const entry of entries) {
    const p = join(dir, entry);
    // ⛔ `lstat`, and symlinks are skipped. `apps/rn/core` is a symlink to `packages/core` that Metro
    // creates at startup — following it would fingerprint every core file TWICE, under two paths, so a
    // single core edit would move two entries. Skipped for BEING a link, not for being called `core`:
    // a name check would silently start excluding a real directory the day someone adds one.
    const st = lstatSync(p);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      if (!skipDir(entry)) walk(p, out);
    } else if (SOURCE_EXT.has(extname(p))) {
      out.push(p);
    }
  }
}

/**
 * Every gate-relevant file, repo-relative, sorted — so the fingerprint is order-independent.
 *
 * ⚠️ DEDUPED. The roots are allowed to overlap (`apps/rn` contains `apps/rn/.maestro`'s parent, and a
 * future root may nest inside another); without this, one file would hash twice and the count would
 * overstate the surface. A `Set` makes overlap a non-question rather than something to reason about.
 */
export function sourceFiles(): string[] {
  const abs: string[] = [];
  for (const r of ROOTS) walk(join(REPO_ROOT, r), abs);
  const rel = new Set(abs.map((p) => relative(REPO_ROOT, p).split(sep).join('/')));
  for (const f of EXTRA_FILES) {
    try {
      lstatSync(join(REPO_ROOT, f));
      rel.add(f);
    } catch {
      /* absent is fine — its absence is itself part of the fingerprint via the file list */
    }
  }
  return [...rel].sort();
}

/**
 * One hash over every source file's PATH and CONTENT.
 *
 * ⚠️ Paths are hashed too, not just contents — otherwise deleting a file and adding an identical one
 * under a different name would fingerprint the same, and so would a pure rename that breaks every import.
 *
 * ⛔ Line endings are NORMALISED. This repo is edited on Windows and gated on Linux CI, and git's
 * autocrlf rewrites on checkout — without this, a fingerprint taken locally could never match one taken
 * in CI, and the check would red permanently for a reason having nothing to do with the code.
 */
export function fingerprintSources(): { hash: string; fileCount: number } {
  const files = sourceFiles();
  const h = createHash('sha256');
  for (const f of files) {
    h.update(f);
    h.update('\0');
    try {
      h.update(readFileSync(join(REPO_ROOT, f), 'utf8').replace(/\r\n/g, '\n'));
    } catch {
      h.update('<unreadable>');
    }
    h.update('\0');
  }
  return { hash: h.digest('hex'), fileCount: files.length };
}

export interface GateStatus {
  /** The commit HEAD pointed at when the gate passed. Human-readable anchor; not what freshness turns on. */
  sha: string;
  /** UTC, ISO-8601. What "when did it last actually pass" is answered from. */
  at: string;
  /** The fingerprint that decides freshness — see the header for why this rather than a git diff. */
  sourceHash: string;
  fileCount: number;
  /** True if the tree carried uncommitted changes when the gate passed. Recorded, not refused. */
  dirty: boolean;
}
