/**
 * [S1.10.6.5.8.4 · GAP-8] — **CLOSES THE CLASS, NOT THE SEVEN INSTANCES.**
 *
 * ⛔ The seven gates that reported ✅ while reading nothing now each carry a scan floor. That fixes seven
 * files. It does nothing about **the eighth gate somebody writes next week**, which will import
 * `stripCode` and inherit the identical hole — and this cluster's whole lesson is that fixing instances
 * one at a time is what produced the recurrence ([D67], and `.6.2`'s eight ids that were one rule wired
 * to a subset).
 *
 * ⚡ **The class is decidable**, which is why it is worth a gate: a strip-using gate is exactly a script
 * importing `./lib/stripCode`, and the remedy is exactly a `scanned()` call plus an `assertScanFloor()`
 * call plus a ledger entry. All three are greppable.
 *
 * ⚠️ **Four consumers are EXEMPT and named:** `check-destructive-writes`, `check-sandbox-writes`,
 * `check-trust-claims` and `check-copy-owners` already red under a blanking stripper, because each
 * compares against a declared-count ledger — reading nothing contradicts a number. **Measured, not
 * assumed:** all four were run against the blanked stripper and all four exited 1.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SCRIPTS = join(import.meta.dirname);
const LEDGER = join(SCRIPTS, 'gate-scan-floors.json');

/**
 * Consumers that do NOT need a scan floor, each with the reason it already fails closed.
 * ⚠️ Self-ratcheting: an entry naming a file that no longer imports the stripper reds.
 */
const EXEMPT: Record<string, string> = {
  'check-destructive-writes.ts':
    'ALLOWED declares a per-file call count and the gate reds on drift, so reading nothing reports 0 against a non-zero declaration. Verified red under a blanked stripper 2026-08-27.',
  'check-sandbox-writes.ts':
    'Same shape — a stale allow-list entry reds. Verified red under a blanked stripper 2026-08-27 (24 stale entries reported).',
  'check-trust-claims.ts':
    'Every claim route must have a caller; reading nothing removes every caller. Verified red under a blanked stripper 2026-08-27 (15 problems).',
  'test-strip-code.ts':
    'Not a scanning gate — it is the unit test OVER the stripper (GAP-9), asserting exact output per construct plus length and line-count preservation, so a stripper reading nothing fails its own equality assertions. Verified red under a blanked stripper 2026-08-27 (exit 1).',
  'test-line-endings.ts':
    'Not a scanning gate — it feeds ONE committed fixture through the stripper and asserts the CRLF bytes survive, so a stripper reading nothing fails its own non-vacuity controls rather than passing quietly. Verified red under a blanked stripper 2026-08-27 (exit 1).',
  'check-copy-owners.ts':
    'Every closure must stay wired to its owner; reading nothing unwires all of them. Verified red under a blanked stripper 2026-08-27 (5 closures).',
};

const ledger: Record<string, unknown> = JSON.parse(readFileSync(LEDGER, 'utf8'));
const problems: string[] = [];

/**
 * ⚠️ **THE EXTENSION IS OPTIONAL IN THE IMPORT, AND THE FIRST VERSION OF THIS LINE MISSED THAT.**
 * `check-trust-claims.ts` imports `'./lib/stripCode.ts'` while the other ten omit the extension, so a
 * match on `from './lib/stripCode'` — closing quote included — silently skipped it. ⚡ It was caught by
 * this file's OWN stale-exemption check: the EXEMPT entry named a file the detector could not see, and
 * said so. That is the undercount class this repo has now measured seven times, arriving inside the
 * instrument written to close it. ⛔ Match the path, not the path-plus-quote.
 *
 * `check-scan-floors.ts` excludes itself: it names the import path in a string literal, not an import.
 */
/**
 * ⛔ **S1.11.2 [pass-4 D4-9] — IT MATCHED A SPELLING WHERE IT MEANT A CONDITION, AND THE DOCBLOCK ABOVE
 * SAYS SO ABOUT ITS OWN PREVIOUS VERSION.**
 *
 * The detector was `readdirSync(SCRIPTS)` — **not recursive** — filtered on
 * `/from '\.\/lib\/stripCode(\.ts)?'/` — **single quotes, and `./lib/` exactly**. So the *"eighth gate
 * somebody writes next week"* that this file exists for is invisible to it if it is written with double
 * quotes, or lives one directory down. ⚡ That is the same undercount the docblock above already records
 * arriving inside this instrument — **fixed the first time by widening the enumeration by one spelling**,
 * which is what left the other two open.
 *
 * The condition is *"this file imports the stripper"*. A non-comment line with `from '<anything>stripCode'`
 * IS that condition, at any depth and in any quote style. ⚠️ Comment lines are excluded deliberately: this
 * file's own docblock quotes the import path, and so does `run-gates.ts`.
 */
