/**
 * Month-arithmetic guard — bans stepping a calendar date by months with `setMonth`.
 *
 * `d.setMonth(d.getMonth() + n)` does not mean "n months later". When the target month is shorter than
 * the day being carried, JS normalises the overflow FORWARD: Jan 31 + 1 month is Mar 3. Every screen
 * that prints month-and-year then shows a DIFFERENT month, always later than the truth — the debt-free
 * hero, the chart's end pill and legend, the scrub readout, the payoff schedule rows, the forecast month
 * labels and the onboarding default due date all did.
 *
 * ⚠️ This is a gate rather than a fix because the class has now been enumerated short TWICE. The clamp
 * existed, correct and tested, in the rollover path while the projection paths carried the raw form; the
 * audit that found it named two sites, the plan that scheduled the fix named five files, and the sweep
 * found seven sites in six files. A person does not know where the call sites are. A query does.
 *
 * `@core/utils/addMonths` is the owner: `addMonthsToDate` · `addMonthsISO`.
 *
 * ⚠️ `setFullYear` carries the same trap for Feb 29 and is banned with it. There are no sites today —
 * it is here so the first one written is refused rather than discovered later on a leap year.
 *
 * ⛔ Deliberately NOT banned: `setDate`. Day arithmetic does not overflow — `setDate(getDate() + 7)` is
 * the correct way to add a week, and `addMonths` itself uses `setDate` to land the clamped day.
 *
 * Usage: tsx scripts/check-month-arithmetic.ts
 */
import { stripCommentsAndStrings } from './lib/stripCode';
// ⚠️ ALIASED — this gate already has a local `scanned` holding a FILE count; the import counts LINES.
import { assertScanFloor, scanNote, scanned as scanLines } from './lib/scanFloor';

/** GAP-8 — this gate's key in scripts/gate-scan-floors.json. */
const SCAN_GATE = 'month-arithmetic';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

import { findCalls, lineMap } from './lib/logicalLines';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [
  join(REPO_ROOT, 'packages', 'core'),
  join(REPO_ROOT, 'apps', 'rn', 'src'),
  join(REPO_ROOT, 'apps', 'rn', 'tests'),
  join(REPO_ROOT, 'scripts'),
  // [S0.2] `apps/rn`'s three playwright configs sat outside every root above.
  join(REPO_ROOT, 'apps', 'rn', 'playwright.config.ts'),
  join(REPO_ROOT, 'apps', 'rn', 'playwright.embed.config.ts'),
  join(REPO_ROOT, 'apps', 'rn', 'playwright.shots.config.ts'),
];

/**
 * ⛔ **THE LEGACY ROOT SURFACE — SCANNED, REPORTED, NOT FAILED, AND THE EXEMPTION SELF-RETIRES.**
 *
 * [P6.8.9.7.11.17 · B] measured **2 live unconverted sites** here — `components/AmortizationCalendar.tsx`
 * and `components/Onboarding/FirstDebtOrBillStep.tsx` — in a tree **P6.11 deletes outright**. They are not
 * in `2.0.0`, so failing on them would block every other surface's gate run to fix code that is about to
 * cease existing.
 *
 * ⚠️ **But an exemption with no expiry is how a scope hole becomes permanent.** So the paths are asserted
 * to EXIST: when P6.11 deletes the tree, this gate **fails** until the entry is removed — the exemption
 * cannot outlive its reason, and nobody has to remember it.
 */
const PENDING_DELETION = [
  join(REPO_ROOT, 'app'),
  join(REPO_ROOT, 'components'),
  join(REPO_ROOT, 'lib'),
  join(REPO_ROOT, 'tests'),
];

/** The one module allowed to define the step. */
const EXEMPT = [join('packages', 'core', 'utils', 'addMonths.ts')];

