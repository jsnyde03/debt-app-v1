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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [
  join(REPO_ROOT, 'packages', 'core'),
  join(REPO_ROOT, 'apps', 'rn', 'src'),
  join(REPO_ROOT, 'apps', 'rn', 'tests'),
  join(REPO_ROOT, 'scripts'),
];

/** The one module allowed to define the step. */
const EXEMPT = [join('packages', 'core', 'utils', 'addMonths.ts')];

const BANNED = /\.\s*(setMonth|setFullYear)\s*\(/;

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
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1: string) => p1 + ' '.repeat(m.length - p1.length));
}

const hits: string[] = [];
let scanned = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    if (EXEMPT.some((e) => rel === e)) continue;
    scanned++;
    const raw = readFileSync(file, 'utf8');
    const lines = raw.split('\n');
    stripComments(raw)
      .split('\n')
      .forEach((line, i) => {
        if (BANNED.test(line)) hits.push(`${rel}:${i + 1}: ${lines[i]?.trim() ?? ''}`);
      });
  }
}

if (hits.length > 0) {
  console.error('\n❌ A date stepped by months with setMonth/setFullYear (overflows a short month forward):\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error('\nUse addMonthsToDate / addMonthsISO from @core/utils/addMonths — they clamp.');
  console.error('Jan 31 + 1 month is Feb 28, not Mar 3, and month-and-year output shows the difference.\n');
  process.exit(1);
}

console.log(`✅ month arithmetic: ${scanned} files, no setMonth/setFullYear outside ${EXEMPT.join(', ')}.`);
