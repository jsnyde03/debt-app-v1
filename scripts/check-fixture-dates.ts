/**
 * S1.13.7.1 [pass-6 `A1-4` · `A1-5`] — **A CALENDAR LITERAL IN A FIXTURE IS A FUSE, AND IT BURNS SILENTLY.**
 *
 * ⛔ **The measured defect.** `apps/rn/tests/e2e/helpers/seed.ts` wrote `dueDate: '2026-07-01'` on the
 * default debt **and** the default bill. Those are the values `scenario()` returns, so **43 of 63 spec
 * files inherited them** — and by 2026-08-31 the date was 61 days past, `isOverdue` was `true`, and every
 * one of those specs had been silently driving the **overdue** branch since July. The on-track branch of
 * the shared default was guarded by nobody. Nothing went red; the branch simply changed underneath.
 *
 * ⚡ **The file warned about this class 50 lines below the two literals that caused it**, naming the next
 * expiry by date: *"nine other specs were queued to do the same thing on 2026-09-01."*
 *
 * ⚠️ **AND THE FINDING'S STATED MECHANISM WAS WRONG, WHICH IS WHY THIS GATE COUNTS RATHER THAN TRUSTS.**
 * `A1-4` says the `day()` sweep *"fixed `nextPaycheckDate` and never touched `dueDate`."* Measured:
 * **`dueDate: day(…)` appears 87 times.** The sweep did reach the field — it converted 87 sites and left
 * 85, including the shared default. A half-finished sweep looks exactly like one that never started, from
 * inside the files it did not reach. *(Law IV: a finding that arrives with a mechanism still needs
 * measuring — the recommendation was sound and the mechanism was not.)*
 *
 * ## The two refusals, and why they are different questions
 *
 * ⛔ **IMMINENT — always fatal, never capped.** A literal on an aging field that is in the future but
 * within `IMMINENT_DAYS` is a fuse with a lit match: the branch it exercises is about to change without a
 * line of test code changing. This is the half that fires **before** the damage, which is the whole point
 * — `A1-5` was found two days before its date, by a human-run audit, and there is no reason to depend on
 * that again.
 *
 * ⚠️ **AGED — capped, downward-only.** A literal already in the past has already changed branch. There are
 * many, they are not all wrong (a spec that WANTS an overdue row is correct to have one), and converting
 * them blind is how a remedy introduces the defect it describes. So the count is pinned and may only fall.
 * ⛔ **The cap is a number, not a list** — a list of exempt sites is an enumeration, and enumerations have
 * undercounted this class every time this project has measured one.
 *
 * ⛔ **THE FLOOR, AND IT IS HERE BECAUSE THE LAST INSTRUMENT SHIPPED WITHOUT ONE.** Pass 6's `D2-3`: the
 * route's exit assertion filtered by the predicate under test, so blinding that predicate collapsed the
 * population 446 → 72 and the check still exited 0. If this file's population goes empty — a moved test
 * root, a changed extension, a broken glob — then `aged` is 0, `imminent` is 0, and a gate that scanned
 * nothing reports the tree clean. `MIN_TEST_FILES` is what makes that red instead.
 *
 * Usage: npm run lint:fixture-dates
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';
import { lineMap } from './lib/logicalLines';
import { stripCommentsOnly } from './lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '..');

/**
 * ⛔ **[GAP-8] MEASURED FAILING OPEN, NOT ASSUMED.** This gate strips comments before matching, and
 * `lint:scan-floors` demanded a floor for it the moment it started doing so. The probe
 * (`class1-probes/p5-blanked-stripper.mjs`) ran it against a stripper that blanks everything: it printed
 * **`0 imminent fuses`** and exited **0** — a gate that read nothing reporting the tree clean, which is
 * precisely the shape `A1-4` shipped. `MIN_TEST_FILES` does not cover it: the population stays full while
 * every literal inside it disappears.
 */
const SCAN_GATE = 'fixture-dates';

/**
 * ⚠️ Downward-only. Lowering it is a fix; raising it is re-opening `A1-4`. Measured 2026-08-31 after the
 * shared default and the imminent fuses were converted.
 *
 * ⚡ **121 → 120 at S1.13.7.12.6.** Not a code change: the scan stopped counting calendar literals written
 * **inside comments**. The v1 fix read the source with comments intact (`keepComments`), so a date in a
 * docblock counted as an aged fixture — and the class-1 re-audit's `R7` showed a comment could also supply
 * the aging KEY for a literal below it. Blanking comments for matching drops both, and the number falls
 * with them. `pinned` moved 129 → 127 for the same reason.
 */
const MAX_AGED_FIXTURE_DATES = 120;

/** A fuse this close to firing is refused outright — see the docblock. */
const IMMINENT_DAYS = 21;

