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
import { flattenContinuations } from './lib/logicalLines';
import { stripCommentsOnly } from './lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '..');
const SCAN_GATE = 'amount-collapse';

/**
 * Files that must CONTAIN the banned form to do their job, so the sweep does not read them.
 *
 * ⛔ **This is the `stripCode` argument, extended one step.** Comments are blanked because a gate that reds
 * on its own documentation gets deleted rather than obeyed. The same is true of the harness that PROVES
 * this gate: `test-wrap-escapes.ts` carries the wrapped collapse as a plant recipe, in a string.
 *
 * ⚠️ **It only became visible when `R5` was fixed.** While the scan blanked string contents, the recipe was
 * invisible — and so was every real collapse written inside a template interpolation. Restoring the strings
 * restored both, and this is the honest cost: two files named, rather than a whole class of code unread.
 */
const SELF = new Set(['scripts/check-amount-collapse.ts', 'scripts/test-wrap-escapes.ts']);

/**
 * ⚠️ **`[^\n]*?` still means "within one statement", and that is only true because the scan FLATTENS
 * rather than JOINS** — a statement-ending newline survives, so this cannot reach across two statements.
 * The class-1 re-audit (`R4`) measured what joining did instead: two correct statements five lines apart
 * reported as one collapse.
 */
const COLLAPSE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/g;

/**
 * site → why zero is the honest answer there.
 *
 * ⚠️ A site absent from this map is a FAILURE, not a default — and a map entry whose site no longer
 * matches is a failure too, so a stale permission cannot sit here granting cover to nothing.
 */
const ALLOWED: Record<string, { sites: number; why: string }> = {
  'apps/rn/src/components/plan/WindfallSheet.tsx': {
    sites: 1,
    why:
      'a PREDICATE: `const n = parse(...) ?? 0` is consumed by `validAmount = n > 0` on the next line, and ' +
      'the sheet refuses to compute a split without it. Nothing stores `n` while it is zero.',
  },
  'apps/rn/src/data/readBackup.ts': {
    sites: 1,
    why:
      'a PREDICATE: `(parse(...) ?? 0) > 0` decides whether the pre-overwrite sentence names "the ' +
      'paycheck". Unreadable and absent both mean "do not name it", which is the same answer.',
  },
};

const tracked = execFileSync('git', ['ls-files', 'apps/rn', 'packages/core', 'scripts'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => /\.(ts|tsx)$/.test(l) && !SELF.has(l) && !/utils\/(amountField|testAmountField)\.ts$/.test(l));

const problems: string[] = [];
const found: string[] = [];

/**
 * ⛔ **THE SCAN IS NOT PER PHYSICAL LINE** — pass-7 `D1-3`. `COLLAPSE` used to run against
 * `text.split('\n')`, so a call Prettier had wrapped left the population entirely while this gate printed
 * a smaller count beside a ✅. That is pass-5 `D5-9`'s escape, **in a gate written after `D5-9` was
 * fixed** — the lesson lived in `check-cap-literals`'s docblock instead of in the shared helper.
 *
 * ⛔ **AND EVERY SITE, NOT THE FIRST** — pass-7 `D1-4`. The loop `break`'d on the first hit per file, so a
 * second collapse in the same file was invisible and `found` under-counted.
 */
const perFile = new Map<string, number>();
for (const rel of tracked) {
  const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
  // ⚠️ `scanned` counts NON-BLANK lines, so it must keep seeing the STRIPPED text: handing it the raw
  // source counts comment lines as read and inflates the floor — measured, 60,671 → 95,693 — which blunts
  // the one instrument that notices this gate going blind.
  scanned(SCAN_GATE, stripCommentsOnly(src));
  /**
   * ⛔ **FLATTENED IN PLACE, NOT JOINED** — pass-7 `D1-3`, corrected by the class-1 re-audit's `R3`/`R4`.
   * The first fix joined physical lines, which reported every hit at the STATEMENT's first line (17 of 94
   * rounding sites printed the wrong line) and **deleted the newline that bounded `[^\n]*?`**, so two
   * unrelated correct statements were reported as one collapse. Flattening preserves length, so the offset
   * gives the line of the MATCH and a statement-ending newline still bounds the pattern.
   *
   * ⚠️ **Strings are NOT blanked** (`R5`): `stripCommentsAndStrings` blanks `${…}` interpolations, which
   * are code, so a collapse inside a template literal was caught before the v1 fix and invisible after it.
   */
  const flat = flattenContinuations(src);
  for (const m of flat.text.matchAll(COLLAPSE)) {
    found.push(rel);
    perFile.set(rel, (perFile.get(rel) ?? 0) + 1);
    if (!(rel in ALLOWED)) {
      problems.push(
        `${rel}:${flat.lineAt(m.index)} collapses a parsed amount to 0.\n` +
          '        `null` is BLANK OR UNPARSEABLE, and neither is a payment of zero. Branch on it, or add\n' +
          '        this file to ALLOWED in scripts/check-amount-collapse.ts with the reason zero is honest here.',
      );
    }
  }
}

/**
 * ⛔ **A FILE-GRANULAR PERMISSION WITH A LINE-SPECIFIC REASON IS A HOLE** — pass-7 `D1-4`. Each `ALLOWED`
 * entry argues why *one particular* collapse is honest; without a count, a SECOND collapse added to that
 * file later inherits the permission and is never reported. The count is the ratchet.
 */
for (const [rel, entry] of Object.entries(ALLOWED)) {
  const n = perFile.get(rel) ?? 0;
  if (n > entry.sites) {
    problems.push(
      `${rel} has ${n} collapse(s) and ALLOWED permits ${entry.sites}.\n` +
        '        The permission argues why ONE site is honest; it does not cover a new one. Branch on the\n' +
        '        null, or raise `sites` here with the reason the new site is honest too.',
    );
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
