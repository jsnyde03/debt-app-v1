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
const consumers = readdirSync(SCRIPTS)
  .filter((f) => f.endsWith('.ts') && f !== 'check-scan-floors.ts')
  .filter((f) => /from '\.\/lib\/stripCode(\.ts)?'/.test(readFileSync(join(SCRIPTS, f), 'utf8')));

for (const file of consumers) {
  const src = readFileSync(join(SCRIPTS, file), 'utf8');
  if (EXEMPT[file]) continue;
  const hasCount = src.includes('scanned(SCAN_GATE,') || src.includes('scanLines(SCAN_GATE,');
  const hasAssert = src.includes('assertScanFloor(SCAN_GATE)');
  const keyMatch = /const SCAN_GATE = '([^']+)'/.exec(src);
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
const declared = new Set(
  consumers
    .map((f) => /const SCAN_GATE = '([^']+)'/.exec(readFileSync(join(SCRIPTS, f), 'utf8'))?.[1])
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
