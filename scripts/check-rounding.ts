/**
 * ⛔ **S1.12.5.6 [pass-5 `A5-4`] — ONE OWNER FOR ROUNDING MONEY, AND A CAP SO THE COPIES CANNOT GROW.**
 *
 * ⚡ `packages/core/utils/money.ts` exports `roundMoney`, and lane A found **eighteen private copies of
 * it** beside that owner — every body `Math.round(x * 100) / 100`, character for character. No live
 * defect: they agree today. It is filed because it is the exact shape this repo has paid for three times
 * in three passes — `A1`, `A2` and `A-F4` were each *"two producers of one fact"* — and
 * `cannotAmortize.ts` states the rule the fixing itself adopted: *"Every fix in this round has collapsed
 * a pair to a single producer rather than correcting the loser, because correcting the loser is what buys
 * the next round's recurrence."*
 *
 * ⛔ **AND LANE A'S COUNT WAS A LOWER BOUND, WHICH IT SAID.** It matched the literal string
 * `function roundMoney`, so a copy named `round2` — `computeDrift.ts` has exactly that — or one written
 * inline was invisible. *"What would make this checkable is a lint over the expression
 * `Math.round(… * 100) / 100` rather than over the identifier"* — this is that lint.
 *
 * ⚡ **THREE MEASUREMENTS OF ONE POPULATION, EACH LARGER THAN THE LAST.** Lane A's identifier scan said
 * **19**. A `git grep` on the expression said **67** — but `[^)]*` cannot cross a nested paren, so
 * `Math.round((before - held(goalId)) * 100) / 100` was invisible to it. This scan, which can, says
 * **93**. ⛔ Every count of this class has come in short, **including the two taken while deliberately
 * trying not to**. That is the argument for pinning the number rather than quoting it.
 *
 * ⚠️ **A CAP, NOT A BAN, and deliberately.** Collapsing 93 sites mechanically is what this repo's own
 * record warns about: a mechanical script once deleted 489 lines while reporting success, and three of
 * this session's own scripted edits did collateral damage before one worked. So the count is pinned
 * downward-only: **the copies cannot grow while the collapse is scheduled**, and every one removed
 * lowers the cap. That is lane A's own recommendation — *"the cheaper first move is the lint."*
 *
 * Usage: npm run lint:rounding
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';
import { stripCommentsOnly } from './lib/stripCode';
import { findCalls, lineMap } from './lib/logicalLines';

const REPO_ROOT = join(import.meta.dirname, '..');

/**
 * ⛔ **THE OWNER IS THE ONLY EXEMPTION.** Not a directory and not a list — one file, the one that exports
 * `roundMoney`. An exemption list is how a population stops being checkable, which is `D5-13` in this
 * same round.
 */
const OWNER = 'packages/core/utils/money.ts';

/**
 * ⛔ **[GAP-8] A GATE THAT STRIPS CAN REPORT A PASS WHILE READING NOTHING**, and `lint:scan-floors`
 * refused this file until it was wired — measured, on the first run after it was written. Its own count
 * being a downward-only cap does not protect it: a scan that suddenly reads zero files reports **fewer**
 * copies, which this gate would then ask someone to lower the cap to.
 */
const SCAN_GATE = 'rounding';

/**
 * `Math.round(<anything> * 100) / 100`, with any spacing — the money-rounding idiom, however spelled.
 *
 * ⛔ **THE `,?` IS LOAD-BEARING AND WAS MISSING** — found by `test:wrap-escapes` on its first run, not by
 * reading. Joining physical lines is only half of `D1-6`: **when Prettier wraps a call it also adds a
 * TRAILING COMMA**, so its real output is `Math.round(\n  x * 100,\n) / 100` and a pattern demanding
 * `* 100` immediately before `)` still misses it. The gate was green over the very spelling the fix was
 * written for.
 */
