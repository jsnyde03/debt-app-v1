/**
 * ⛔ **S1.12.11 — NO TRACKED FILE MAY CARRY AN UNRESOLVED MERGE-CONFLICT MARKER.**
 *
 * ⚡ Found by accident, and that is the whole point. Five tracked files — `app/page.tsx`, three hooks and
 * a root e2e spec — carried `<<<<<<< Updated upstream` / `>>>>>>> Stashed changes` from **2026-08-25**.
 * They were still there **177 commits later**. The root Next app could not parse, so its entire e2e suite
 * had been un-runnable for five days, and it surfaced only because a mistyped command (`test:e2e` instead
 * of `test:e2e:rn`) started the one webserver nobody had started since.
 *
 * ⛔ **Forty-two gates were green over a tree containing `<<<<<<<`.** Not one of them reads the legacy
 * root surface: `surface-coverage.ts` marks `app/` *"legacy Next surface — deleted at P6.11"*, and
 * `lint:rn` scopes to `apps/rn` + `packages/core` + `scripts`. Scheduled-for-deletion is not deleted, and
 * a directory nothing checks is a directory anything can rot in.
 *
 * ⚡ **This is the round's own repeating shape, one more time: a check that cannot fail.** The tree was
 * syntactically broken and every instrument said ✅, because every instrument was pointed somewhere else.
 *
 * ⚠️ **The population is `git ls-files`, not a directory list.** A scope list is what let this survive —
 * so the default here is SCAN, and the skips are an explicit, named set of extensions. A new source
 * extension is covered the day it appears rather than the day someone remembers to add it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';

const REPO_ROOT = join(import.meta.dirname, '..');
const SCAN_GATE = 'conflict-markers';

/**
 * Skipped by extension, each because the bytes are not source the toolchain parses.
 *
 * ⚠️ `.md` is here for a REASON, not for convenience: prose about merge conflicts has to be able to
 * quote them — this file's own finding is written up in `DEBT_ELEVATION_LOG.md`. The risk that buys is a
 * marker sitting in a document, which renders oddly and breaks nothing. A marker in source does not.
 */
const SKIP_EXT = new Set([
  '.md', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.icns', '.pdf', '.zip', '.gz',
  '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.mov', '.wav', '.mp3', '.keystore', '.jks',
  '.p12', '.mobileprovision', '.car', '.xcuserstate', '.pbxproj', '.lock',
]);

/** This file names all three markers in string literals, so it cannot scan itself. */
const SELF = 'scripts/check-conflict-markers.ts';

// Built by concatenation so the patterns below are the only place the sequences appear, and so this
// script's own text carries no line that would match them.
const OPEN = new RegExp('^' + '<'.repeat(7) + '(?: |$)', 'm');
const MID = new RegExp('^' + '='.repeat(7) + '(?: |$)', 'm');
const CLOSE = new RegExp('^' + '>'.repeat(7) + '(?: |$)', 'm');

const tracked = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

const scanFiles = tracked.filter((rel) => {
  if (rel === SELF) return false;
  const dot = rel.lastIndexOf('.');
  return dot === -1 ? true : !SKIP_EXT.has(rel.slice(dot).toLowerCase());
});

const hits: { rel: string; line: number; text: string }[] = [];

for (const rel of scanFiles) {
  let text: string;
  try {
    text = readFileSync(join(REPO_ROOT, rel), 'utf8');
  } catch {
    continue; // a tracked path that is not readable as text is not source
  }
  scanned(SCAN_GATE, text);
  // ⛔ NOT stripped. A conflict marker inside a comment is still an unresolved conflict — and in
  // `page.tsx` the first of the two blocks split an IMPORT list, which no stripper would have kept.
  /**
   * ⛔ **S1.13.7.2 [pass-6 `D3-4`] — ANY ONE MARKER IS A CONFLICT. Requiring the PAIR let the commonest
   * leftover through: a stray `>>>>>>>` after someone keeps the upper side, or a stray `<<<<<<<` after
   * they keep the lower one. A half-resolved conflict is the one a human is most likely to leave, and it
   * read GREEN — in the gate written because six files carried markers for 177 commits.**
   *
   * ⚠️ `MID` alone is safe here only because `.md` is in `SKIP_EXT`: a markdown H1 underline is exactly
   * seven `=` at line start. In a `.ts` file a bare `=======` line is a syntax error, so it cannot be
   * legitimate content in anything this gate actually scans.
   */
  if (!(OPEN.test(text) || MID.test(text) || CLOSE.test(text))) continue;
  text.split('\n').forEach((line, i) => {
    if (OPEN.test(line) || MID.test(line) || CLOSE.test(line)) hits.push({ rel, line: i + 1, text: line.trimEnd() });
  });
}

if (scanFiles.length === 0) {
  // ⚠️ Says which of the two went empty. `git ls-files` returning nothing and the skip-set swallowing
  // every extension both land here, and blaming git for the second would be a false statement.
  console.error(
    `\n❌ conflict markers: the scan read 0 of ${tracked.length} tracked file(s) — the population went empty,\n` +
      '  so "no markers found" means nothing was looked at.\n',
  );
  process.exit(1);
}

if (hits.length > 0) {
  const files = [...new Set(hits.map((h) => h.rel))];
  console.error(
    `\n❌ conflict markers: ${hits.length} marker line(s) in ${files.length} tracked file(s).\n\n` +
      hits.map((h) => `  ${h.rel}:${h.line}  ${h.text}`).join('\n') +
      '\n\n  ⛔ Resolve the conflict — do not delete the markers and keep both sides. Five files sat like\n' +
      '  this for 177 commits while 42 gates reported green.\n',
  );
  process.exit(1);
}

const observedScan = assertScanFloor(SCAN_GATE);
console.log(
  `✅ conflict markers: none in ${scanFiles.length} tracked file(s) of ${tracked.length}` +
    `${scanNote(SCAN_GATE, observedScan)}`,
);