/**
 * ⛔ The fail-open floor. 33 test files carried a literal when this was written and 34 already used
 * `day()`; the population is every test-shaped file, which is far larger. A collapse below this means the
 * scan, not the tree, changed.
 */
const MIN_TEST_FILES = 150;

function die(msg: string): never {
  console.error(`\n❌ fixture-dates: ${msg}\n`);
  process.exit(1);
}

const tracked = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * ⚠️ **Test-shaped is a PATTERN, not a directory list.** `audit-route.ts`'s header records why: a
 * hand-typed route named 118 of the 331 files it was routing. A new test root added tomorrow is covered
 * by this and would be invisible to a list.
 */
const isTestShaped = (f: string): boolean =>
  /(^|\/)tests?\//.test(f) || /\.(test|spec|shot)\.tsx?$/.test(f) || /(^|\/)testing\//.test(f) || f.includes('__fixtures__');

const testFiles = tracked.filter((f) => isTestShaped(f) && /\.(ts|tsx|mjs|cjs)$/.test(f));

if (testFiles.length < MIN_TEST_FILES) {
  die(
    `only ${testFiles.length} test-shaped file(s) found, and the floor is ${MIN_TEST_FILES}.\n` +
      '  ⛔ The scan has gone blind, so "0 fuses" would mean "nothing was looked at" — not "clean".',
  );
}

/**
 * ⚠️ A field whose value is COMPARED TO NOW is what ages. Matched by shape — `…Date`, `…At`, `…AsOf` —
 * rather than by a list of the eight names that happen to exist today.
 */
/**
 * ⛔ **`:` OR `=`** — pass-7 `D1-7`. The key had to be an OBJECT KEY, so a fuse assigned to a variable
 * (`const plantedDueDate = '2026-09-10';` then `{ dueDate: plantedDueDate }`) was read, matched, and then
 * filed under `non-aging` — **the one bucket this gate never refuses**. That is worse than a population
 * hole: the escape is reported as a feature, on the line that says `0 imminent fuses`.
 *
 * ⚠️ **`(?<![=!<>])` keeps a COMPARISON out** — `x.dueDate === '2026-09-10'` asserts against a date, it
 * does not create a fuse, and reddening on assertions is what would train people to exempt-and-move-on.
 */
const AGING_KEY = /([A-Za-z_]*(?:Date|At|AsOf))\s*(?::|(?<![=!<>])=)\s*$/;
const LITERAL = /'(\d{4})-(\d{2})-(\d{2})'/g;

const today = new Date();
today.setHours(0, 0, 0, 0);
const DAY_MS = 86_400_000;

interface Hit {
  file: string;
  line: number;
  date: string;
  key: string;
  days: number;
}
const aged: Hit[] = [];
const imminent: Hit[] = [];
let nonAging = 0;
let pinned = 0;

/**
 * ⛔ **A LITERAL IS ONLY A FUSE IF IT IS COMPARED TO THE REAL CLOCK — and the first cut of this gate
 * missed that, which would have made it a remedy that introduces the defect it describes.**
 *
 * ⚡ Measured on `apps/rn/src/store/affordability.test.ts`: it pins `currentDate: '2026-08-01'` beside
 * `nextPaycheckDate: '2026-09-01'` and `dueDate: '2026-08-10'`. Every comparison in that file is between
 * two fixed dates, so **nothing ages** — and "converting" it to `day(n)` would have swapped a
 * deterministic test for one that drifts, breaking the assertions on the way past. That is the shape
 * pass 5 measured five times: *the stated remedy would have introduced the defect it described.*
 *
 * A file that pins `currentDate` to a literal has chosen its own clock. Its dates are reported and never
 * refused. ⚠️ The check is per FILE rather than per fixture — coarse, and deliberately so in the
 * over-inclusive direction: refusing a deterministic test is a false alarm that trains people to
 * exempt-and-move-on, which is worse than missing one.
 */
const CLOCK_PIN = /currentDate\s*:\s*'\d{4}-\d{2}-\d{2}'/;