/** `Math.round(` — `findCalls` balances the rest, so nothing about the argument's shape is assumed. */
const ROUND_CALL = /Math\.round\s*\(/g;
/** The argument must END in `* 100` (Prettier may leave a trailing comma when it wraps). */
const ARG_TAIL = /\*\s*100\s*,?\s*$/;
/** …and the call must be divided by 100 immediately after. */
const AFTER_ROUND = /^\s*\/\s*100\b/;

const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  // The legacy root surface is deleted at 5.5.1; holding it to this would be spend on a tree that is going.
  .filter((rel) => rel.startsWith('apps/rn/') || rel.startsWith('packages/'));

const sites: string[] = [];
for (const rel of tracked) {
  if (rel === OWNER) continue;
  const source = readFileSync(join(REPO_ROOT, rel), 'utf8');
  // Comments are blanked first: this file's own docblock quotes the expression it exists to count.
  scanned(SCAN_GATE, stripCommentsOnly(source));
  /**
   * ⛔ **NOT PER PHYSICAL LINE** — pass-7 `D1-6`. `ROUNDING` was tested against one physical line, so a
   * wrapped `Math.round(\n  x * 100,\n) / 100` **grew the population without moving the number** — the cap
   * below stayed satisfied while the thing it caps went up. A ratchet that cannot see a new member is not
   * a ratchet.
   *
   * ⛔ **FLATTENED, NOT JOINED** — the class-1 re-audit's `R3` measured that joining reported **17 of 94
   * live sites at the wrong `path:line`, worst by 39 lines**, because a hit inside a joined statement was
   * blamed on the statement's first line. Flattening preserves length, so the offset is the match's own.
   */
  const code = stripCommentsOnly(source);
  const lines = lineMap(code);
  /**
   * ⛔ **BALANCED, NOT BOUNDED** — [class-1 re-audit 3 · `T2` `T3`]. `[^;{}]` stopped at a brace, so
   * `Math.round(fn({ a }) * 100) / 100` was invisible, and it did not stop at a comma, so two sibling
   * expressions merged. A call's extent is its matching paren, which is exact rather than approximate.
   */
  for (const call of findCalls(code, ROUND_CALL)) {
    if (!ARG_TAIL.test(call.args)) continue;
    if (!AFTER_ROUND.test(code.slice(call.argsEnd + 1))) continue;
    const text = code.slice(call.index, call.argsEnd + 1).replace(/\s+/g, ' ').trim();
    sites.push(`${rel}:${lines.lineAt(call.index)}: ${text.slice(0, 100)} / 100`);
  }
}

/**
 * ⛔ **DOWNWARD-ONLY, the `MAX_UNGUARDED` idiom.** Raising this to make a run pass is the defect the
 * ratchet exists to catch. Lower it in the same edit that removes a copy.
 *
 * ⚡ **93 → 94 at S1.13.7.12.6 [pass-7 `D1-6`], and this is the ONE sanctioned reason to raise it: the
 * instrument got sharper, the code did not change.** Two things moved together — the matcher now runs over
 * LOGICAL lines, and it counts **expressions** rather than matching physical lines. ⛔ **The delta was
 * measured before this number was touched, not after**
 * (`docs/audits/2026-09-02-s1-money-pass7/class1-probes/p4-rounding-delta.ts`): exactly one file moved,
 * `packages/core/testing/testFullAppRegression.ts` 3 → 4, and the new member is real —
 * **`:59`, a `Math.round(` wrapped onto three lines**, which is `D1-6`'s escape sitting in the tree.
 *
 * ⚠️ **A raise justified by "the gate changed" is the exact sentence a slackened ratchet would also carry**,
 * so the justification is a probe that names the site, not this comment.
 */
const MAX_INLINE_ROUNDING = 94;

if (sites.length > MAX_INLINE_ROUNDING) {
  console.error(
    `\n❌ rounding: ${sites.length} inline money-rounding expressions; the cap is ${MAX_INLINE_ROUNDING} and it only goes DOWN.\n`,
  );
  for (const s of sites.slice(0, 12)) console.error(`  ${s}`);
  console.error(
    `\n  ⛔ Import \`roundMoney\` from ${OWNER} instead. Two producers of one fact is the shape this repo\n` +
      '  has paid for three times — A1, A2 and A-F4 were each exactly that. [pass-5 A5-4]\n',
  );
  process.exit(1);
}

if (sites.length < MAX_INLINE_ROUNDING) {
  console.error(
    `\n❌ rounding: ${sites.length} inline expressions and the cap is still ${MAX_INLINE_ROUNDING}.\n` +
      `  Lower MAX_INLINE_ROUNDING to ${sites.length} in the same edit — a cap above its own count is slack\n` +
      '  the next copy hides in.\n',
  );
  process.exit(1);
}

const observedScan = assertScanFloor(SCAN_GATE);
console.log(
  `✅ rounding: ${sites.length} inline money-rounding expressions (cap ${MAX_INLINE_ROUNDING}, downward-only); ` +
    `\`roundMoney\` in ${OWNER} is the owner.${scanNote(SCAN_GATE, observedScan)}`,
);