/**
 * ⛔ **FIVE SPELLINGS, NOT ONE.** [P6.8.9.7.11.17 · B + E, independently] this gate matched `setMonth` and
 * `setFullYear` only. **Measured at S0.2 by printing the values, not by reading:**
 *
 * | spelling | Jan 31 + 1 month | matched before |
 * |---|---|---|
 * | `d.setMonth(d.getMonth() + 1)` | `2026-03-03` | ✅ |
 * | `new Date(y, m + 1, d.getDate())` | **`2026-03-03`** — identical | ❌ |
 * | `d.setUTCMonth(d.getUTCMonth() + 1)` | **`2026-03-03`** — identical | ❌ |
 * | `d.setFullYear(y + 1)` on Feb 29 | `2025-03-01` | ✅ |
 * | `new Date(y + 1, m, d.getDate())` on Feb 29 | **`2025-03-01`** — identical | ❌ |
 *
 * ⚡ **And the constructor form is the one the OWNER FILE demonstrates.** `addMonths.ts:25` is
 * `new Date(date.getFullYear(), date.getMonth() + months, 1)`. That is **safe** — day `1` cannot overflow,
 * which is exactly the trick that makes `addMonths` correct — but an author who reds on this gate opens the
 * owner module to learn the house form, and substituting `d.getDate()` for the `1` reproduces the original
 * blocker with the gate green. **Same shape as the bare-`announce` gate missing `announceForAccessibility?.(…)`:
 * the miss is the spelling a new author copies from the file they are told to copy.**
 *
 * ⛔ So the constructor check bans a stepped month/year **only when the day argument can overflow** — a
 * literal `0` or `1` is the sanctioned idiom and stays legal.
 */