for (const f of testFiles) {
  let text: string;
  try {
    text = readFileSync(join(REPO_ROOT, f), 'utf8');
  } catch {
    continue;
  }
  /**
   * ⛔ **THE EXEMPTION IS READ PER PHYSICAL LINE, AND THE MATCHING IS DONE ON FLATTENED, COMMENT-BLANKED
   * TEXT.** Both halves were wrong in the first fix, and the class-1 re-audit measured both:
   *
   * - `R6` — the exemption was tested against the whole JOINED statement, so **one `fixture-date-ok:`
   *   comment silenced every literal in that statement**: a live 8-day fuse sat beside an exempted one and
   *   the gate printed `0 imminent fuses`. That is a REGRESSION past the original defect, not a miss.
   * - `R7` — with comments kept, **a comment could supply the aging key** for a literal on a later line.
   *
   * ⚠️ So the source is read twice, deliberately: `srcLines` for the exemption (a comment beside the
   * literal it excuses), and the flattened comment-blanked text for the key and the literal.
   */
  const srcLines = text.split('\n');
  const code = scanned(SCAN_GATE, stripCommentsOnly(text));
  const lines = lineMap(code);
  /**
   * ⛔ **THE CLOCK PIN IS READ FROM CODE, NOT FROM PROSE** — [class-1 re-audit `N-2`]. `CLOCK_PIN` was
   * tested against the RAW source, so a `currentDate: '…'` written inside a **comment** pinned the whole
   * file and every calendar fuse in it was filed under `pinned` — the one bucket, with `non-aging`, that
   * is reported and never refused.
   *
   * ⚡ **It had a live instance**: `apps/rn/tests/e2e/bnpl.spec.ts` was pinned solely by a docblock
   * *describing a pin it had removed*. The one file whose prose narrates this exact time bomb is the file
   * the gate had stopped watching.
   */
  const isPinned = CLOCK_PIN.test(code);
  for (const m of code.matchAll(LITERAL)) {
    const i = lines.lineAt(m.index) - 1;
    // ⚠️ An exemption is per-line and must say why — the same idiom `secrets-exemptions.json` uses,
    // except inline, so the reason sits beside the literal rather than in a file nobody opens.
    if (/fixture-date-ok:/.test(srcLines[i] ?? '')) continue;
    {
      // The key must sit immediately before the literal; AGING_KEY is `$`-anchored, so a short window is
      // enough and keeps this O(1) per match rather than O(file).
      const before = code.slice(Math.max(0, m.index - 160), m.index);
      const key = AGING_KEY.exec(before)?.[1] ?? '';
      if (!key) {
        nonAging += 1;
        continue;
      }
      if (isPinned) {
        pinned += 1;
        continue;
      }
      const when = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
      const days = Math.round((when.getTime() - today.getTime()) / DAY_MS);
      const hit: Hit = { file: f, line: i + 1, date: `${m[1]}-${m[2]}-${m[3]}`, key, days };
      if (days < 0) aged.push(hit);
      else if (days <= IMMINENT_DAYS) imminent.push(hit);
    }
  }
}

/**
 * ⛔ The half that fires BEFORE the damage. Never capped: one imminent fuse is a build failure, because
 * the alternative is finding out from a branch that changed on its own.
 */
if (imminent.length > 0) {
  console.error(`\n❌ fixture-dates: ${imminent.length} calendar literal(s) cross into the past within ${IMMINENT_DAYS} days.\n`);
  for (const h of imminent) {
    console.error(`  ${h.file}:${h.line}  ${h.key}: '${h.date}'  — fires in ${h.days} day(s)`);
  }
  console.error(
    '\n  ⛔ On that date the branch these fixtures exercise changes, silently, with no code edit.\n' +
      "  Replace with `day(n)` from `apps/rn/tests/e2e/helpers/seed.ts` — a NEGATIVE n keeps an overdue\n" +
      '  fixture overdue forever, a positive n keeps a future one future. Both are stable under the clock.\n' +
      '  If the exact calendar date is the subject of the test, append `// fixture-date-ok: <why>`.\n',
  );
  process.exit(1);
}

if (aged.length > MAX_AGED_FIXTURE_DATES) {
  console.error(
    `\n❌ fixture-dates: ${aged.length} already-past calendar literal(s) on aging fields, and the cap is ${MAX_AGED_FIXTURE_DATES}.\n`,
  );
  for (const h of aged.slice(0, 40)) console.error(`  ${h.file}:${h.line}  ${h.key}: '${h.date}'  — ${-h.days} day(s) past`);
  console.error(
    '\n  ⛔ The cap is DOWNWARD-ONLY. A new past-dated fixture literal re-opens A1-4, where 43 of 63 specs\n' +
      '  silently changed branch. Convert to `day(n)` rather than raising this number.\n',
  );
  process.exit(1);
}

const observedScan = assertScanFloor(SCAN_GATE);
console.log(
  `✅ fixture-dates: ${testFiles.length} test-shaped file(s) scanned · 0 imminent fuses · ` +
    `${aged.length} aged literal(s) on aging fields (cap ${MAX_AGED_FIXTURE_DATES}, downward-only) · ` +
    `${pinned} in clock-pinned files (deterministic) · ${nonAging} on non-aging fields.`,
);
// ⚠️ Printed on the GREEN path deliberately: the aged count is the backlog this gate exists to drain, and
// a number nobody sees is a number nobody lowers.
