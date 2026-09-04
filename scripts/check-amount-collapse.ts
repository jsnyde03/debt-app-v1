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
import { afterEnclosingGroups, findCalls, lineMap } from './lib/logicalLines';
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

/** The callee plus its opening paren — `findCalls` balances the rest, so no bound is guessed. */
/**
 * ⛔ **`?.(` AND A GENERIC ARGUMENT LIST ARE THE SAME CALL** — [class-1 re-audit 5 `V1`].
 *
 * `U1` named both spellings and the pattern was left byte-identical, so `parseAmountField?.(amount) ?? 0`
 * and `parseAmountField<number>(amount) ?? 0` each printed `✅ amount-collapse: 0 site(s)`.
 * ⚠️ **`f?.(x)` is valid TypeScript on a NON-nullable callee and compiles today**, which made it a live
 * one-character un-fix route for the whole `D1-3` family.
 */
const PARSER_CALL =
  /\b(?:parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*(?:<[^<>()]*>)?\s*(?:\?\.)?\s*\(/g;
/** What must follow the call's closing paren — and any GROUPING parens around it (`V1`) — to be a collapse. */
const AFTER = /^\s*\?\?\s*0\b/;

/**
 * site → why zero is the honest answer there.
 *
 * ⚠️ A site absent from this map is a FAILURE, not a default — and a map entry whose site no longer
 * matches is a failure too, so a stale permission cannot sit here granting cover to nothing.
 */
/**
 * ⛔ **EMPTY, AND THAT IS THE FIX** — [class-1 re-audit `R10`].
 *
 * Two shapes of permission were tried and both were **identity-free**: a per-file COUNT ratchets against
 * addition only, and a normalised EXPRESSION STRING is the same text wherever it sits. The re-audit proved
 * it by deleting the permitted honest predicate, writing a genuinely dishonest collapse in its place, and
 * watching the gate stay green — the `expect` list saw the same string at a different site.
 *
 * ⚡ **The reasons argued about a SITE — what the value does next — and no text pin carries a location.**
 * So rather than build a cleverer pin, the two sites were branched on `null` explicitly (one line each) and
 * the exemption deleted. **A ban has nothing to game.**
 *
 * ⚠️ **Adding an entry here re-opens `R10` by construction.** If a genuinely honest collapse ever appears,
 * branch on the null instead — that is what both of these did, at a cost of one line.
 */
const ALLOWED: Record<string, { expect: string[]; why: string }> = {};

/**
 * ⛔ **THE BAN IS ENFORCED, NOT MERELY DESCRIBED** — [class-1 re-audit 3 · `T9`]. The docblock above says an
 * entry here re-opens `R10`; a docblock is not a check. Both permission shapes tried were identity-free, so
 * the only durable state for this map is empty — and that is now asserted rather than asked for.
 */
if (Object.keys(ALLOWED).length > 0) {
  console.error(
    [
      '',
      '❌ amount-collapse: ALLOWED is not empty.',
      '  ⛔ R10 — a per-file COUNT ratchets against addition only, and a normalised EXPRESSION',
      '  STRING is the same text at a different site; the re-audit kept the gate green while substituting',
      '  a dishonest collapse for the permitted honest one. Branch on the null instead — one line.',
      '',
    ].join(String.fromCharCode(10)),
  );
  process.exit(1);
}

/** Whitespace-normalised, so a reflow of a permitted site is not read as a different site. */
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

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
 * ⛔ **THE POPULATION IS RATCHETED, because enumerating spellings is what keeps failing.**
 * [class-1 re-audit 6 `W2`]
 *
 * ⚡ `V1` widened the callee pattern to admit `?.(` and a generic argument list — and the enumeration
 * became the menu: **`parseAmountField(a)! ?? 0`** is a ONE-CHARACTER un-fix that walks straight past,
 * and so do `as number` and `satisfies`. **Third instance in this one matcher** (`T2`, `V1`, now this),
 * which is Law II: *any enumerated list becomes the list somebody orders from.*
 *
 * ⚠️ So rather than extend the list a fourth time, the COUNT OF CALLS FOUND is pinned. Any spelling
 * that removes a call from the population moves this number — whatever the spelling turns out to be —
 * and the gate reds asking why, instead of printing a smaller count beside a tick. Same instrument
 * `check-rounding` already carries, and `D5-9`'s lesson: a count with slack cannot see a member leave.
 */
let parserCalls = 0;

/**
 * ⛔ **THE SCAN IS NOT PER PHYSICAL LINE** — pass-7 `D1-3`. `COLLAPSE` used to run against
 * `text.split('\n')`, so a call Prettier had wrapped left the population entirely while this gate printed
 * a smaller count beside a ✅. That is pass-5 `D5-9`'s escape, **in a gate written after `D5-9` was
 * fixed** — the lesson lived in `check-cap-literals`'s docblock instead of in the shared helper.
 *
 * ⛔ **AND EVERY SITE, NOT THE FIRST** — pass-7 `D1-4`. The loop `break`'d on the first hit per file, so a
 * second collapse in the same file was invisible and `found` under-counted.
 */
const perFile = new Map<string, string[]>();
for (const rel of tracked) {
  const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
  // ⚠️ `scanned` counts NON-BLANK lines, so it must keep seeing the STRIPPED text: handing it the raw
  // source counts comment lines as read and inflates the floor — measured, 60,671 → 95,693 — which blunts
  // the one instrument that notices this gate going blind.
  scanned(SCAN_GATE, stripCommentsOnly(src));
  /**
   * ⛔ **NOTHING REWRITES THE SOURCE** — pass-7 `D1-3`, corrected three times before it was right. Joining
   * physical lines reported every hit at the statement's first line and merged unrelated statements
   * (`R3`/`R4`); flattening in place was measured **inert** (`N-1`); a `[^;{}]` bound merged siblings across
   * a comma and hid calls behind a brace (`T2`/`T3`). The call is found by balancing its parentheses.
   *
   * ⚠️ **Strings are NOT blanked** (`R5`): `stripCommentsAndStrings` blanks `${…}` interpolations, which
   * are code, so a collapse inside a template literal was caught before the v1 fix and invisible after it.
   */
  const code = stripCommentsOnly(src);
  const lines = lineMap(code);
  /**
   * ⛔ **THE CALL IS BALANCED, NOT BOUNDED** — [class-1 re-audit 3 · `T2` `T3`]. `[^;{}]` stopped at a
   * brace, so `parseAmountField({ raw }) ?? 0` and a `${…}` interpolation inside the arguments were
   * invisible — **re-opening `R5` in the round that certified it closed** — and it did not stop at a comma,
   * so two correct sibling arguments merged into one reported defect. A call ends at its matching `)`, and
   * that is not a thing to approximate.
   */
  for (const call of findCalls(code, PARSER_CALL)) {
    parserCalls++;
    // ⛔ `V1` — `(parseAmountField(x)) ?? 0` put a `)` between the call and the `??`, and `AFTER` is
    // anchored. `afterEnclosingGroups` looks through GROUPING parens only, so `wrapper(parse(x)) ?? 0`
    // still does not match — that collapses wrapper's result, and reporting it would be the noisy
    // direction, which this gate has no escape route for.
    if (!AFTER.test(afterEnclosingGroups(code, call.argsEnd))) continue;
    const m = { index: call.index, 0: `${code.slice(call.index, call.argsEnd + 1)} ?? 0` } as unknown as RegExpMatchArray;
    found.push(rel);
    perFile.set(rel, [...(perFile.get(rel) ?? []), norm(m[0])]);
    if (!(rel in ALLOWED)) {
      problems.push(
        // ⛔ `call.index`, not `m.index`: `m` is a hand-built `RegExpMatchArray` whose `index` is typed
        // `number | undefined`, and `typecheck:scripts` was RED on the committed tree because of it.
        `${rel}:${lines.lineAt(call.index)} collapses a parsed amount to 0.\n` +
          '        `null` is BLANK OR UNPARSEABLE, and neither is a payment of zero. Branch on it, or add\n' +
          '        branch on the `null` explicitly instead — one line, and it leaves nothing to game (R10).',
      );
    }
  }
}

/**
 * ⛔ **A FILE-GRANULAR PERMISSION WITH A LINE-SPECIFIC REASON IS A HOLE** — pass-7 `D1-4`. Each `ALLOWED`
 * entry argues why *one particular* collapse is honest; without pinning it, a SECOND collapse added to that
 * file later inherits the permission and is never reported.
 *
 * ⛔ **AND A COUNT IS NOT ENOUGH** — class-1 re-audit `R10`. The first fix pinned how MANY collapses a file
 * may hold, which ratchets against **addition only**: delete the permitted honest collapse, write a
 * dishonest one in its place, and the count is still 1 and the gate is still green. **What the reason
 * argues about is the EXPRESSION, so the expression is what is pinned.**
 *
 * ⚠️ Whitespace-normalised, so Prettier reflowing a permitted site is not read as a substitution.
 */
for (const [rel, entry] of Object.entries(ALLOWED)) {
  const got = (perFile.get(rel) ?? []).slice().sort();
  const want = entry.expect.map(norm).slice().sort();
  // ⚠️ Compared as JSON so there is no separator to collide with the expressions themselves.
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    problems.push(
      `${rel}'s collapses are not the ones ALLOWED argues for.\n` +
        `        permitted: ${JSON.stringify(want)}\n` +
        `        found    : ${JSON.stringify(got)}\n` +
        '        The reason on file argues about a SPECIFIC expression. A different one is not covered by\n' +
        '        it, however many there are. Branch on the null, or pin the new expression with its reason.',
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

/**
 * ⚠️ **PINNED with `!==`, not floored** — the `D5-9` idiom. A floor sees the population collapse; it
 * cannot see ONE member walk away, which is exactly what a new callee spelling does. Move it in the same
 * edit that adds or removes a real call site.
 */
const MIN_PARSER_CALLS = 31;
if (parserCalls !== MIN_PARSER_CALLS) {
  problems.push(
    `${parserCalls} parser call(s) found; MIN_PARSER_CALLS is ${MIN_PARSER_CALLS}, and this is PINNED.\n` +
      (parserCalls < MIN_PARSER_CALLS
        ? '        ⛔ W2 — a call LEFT the population. Either a site was deleted, or a spelling stopped\n' +
          '        matching: `!`, `as number`, `satisfies`, a new wrapper. The second is a silent un-fix\n' +
          '        for the whole D1-3 family, and it is why this is a pin rather than another enumeration.'
        : `        A call site was added: raise MIN_PARSER_CALLS to ${parserCalls} in the same edit.`),
  );
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