const BANNED = /\.\s*(setMonth|setFullYear|setUTCMonth|setUTCFullYear)\s*\(/;

/**
 * ⛔ **THE DAY SLOT IS WHAT DECIDES, NOT THE MONTH SLOT — and the first cut of this got it wrong.**
 *
 * A `+`/`-` in the month slot alone flags correct code. Measured at S0.2, the widened check fired on 4
 * sites and **all 4 were false positives**:
 *
 * - `getNextPaycheckDate.ts:61,62,76` — `new Date(year, month + 1, clampDay(year, month + 1, payDay))`.
 *   `clampDay` is `Math.min(day, new Date(y, m + 1, 0).getDate())`, i.e. the day is **clamped to the
 *   target month before construction**. That is the same trick that makes `addMonths` correct.
 * - `DateField.tsx:41` — `new Date(y, m - 1, d)` parsing `YYYY-MM-DD`. `m - 1` is a **1-based to 0-based
 *   index conversion**, not a step by months.
 *
 * ⚡ **A gate that reds on correct code gets deleted rather than obeyed** — this file already says exactly
 * that about its own comment-stripping. So the discriminator is the DAY: the defect is *carrying a source
 * date's day across a month step*, whose signature is `getDate()` in the day slot —
 * `new Date(d.getFullYear(), d.getMonth() + n, d.getDate())`, the original blocker, verbatim.
 *
 * ⚠️ **Named residual, not hidden:** a day pre-extracted into a variable (`const day = d.getDate()` on an
 * earlier line, then `new Date(y, m + n, day)`) is NOT matched — there is no symbol table here. The
 * `setMonth` family ban above still covers the common spelling, and `addMonths` remains the owner.
 * **If that shape ever appears, this needs a real parser, not a wider regex.**
 *
 * ⛔ **This is NO LONGER a line-based gate, and the claim that it was cost it the wrapped spelling.**
 * [class-1 re-audit 3 · `T6`] The constructor check now runs over the whole stripped file via `findCalls`,
 * because Prettier wraps a three-argument constructor as a matter of course and the argument list **is**
 * the subject. Its census row had said the opposite, from reading rather than measuring.
 */
const DATE_CTOR = /new\s+Date\s*\(/g;
const DAY_CARRIES_SOURCE = /getDate\s*\(\s*\)/;

/** Split `new Date(` arguments at top level — nested calls like `d.getMonth()` must not split. */
function dateArgs(line: string, from: number): string[] | null {
  let depth = 0;
  const args: string[] = [];
  let cur = '';
  for (let i = from; i < line.length; i++) {
    const c = line[i];
    if (c === '(') { depth++; if (depth === 1) continue; }
    if (c === ')') { depth--; if (depth === 0) { args.push(cur); return args; } }
    if (c === ',' && depth === 1) { args.push(cur); cur = ''; continue; }
    cur += c;
  }
  return null; // unbalanced on this line — a multi-line call, not judged here
}

/**
 * ⛔ **A `getDate()` THAT IS AN ARGUMENT OF A CALL IS CLAMPED, AND THE GATE USED TO REFUSE IT.**
 * [class-1 re-audit 4 `U6`]
 *
 * ⚡ `getNextPaycheckDate.ts` uses `clampDay`, which this file's own docblock calls *"the same trick that
 * makes `addMonths` correct"*. Inline that trick — `Math.min(d.getDate(), lastDayOfTargetMonth)` — and
 * the gate redded, because `DAY_CARRIES_SOURCE` is a substring test with no notion of what encloses the
 * call. No cap, no allow-list, so correct code was simply unshippable.
 *
 * ⚠️ **The four non-defects the docblock already names are all avoided because the day slot is a bare
 * identifier or a helper CALL.** The shape it never considered is the clamp written INLINE, where
 * `getDate()` is present but bounded — which is the written definition of *"clamped to the target month
 * before construction"*.
 *
 * ⚠️ **The enclosing `(` must be preceded by an identifier character — a CALL, not a grouping.** A bare
 * `(d.getDate())` is the same unclamped day wearing parentheses, and exempting it would be the blind
 * direction. `Math.min(`, `clampDay(`, `Math.max(` all qualify; `(` alone does not.
 */
/**
 * ⛔ **THE CALLEE, NOT THE PRESENCE OF ONE.** [class-1 re-audit 5 `V8`]
 *
 * ⚡ The first cut exempted a `getDate()` inside **any** call, and `U6`'s remedy as filed is where that
 * came from — *"an argument of `Math.min` **(or of any call)**"*. The parenthesis was the whole finding.
 * The docblock then argued for it by name — *"`Math.min(`, `clampDay(`, `Math.max(` all qualify"* —
 * **without noticing that `Math.max` does not clamp the direction this gate checks.** Measured, three
 * genuinely unclamped day slots passing:
 *
 * | day slot | before | now |
 * |---|---|---|
 * | `Math.max(1, d.getDate())` — guards the LOWER bound, overflows the upper | ✅ green | reds |
 * | `Number(d.getDate())` | ✅ green | reds |
 * | `__id(d.getDate())` | ✅ green | reds |
 * | `Math.min(d.getDate(), 28)` — the real clamp | green | green |
 *
 * `Math.max(1, …)` is the realistic one: guarding the lower bound is an ordinary thing to write and does
 * nothing about the overflow. **A contingent choice written in as a law — Law III.**
 */
const CLAMPING_CALLEE = /(?:^|[^\w$.])(?:Math\.min|[\w$]*clamp[\w$]*)$/i;

function clampedDay(day: string): boolean {
  const opens: number[] = [];
  for (let i = 0; i < day.length; i++) {
    if (day[i] === '(') opens.push(i);
    else if (day[i] === ')') opens.pop();
    else if (day.startsWith('getDate', i) && opens.length > 0) {
      // ⚠️ The text immediately before the innermost open paren IS the callee — a grouping paren has no
      // identifier there and is correctly not a clamp (`(d.getDate())` is the same unclamped day).
      if (CLAMPING_CALLEE.test(day.slice(0, opens[opens.length - 1]))) return true;
    }
  }
  return false;
}

/** `new Date(y, m ± n, day)` / `new Date(y ± n, m, day)` with a day that can overflow. */
function constructorOverflow(line: string): boolean {
  for (const m of line.matchAll(/new\s+Date\s*\(/g)) {
    const args = dateArgs(line, m.index + m[0].length - 1);
    if (!args || args.length < 3) continue;
    const [year, month, day] = args;
    // The step: a `+`/`-` offset in the month or year slot. The defect: an UNCLAMPED source day carried
    // into it. Both halves are required — see `DAY_CARRIES_SOURCE` for the four false positives that
    // proved the month slot alone is not enough.
    if (!DAY_CARRIES_SOURCE.test(day)) continue;
    // ⛔ `U6` — bounded by a call is CLAMPED, and this gate's own docblock endorses that idiom.
    if (clampedDay(day)) continue;
    if (/[+\-]/.test(month) || /[+\-]/.test(year)) return true;
  }
  return false;
}

const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.expo') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

/**
 * Comments are blanked, not matched — the files that explain this trap have to be able to NAME the
 * banned form, and a guard that reds on its own documentation gets deleted rather than obeyed. Line
 * numbers are preserved so a real hit still points at the right line.
 */
/**
 * ⛔ **THE SCANNER IS SHARED — this file used to hold a hand-written COPY.** [S0.8b · REVERIFY-2
 * finding 2] A duplicate cannot receive a fix to the original: the regex-literal handling added to
 * `lib/stripCode.ts` would not have reached this gate, which is the one the whole class was found on.
 * Comments are blanked rather than matched because this file has to be able to NAME the banned form.
 */

function scan(roots: string[], out: string[]): number {
  let n = 0;
  for (const root of roots) {
    const files = statSync(root).isDirectory() ? walk(root) : [root];
    for (const file of files) {
      const rel = relative(REPO_ROOT, file);
      if (EXEMPT.some((e) => rel === e)) continue;
      n++;
      const raw = readFileSync(file, 'utf8');
      const lines = raw.split(/\r?\n/);
      /**
       * ⛔ **NOT PER PHYSICAL LINE** — [class-1 re-audit 3 · `T6`]. This gate's census row claimed the
       * argument list *"is not part of the subject"*. **The subject IS the argument list**: the original
       * blocker is a `new Date(y, m + 1, 0)` whose overflow lives in the arguments, and Prettier wraps a
       * three-argument constructor as a matter of course — so the very spelling this gate exists to refuse
       * escaped it. A written reason is a claim, and this one was believed rather than measured.
       *
       * ⚠️ `BANNED` matches a method NAME and is safe per line, but `constructorOverflow` reads arguments,
       * so it runs over the whole stripped text with the offset mapped back to the real line.
       */
      const code = scanLines(SCAN_GATE, stripCommentsAndStrings(raw));
      const map = lineMap(code);
      code.split(/\r?\n/).forEach((line, i) => {
        if (BANNED.test(line)) out.push(`${rel}:${i + 1}: ${lines[i]?.trim() ?? ''}`);
      });
      for (const call of findCalls(code, DATE_CTOR)) {
        if (!constructorOverflow(`new Date(${call.args})`)) continue;
        const ln = map.lineAt(call.index);
        out.push(`${rel}:${ln}: ${lines[ln - 1]?.trim() ?? ''}`);
      }
    }
  }
  return n;
}

const hits: string[] = [];
const scanned = scan(ROOTS, hits);

// ⛔ The legacy tree: reported, not failed — and the exemption self-retires. See `PENDING_DELETION`.
const legacyHits: string[] = [];
const missingPending = PENDING_DELETION.filter((p) => !existsSync(p));
if (missingPending.length > 0) {
  console.error('\n❌ PENDING_DELETION names a path that no longer exists — P6.11 has run.\n');
  missingPending.forEach((p) => console.error(`  ${relative(REPO_ROOT, p)}`));
  console.error('\n  Delete the entry from check-month-arithmetic.ts. An exemption must not outlive its reason.\n');
  process.exit(1);
}
const legacyScanned = scan(PENDING_DELETION, legacyHits);

if (hits.length > 0) {
  console.error('\n❌ A date stepped by months with setMonth/setFullYear (overflows a short month forward):\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error('\nUse addMonthsToDate / addMonthsISO from @core/utils/addMonths — they clamp.');
  console.error('Jan 31 + 1 month is Feb 28, not Mar 3, and month-and-year output shows the difference.\n');
  process.exit(1);
}

if (legacyHits.length > 0) {
  console.log(
    `\n⚠️  legacy tree (${legacyScanned} files, P6.11 deletes it): ${legacyHits.length} unconverted site(s), reported not failed:`,
  );
  legacyHits.forEach((h) => console.log(`   ${h}`));
}

// ⛔ GAP-8 — assert the gate actually READ something before it is allowed to report a pass.
const observedScan = assertScanFloor(SCAN_GATE);
console.log(
  `✅ month arithmetic: ${scanned} files, no setMonth/setUTCMonth/setFullYear/setUTCFullYear and no ` +
    `overflowing \`new Date(y, m±n, day)\` outside ${EXEMPT.join(', ')}.` +
    scanNote(SCAN_GATE, observedScan),
);
