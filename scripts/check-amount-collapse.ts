/**
 * ⛔ **S1.13.7.8 [pass-6 `C1-6`] — `?? 0` ON A PARSED AMOUNT MUST BE NAMED, WITH A REASON.**
 *
 * `amountField.ts`'s parsers return `null` for **blank and unparseable alike**, deliberately, and the
 * docblock says why: *"Blank returns `null` so the caller can keep whatever it was showing… clearing a
 * pre-filled balance used to confirm the debt at zero."* A caller-side `?? 0` hands that distinction
 * straight back — the same collapse `amountField.ts:47` records as a shipped defect (*"`Number(raw) || 0`
 * collapsed them, so a mistyped `5,5` APR became 0%"*), re-committed by the very caller the shared parser
 * was written to protect.
 *
 * ⚡ **The defect this closes:** the payday sheet's extra-payment box parsed on every keystroke and mapped
 * `null` to `0`, so an entry that did not parse was **recorded as $0.00 rather than refused** — and it is
 * that figure the Interest-Saved Ledger and the Drift Tracker are fed. Three of the four money inputs in
 * that same file already held a raw string and parsed once; this was the one that did not.
 *
 * ⚠️ **The population is `git ls-files`, not a list of files somebody thought to check** — the rule the
 * conflict-marker gate exists to state. Every occurrence must appear in {@link ALLOWED} with a reason, so
 * a new one reds until its author writes down why **zero** is the honest answer there. Both surviving
 * entries are predicates: the value is compared to `0` on the same line and never stored.
 *
 * ⛔ **COMMENTS ARE STRIPPED BEFORE SCANNING, and that is load-bearing rather than tidy.** This gate's own
 * docblock, and `PaydayCaptureSheet`'s, both QUOTE the banned form while recording the defect. A guard
 * that reds on its own documentation gets deleted rather than obeyed — `stripCode.ts` says exactly this,
 * and it is why the shared scanner exists instead of a per-line regex.
 *
 * ⛔ **WHAT THIS DOES NOT COVER, stated because an instrument that overstates its reach is how the next
 * defect gets past it.** It reads source text. It cannot see whether an input RENDERS its draft
 * correctly, and no automated test in this repo drives the payday sheet's extra-payment row. The half it
 * holds is the half that shipped the defect: a `null` mapped to `0` at a call site.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';
import { stripCommentsOnly } from './lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '..');
const SCAN_GATE = 'amount-collapse';

/** The parsers whose `null` carries the distinction. Named here, so this file cannot scan itself. */
const SELF = 'scripts/check-amount-collapse.ts';

const COLLAPSE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/;

/**
 * site → why zero is the honest answer there.
 *
 * ⚠️ A site absent from this map is a FAILURE, not a default — and a map entry whose site no longer
 * matches is a failure too, so a stale permission cannot sit here granting cover to nothing.
 */
const ALLOWED: Record<string, string> = {
  'apps/rn/src/components/plan/WindfallSheet.tsx':
    'a PREDICATE: `const n = parse(...) ?? 0` is consumed by `validAmount = n > 0` on the next line, and ' +
    'the sheet refuses to compute a split without it. Nothing stores `n` while it is zero.',
  'apps/rn/src/data/readBackup.ts':
    'a PREDICATE: `(parse(...) ?? 0) > 0` decides whether the pre-overwrite sentence names "the ' +
    'paycheck". Unreadable and absent both mean "do not name it", which is the same answer.',
};

const tracked = execFileSync('git', ['ls-files', 'apps/rn', 'packages/core', 'scripts'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => /\.(ts|tsx)$/.test(l) && l !== SELF && !/utils\/(amountField|testAmountField)\.ts$/.test(l));

const problems: string[] = [];
const found: string[] = [];

for (const rel of tracked) {
  const text = scanned(SCAN_GATE, stripCommentsOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')));
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!COLLAPSE.test(lines[i])) continue;
    found.push(rel);
    if (!(rel in ALLOWED)) {
      problems.push(
        `${rel}:${i + 1} collapses a parsed amount to 0.\n` +
          '        `null` is BLANK OR UNPARSEABLE, and neither is a payment of zero. Branch on it, or add\n' +
          '        this file to ALLOWED in scripts/check-amount-collapse.ts with the reason zero is honest here.',
      );
    }
    break;
  }
}

for (const site of Object.keys(ALLOWED)) {
  if (!found.includes(site)) {
    problems.push(
      `ALLOWED names ${site}, and the sweep no longer finds a collapse there.\n` +
        '        A permission covering nothing is slack the next collapse can hide in — delete the entry.',
    );
  }
}

const read = assertScanFloor(SCAN_GATE);

if (problems.length) {
  console.error(`\n❌ amount-collapse: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `✅ amount-collapse: ${found.length} site(s), all named with a reason (${tracked.length} files, ${read} lines read).${scanNote(SCAN_GATE, read)}`,
);
