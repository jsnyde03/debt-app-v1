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
import { stripCommentsOnly } from './lib/stripCode';
import { lineMap } from './lib/logicalLines';
import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';

/** GAP-8 — this gate's key in scripts/gate-scan-floors.json. */
const SCAN_GATE = 'local-dates';
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
/**
 * ⛔ **`,?` BEFORE EACH CLOSING PAREN** — [class-1 re-audit 3 · `N-4`]. Wrapping the CHAIN was only two
 * of the three spellings; when Prettier wraps the ARGUMENT LIST it also adds a trailing comma, so
 * `.slice(
  0,
  10,
)` still escaped. Same omission `check-rounding` had, in a second gate.
 */
const BANNED = /toISOString\(\)\s*\.\s*(slice|substring|substr)\s*\(\s*0\s*,\s*10\s*,?\s*\)|toISOString\(\)\s*\.\s*split\(\s*['"]T['"]\s*,?\s*\)\s*\[\s*0\s*\]/;

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
 * ⛔ **DELEGATES TO THE SHARED SCANNER.** [S0.8b · REVERIFY-2 finding 2] This file used to carry the
 * `(^|[^:])//` pair, whose `[^:]` lookbehind is a patch for `https://` and nothing else: a `//` inside
 * ANY other string still truncated the line and took real code with it. Six gates carried that pair
 * after the "fix" that named it — the fifth short enumeration in this cluster.
 *
 * ⚠️ `stripCommentsOnly`, not `stripCommentsAndStrings`: this gate reads what is INSIDE the strings.
 */
function stripComments(src: string): string {
  // ⛔ GAP-8 — count what actually survived the strip; a gate that reads nothing must not pass.
  return scanned(SCAN_GATE, stripCommentsOnly(src));
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
/**
 * ⚡ **39 → 43 at S1.13.7.12.6 [class-1 re-audit `N-4`], and the code did not change.** The scan counts
 * OCCURRENCES now rather than matching lines, because the same statement-bounded fix that made `BANNED`
 * see a wrapped method chain also stopped collapsing two hand-parses on one line into one.
 *
 * ⛔ **Measured before the number was touched:** per-line **39**, per-match **43**, and exactly **4 lines
 * carry two matches each** — `deriveRequiredActionView.ts`, `buildMultiCycleTimeline.ts`,
 * `guardianPredictionCore.ts`, `recoverySelectors.ts`. 39 + 4 = 43, with no remainder. ⚠️ Raising a
 * downward-only baseline is otherwise the defect it exists to catch; the justification is the arithmetic
 * above, not this sentence.
 */
const HAND_PARSE_BASELINE = 43;

/** `g`-flagged twins: `matchAll` requires it, and the originals stay for any single-shot `.test`. */
const BANNED_G = new RegExp(BANNED.source, 'g');
const HAND_PARSE_G = new RegExp(HAND_PARSE.source, 'g');

const hits: string[] = [];
let handParseCount = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    if (EXEMPT.some((e) => rel === e)) continue;
    const raw = readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/);
    /**
     * ⛔ **NOT PER PHYSICAL LINE** — [class-1 re-audit `N-4`]. `BANNED` matches a METHOD CHAIN
     * (`toISOString().slice(0, 10)`), and Prettier wraps a chain at the dot as a matter of course, so the
     * exact spelling this gate exists to refuse walked straight past it. ⚠️ The census row that had
     * exempted this file claimed it *"does not read call arguments"* — it reads both the arguments and the
     * chain, and the reason was simply wrong. **A written justification is a claim, and this one was not
     * measured before it was believed.**
     */
    const code = stripComments(raw);
    const map = lineMap(code);
    for (const m of code.matchAll(BANNED_G)) {
      const ln = map.lineAt(m.index);
      hits.push(`${rel}:${ln}: ${lines[ln - 1]?.trim() ?? ''}`);
    }
    for (const _m of code.matchAll(HAND_PARSE_G)) handParseCount++;
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
/**
 * ⛔ **[S1.10.6.5.8.5 · GAP-17] AND IT FAILS ON THE FALL TOO.** The check above is rise-only, so ground
 * gained here was silently **re-spendable**: burn three hand-parses down to 38, and the baseline still
 * reads 41 — leaving three units of headroom for someone to spend later with the gate green and nothing
 * objecting. ⚡ That is the same shape as a fabricated closure buying cap headroom in `check-audit-closure`.
 *
 * ⚠️ **Direction, stated because the rules require it:** the red here says *you improved this, record it*.
 * The opposite direction (the count rising) is the check above and means something entirely different.
 * Lowering the baseline is a **one-line deliberate edit** and is the correct response; there is no
 * response that leaves the number stale.
 */
if (handParseCount < HAND_PARSE_BASELINE) {
  console.error(
    `\n❌ local dates: ${handParseCount} hand-written \`T00:00:00\` parses — DOWN from the baseline ${HAND_PARSE_BASELINE}.\n`,
  );
  console.error('  This is good news the gate refuses to forget. Lower HAND_PARSE_BASELINE to');
  console.error(`  ${handParseCount} in scripts/check-local-dates.ts, or the ground you just gained stays`);
  console.error('  available for someone to spend later with this gate green.\n');
  process.exit(1);
}
// ⛔ GAP-8 — assert the gate actually READ something before it is allowed to report a pass.
const observedScan = assertScanFloor(SCAN_GATE);
console.log(
  `✅ local dates: no UTC round-trips outside ${EXEMPT.join(', ')}` +
    ` · ${handParseCount}/${HAND_PARSE_BASELINE} hand-written local parses (pinned, both directions).` +
    scanNote(SCAN_GATE, observedScan),
);
