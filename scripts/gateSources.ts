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
 * ⚠️ **Deliberately scoped to what the gate EXERCISES.** A docs-only commit must not red — that is
 * [D49]'s own wording. `.github/**` is likewise out: `validate:release:rn` does not run workflows, so a
 * workflow edit does not invalidate a passing gate. If that ever stops being true, this is the file to
 * change, and changing it re-fingerprints everything by construction.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

export const REPO_ROOT = join(import.meta.dirname, '..');
export const GATE_STATUS_FILE = join(REPO_ROOT, 'gate-status.json');

/** Directories walked for source. Anything outside these is not gate-relevant by definition. */
const ROOTS = ['apps/rn/src', 'apps/rn/tests', 'packages/core', 'scripts'];

/** Individual files that change what the gate builds or runs, but live outside the roots above. */
const EXTRA_FILES = [
  'package.json',
  'package-lock.json',
  'apps/rn/package.json',
  'apps/rn/app.json',
  'apps/rn/tsconfig.json',
  'apps/rn/playwright.config.ts',
  'apps/rn/playwright.embed.config.ts',
  'apps/rn/metro.config.js',
  'apps/rn/babel.config.js',
  'tsconfig.json',
];

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json']);

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
    if (statSync(p).isDirectory()) {
      if (!skipDir(entry)) walk(p, out);
    } else if (SOURCE_EXT.has(extname(p))) {
      out.push(p);
    }
  }
}

/** Every gate-relevant file, repo-relative, sorted — so the fingerprint is order-independent. */
export function sourceFiles(): string[] {
  const abs: string[] = [];
  for (const r of ROOTS) walk(join(REPO_ROOT, r), abs);
  const rel = abs.map((p) => relative(REPO_ROOT, p).split(sep).join('/'));
  for (const f of EXTRA_FILES) {
    try {
      statSync(join(REPO_ROOT, f));
      rel.push(f);
    } catch {
      /* absent is fine — its absence is itself part of the fingerprint via the file list */
    }
  }
  return rel.sort();
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
