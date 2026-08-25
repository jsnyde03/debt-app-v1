/**
 * Calendar-date guard — bans routing a `YYYY-MM-DD` through UTC.
 *
 * This app stores CALENDAR DATES, not instants: a due date, a payday and a cycle boundary are "the day
 * on the user's wall calendar". `toISOString().slice(0, 10)` converts to UTC first, and that has a
 * DIRECTION — east of UTC local midnight is the previous day, so every date it produced was a day early
 * for those users. The audit found it in the ROLLOVER, which advances every due date each cycle, so the
 * error re-applied and the whole plan walked backwards. West of UTC the mirror fires in the evening,
 * which is how a fixture can seed a different "today" at night than it did all afternoon.
 *
 * ⚠️ This is a SCRIPT and not only an ESLint rule because the linter cannot see where it matters most:
 * `apps/rn/eslint.config.mjs` puts `core/**` and `tests/**` outside its reach, and `packages/core` — the
 * engine, the rollover, the pay-cycle boundary — has no ESLint config of its own. A rule that covers the
 * screens but not the engine would have reported this class clean while its two worst sites shipped.
 *
 * `@core/utils/localDate` is the owner: `toLocalISODate` · `parseLocalDate` · `todayLocalISODate`.
 *
 * Usage: tsx scripts/check-local-dates.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [
  join(REPO_ROOT, 'packages', 'core'),
  join(REPO_ROOT, 'apps', 'rn', 'src'),
  join(REPO_ROOT, 'apps', 'rn', 'tests'),
];

/** The one module allowed to define the conversion. */
const EXEMPT = [join('packages', 'core', 'utils', 'localDate.ts')];

/**
 * `.slice(0, 10)` / `.substring(0, 10)` / `.split('T')[0]` off an ISO string — the three written forms
 * of the same conversion. Deliberately approximate: a caller that stores the ISO string first and slices
 * it two lines later is not expressible as a regex, so a green run is not proof the class is closed.
 */
const BANNED = /toISOString\(\)\s*\.\s*(slice|substring|substr)\s*\(\s*0\s*,\s*10\s*\)|toISOString\(\)\s*\.\s*split\(\s*['"]T['"]\s*\)\s*\[\s*0\s*\]/;

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

/**
 * ⚠️ **T8 / [T3.1 after-scan] — the hand-written LOCAL parse, `new Date(`${iso}T00:00:00`)`.**
 *
 * ⛔ **This is NOT the defect above. It is CORRECT** — it is precisely what you must write instead of the
 * UTC round-trip. The problem is only that it is written by hand while `parseLocalDate` exists to own it:
 * one rule, many owners, so a future change to how this app parses a calendar date would have to find
 * every site.
 *
 * ⚠️ **Baselined rather than swept, deliberately.** Rewriting correct call sites carries real regression
 * risk for zero user-visible gain, and the actual risk is GROWTH — one more. So the count is frozen below
 * and the gate fails only when it RISES. Burn-down is T10/Phase 6 work; the class cannot get worse in the
 * meantime. (Same shape as `duplicate-copy-baseline.json`.)
 *
 * ⛔ **The baseline RATCHETS DOWN.** Work that routes a hand-parse through the owner must lower it in the
 * same edit, or the ground it gained is silently re-spendable by the next author.
 */
const HAND_PARSE = /new Date\(\s*[`'"][^`'"]*\$\{[^}]*\}T00:00:00[`'"]\s*\)|new Date\(\s*[`'"][\d-]+T00:00:00[`'"]\s*\)/;
const HAND_PARSE_BASELINE = 41;

const hits: string[] = [];
let handParseCount = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    if (EXEMPT.some((e) => rel === e)) continue;
    const raw = readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/);
    stripComments(raw)
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (BANNED.test(line)) hits.push(`${rel}:${i + 1}: ${lines[i]?.trim() ?? ''}`);
        if (HAND_PARSE.test(line)) handParseCount++;
      });
  }
}

if (hits.length > 0) {
  console.error('\n❌ A calendar date routed through UTC (off by one east of UTC):\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error('\nUse toLocalISODate / parseLocalDate / todayLocalISODate from @core/utils/localDate.\n');
  process.exit(1);
}
if (handParseCount > HAND_PARSE_BASELINE) {
  console.error(
    `\n❌ local dates: ${handParseCount} hand-written \`T00:00:00\` parses, up from the baseline ${HAND_PARSE_BASELINE}.\n`,
  );
  console.error('  Use `parseLocalDate` from @core/utils/localDate — it owns this rule.');
  console.error('  (The existing sites are correct but hand-rolled; the baseline stops the class GROWING');
  console.error('   while T10/Phase 6 burns it down. Do not raise the baseline to make this pass.)\n');
  process.exit(1);
}
console.log(
  `✅ local dates: no UTC round-trips outside ${EXEMPT.join(', ')}` +
    ` · ${handParseCount}/${HAND_PARSE_BASELINE} hand-written local parses (not rising).`,
);
