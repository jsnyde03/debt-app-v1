/**
 * ⛔ **S1.13.7.11 [pass-6 `A3-3`] — A STORE ACTION MAY NOT EDIT A ROW BY ID WITH A BARE `.map`.**
 *
 * ⚡ **Why this is a gate and not eight edits.** `A3-3` reported two sites — `markExpensePaid` and
 * `deferExpense`. There were **eight**: those two plus `setDeferability`, `markDebtMinimumPaid`,
 * `updateExpense`, `updateGoal`, `updateLivingExpense` and `verifyDebtBalance`. Every count of a class in
 * this repo has come in short, including the ones taken while deliberately trying not to, and the standing
 * rule is *budget the enumeration, not the list*. A ninth is one paste away; this is what sees it.
 *
 * ⛔ **The defect the shape carries.** `list.map(x => x.id === id ? patch(x) : x)` over an array holding no
 * such id returns a NEW, element-wise identical array. `set` fires, every subscriber re-renders, and no
 * return value distinguishes a miss from a hit — so the user taps, the row does not change, and nothing
 * anywhere says why. `A3-2` was the live instance and was invisible for exactly this reason.
 *
 * ⚡ **And it was load-bearing for a SECOND guard.** `realWriteGuard` refuses a real-store write from
 * inside a sandbox by DIFFING the store, so an unmatched write used to be refused only because the copied
 * array changed reference. `updateById` returning the original array on a miss removes that accident —
 * which is why the actions must also skip the write, and why `realWriteGuard.test.ts` now aims its
 * refusal case at an id the real plan genuinely holds. *"What actually holds the line is an unrelated
 * flag"* is `B2-1`, one file over.
 *
 * ⚠️ **A `.find` is exempt and a `.map` is not**, because the question is whether the action can tell a
 * miss from a hit. `updateDebt` looks its row up first and branches on `existing`; that is the same
 * property spelled differently, so its one comparison stays.
 *
 * Usage: npm run lint:store-id-writes
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';
import { stripCommentsOnly } from './lib/stripCode';
import { lineMap } from './lib/logicalLines';

const REPO_ROOT = join(import.meta.dirname, '..');

/**
 * ⛔ **[GAP-8] A GATE THAT STRIPS CAN REPORT A PASS WHILE READING NOTHING.** Registered with
 * `lint:scan-floors` so a scan that suddenly reads zero bytes reds rather than reporting a clean tree.
 */
const SCAN_GATE = 'store-id-writes';

/** The owner every id-keyed row edit must go through. */
const OWNER = 'packages/core/utils/updateById.ts';

/** `x.id === id` — the comparison, however the row variable is spelled. */
const BY_ID = /\b\w+\.id\s*===\s*id\b/;
/** A lookup is allowed: it can branch on the result, which is the property this gate is about. */
const BY_ID_G = new RegExp(BY_ID.source, 'g');
const IS_LOOKUP = /\.(find|findIndex|some|filter)\s*\(/;

/**
 * ⛔ **A DIRECTORY WALK, NOT `git ls-files` — AND THE PLANT IS WHY.** The first cut of this gate took its
 * population from the index, and `test:gate-plants` measured it **`planted=exit 0`**: the scenario's file
 * is untracked, so the gate never read it and printed a clean tree over the exact defect it names.
 * ⚠️ Not only a harness artifact — **a store file is untracked until someone runs `git add`**, so the
 * window in which a new bare id write is easiest to catch is precisely the window an index-derived
 * population is blind to. `check-cap-literals` carries the same correction in its own header, and this
 * gate reproduced it on its first run rather than inheriting the lesson.
 */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(abs));
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')) {
      out.push(relative(REPO_ROOT, abs).split(sep).join('/'));
    }
  }
  return out;
}
const tracked = walk(join(REPO_ROOT, 'apps/rn/src/store'));

const sites: string[] = [];
for (const rel of tracked) {
  const code = scanned(SCAN_GATE, stripCommentsOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')));
  const map = lineMap(code);
  /**
   * ⛔ **THE TWO PATTERNS ARE JUDGED OVER THE SAME STATEMENT, NOT THE SAME PHYSICAL LINE.**
   * [class-1 re-audit `N-5`]
   *
   * `BY_ID` says "this compares an id" and `IS_LOOKUP` says "…as part of a find/filter, which is fine".
   * Requiring both on one line meant **Prettier wrapping an ordinary `findIndex` split them**, so the
   * exemption vanished and correct code redded — at `MAX_BARE_ID_WRITES = 0`, with no allow-list, so the
   * only ways out were to un-wrap the code or weaken the gate.
   *
   * ⚠️ This is class 1's NOISY direction, and it is the one with no escape route. The blind direction
   * lets a defect through; this one makes a formatter's ordinary output unshippable.
   */
  for (const m of code.matchAll(BY_ID_G)) {
    const before = code.lastIndexOf(';', m.index);
    const openBrace = code.lastIndexOf('{', m.index);
    const closeBrace = code.lastIndexOf('}', m.index);
    const start = Math.max(before, openBrace, closeBrace) + 1;
    const endCandidates = [code.indexOf(';', m.index), code.indexOf('{', m.index), code.indexOf('}', m.index)]
      .filter((n) => n !== -1);
    const end = endCandidates.length ? Math.min(...endCandidates) : code.length;
    const statement = code.slice(start, end);
    if (IS_LOOKUP.test(statement)) continue;
    sites.push(`${rel}:${map.lineAt(m.index)}: ${statement.replace(/\s+/g, ' ').trim().slice(0, 110)}`);
  }
}

const observed = assertScanFloor(SCAN_GATE);

/**
 * ⛔ **DOWNWARD-ONLY.** Raising this to make a run pass is the defect the ratchet exists to catch. There is
 * no legitimate remaining site: every row edit goes through `updateById`, and every lookup uses `.find`.
 */
const MAX_BARE_ID_WRITES = 0;

if (sites.length > MAX_BARE_ID_WRITES) {
  console.error(
    `\n❌ store id writes: ${sites.length} bare \`x.id === id\` comparison(s) outside a lookup; the cap is ${MAX_BARE_ID_WRITES} and it only goes DOWN.\n`,
  );
  for (const s of sites) console.error(`  ${s}`);
  console.error(
    `\n  ⛔ Use \`updateById\` from ${OWNER}. It reports whether a row MATCHED, and returns the original\n` +
      '  array by reference when none did — so the action can skip the write instead of firing `set` over\n' +
      '  an element-wise identical copy. [S1.13.7.11 · pass-6 A3-3]\n',
  );
  process.exit(1);
}

console.log(
  `✅ store id writes: no bare id-keyed row edits across ${tracked.length} store file(s); \`updateById\` is the owner. ${scanNote(SCAN_GATE, observed)}`,
);
