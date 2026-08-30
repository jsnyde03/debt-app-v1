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

/** `Math.round(<anything> * 100) / 100`, with any spacing — the money-rounding idiom, however spelled. */
const ROUNDING = /Math\.round\([^;]*?\*\s*100\s*\)\s*\/\s*100/g;

const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  // The legacy root surface is deleted at 5.5.1; holding it to this would be spend on a tree that is going.
  .filter((rel) => rel.startsWith('apps/rn/') || rel.startsWith('packages/'));

const sites: string[] = [];
for (const rel of tracked) {
  if (rel === OWNER) continue;
  // Comments are blanked first: this file's own docblock quotes the expression it exists to count.
  const code = scanned(SCAN_GATE, stripCommentsOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')));
  for (const line of code.split('\n')) {
    ROUNDING.lastIndex = 0;
    if (ROUNDING.test(line)) sites.push(`${rel}: ${line.trim().slice(0, 100)}`);
  }
}

/**
 * ⛔ **DOWNWARD-ONLY, the `MAX_UNGUARDED` idiom.** Raising this to make a run pass is the defect the
 * ratchet exists to catch. Lower it in the same edit that removes a copy.
 */
const MAX_INLINE_ROUNDING = 93;

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