export function importsStripper(src: string): boolean {
  return src.split(/\r?\n/).some((line) => {
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return false;
    return /\bfrom\s*['"`][^'"`]*stripCode(\.ts)?['"`]/.test(t);
  });
}

/** Every `.ts` under `scripts/`, at any depth. `readdirSync` alone stopped at the top level. */
function walkTs(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    // ⚠️ A deny-list with a reason, not an allow-list of directories: forgetting to exclude a build dir
    // shows up as an extra file someone deletes, where forgetting to INCLUDE one is silent.
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') out.push(...walkTs(join(dir, e.name), rel));
    } else if (e.name.endsWith('.ts')) out.push(rel);
  }
  return out;
}

/**
 * ⛔ **MODULE SCOPE — the detector is asserted before it is trusted.** The synthetic rows are the three
 * spellings `D4-9` measured as invisible; the real-file rows keep it honest about this tree, and their
 * existence is asserted so a renamed file cannot turn this into a check of nothing.
 */
{
  const CASES: readonly (readonly [string, boolean, string])[] = [
    [`import { stripCommentsOnly } from './lib/stripCode';`, true, 'the spelling it already saw'],
    [`import { stripCommentsOnly } from "./lib/stripCode";`, true, '⛔ D4-9 — double quotes'],
    [`import { stripCommentsOnly } from './lib/stripCode.ts';`, true, 'the .ts spelling, missed once before'],
    [`import { x } from '../lib/stripCode';`, true, '⛔ D4-9 — one directory down'],
    [` * match on \`from './lib/stripCode'\` — closing quote included`, false, "a docblock quoting the path is not an import"],
    [`// every script importing lib/stripCode carries a scan floor`, false, 'a comment naming the module is not an import'],
    [`import { y } from './lib/other';`, false, 'an unrelated import'],
  ];
  for (const [line, want, why] of CASES) {
    if (importsStripper(line) !== want) {
      console.error(`\n❌ scan floors — its own importsStripper() is wrong: ${why}\n   ${JSON.stringify(line)} → ${importsStripper(line)}, expected ${want}\n`);
      process.exit(1);
    }
  }
}

const consumers = walkTs(SCRIPTS)
  .filter((f) => f !== 'check-scan-floors.ts')
  .filter((f) => importsStripper(readFileSync(join(SCRIPTS, f), 'utf8')));

// ⚠️ The detector must still see the tree it was built for. A refactor that quietly stops matching
// everything would otherwise report "0 strip-using gates" and exit 0 — GAP-8 one level up.
{
  const MUST_SEE = ['check-apostrophes.ts', 'check-trust-claims.ts', 'test-strip-code.ts'];
  for (const f of MUST_SEE) {
    if (!consumers.includes(f)) {
      console.error(`\n❌ scan floors — \`${f}\` imports the stripper and the detector no longer sees it.\n   ⛔ [D4-9] A detector that finds nothing reports every gate floored.\n`);
      process.exit(1);
    }
  }
}

for (const file of consumers) {
  const src = readFileSync(join(SCRIPTS, file), 'utf8');
  if (EXEMPT[file]) continue;
  const hasCount = src.includes('scanned(SCAN_GATE,') || src.includes('scanLines(SCAN_GATE,');
  const hasAssert = src.includes('assertScanFloor(SCAN_GATE)');
  // ⚠️ Any quote style, for the same reason `importsStripper` does — this line had the identical
  // single-quote assumption D4-9 found next to it.
  const keyMatch = /const SCAN_GATE = ['"`]([^'"`]+)['"`]/.exec(src);
  if (!hasCount || !hasAssert || !keyMatch) {
    problems.push(
      `${file} strips its input but does not floor it` +
        `${hasCount ? '' : ' — no scanned() call'}` +
        `${hasAssert ? '' : ' — no assertScanFloor() call'}` +
        `${keyMatch ? '' : ' — no SCAN_GATE key'}.\n` +
        '      A gate that strips can report a pass while reading nothing (GAP-8). Wire it, or add it to\n' +
        '      EXEMPT here with the reason it already fails closed — and MEASURE that, do not assume it.',
    );
    continue;
  }
  if (!(keyMatch[1] in ledger)) {
    problems.push(`${file} declares SCAN_GATE '${keyMatch[1]}', which has no entry in gate-scan-floors.json.`);
  }
}

// Stale exemptions — a named file that no longer imports the stripper, or is gone.
for (const file of Object.keys(EXEMPT)) {
  if (!consumers.includes(file)) {
    problems.push(`EXEMPT names ${file}, which no longer imports lib/stripCode — delete the entry.`);
  }
}

// Stale ledger entries — a floor for a gate that no longer declares it.
// ⛔ S1.12.11 — derived from EVERY script, not from `consumers`. Stripping is why a gate is REQUIRED to
// floor itself; it is not what makes a floor legitimate. `check-conflict-markers.ts` deliberately does
// not strip — a marker inside a comment is still an unresolved conflict — and floors itself anyway,
// because its own blinding mode is an empty population rather than an empty file. Read over the
// stripper-importing subset, its live floor was reported STALE and the instruction was to delete it:
// the check would have talked a correctly-floored gate out of its floor.
const declared = new Set(
  walkTs(SCRIPTS)
    .map((f) => /const SCAN_GATE = ['"`]([^'"`]+)['"`]/.exec(readFileSync(join(SCRIPTS, f), 'utf8'))?.[1])
    .filter(Boolean) as string[],
);
for (const key of Object.keys(ledger)) {
  if (key.startsWith('_')) continue;
  if (!declared.has(key)) {
    problems.push(`gate-scan-floors.json holds a floor for '${key}', which no gate declares — delete it.`);
  }
}

if (problems.length > 0) {
  console.error(`\n❌ scan floors: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}\n`);
  process.exit(1);
}

console.log(
  `✅ scan floors: ${consumers.length} strip-using gate(s) — ` +
    `${consumers.length - Object.keys(EXEMPT).length} floored, ${Object.keys(EXEMPT).length} exempt by a measured reason, none stale.`,
);
