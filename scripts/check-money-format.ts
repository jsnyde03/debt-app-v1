/**
 * Money-formatter guard (T6.9 / audit L4-2) — keeps the app at TWO money formatters.
 *
 * ⛔ **Why this exists.** The audit found nine, six of them hand-rolled inside Today's cards. Four were
 * byte-identical copies of `function money(n)`; three had already drifted — `LeanSuggestionCard`'s
 * rendered `$-45` and `$NaN`, and `paywallLead`'s (behind the live public embed) had quietly dropped its
 * `Number.isFinite` guard. For positive whole values all nine agreed, so the divergence was latent and a
 * generated formatter audit that counts named exports could not see it. [D31]: a finding that becomes a
 * gate is paid for once.
 *
 * ⚠️ **It matches the BODY, not the name.** L4-2 said six and T1's surface inventory said seven; the real
 * count was nine, because `guardianSelectors.ts` built one inline with no function declaration to count.
 * A checker looking for `function money` would have missed exactly the one two instruments already had.
 *
 * The rule these collapse onto is stated once, in `@core/utils/formatCurrency`.
 *
 * Usage: tsx scripts/check-money-format.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
/** Both live trees. The legacy Next surface at the repo root dies at 5.5.1 and is deliberately out of scope. */
const ROOTS = [join(REPO_ROOT, 'packages', 'core'), join(REPO_ROOT, 'apps', 'rn', 'src')];

/**
 * The two sanctioned formatters own these shapes, so their own files are exempt.
 * `TrajectoryChart` is exempt with a REASON: `formatAxisBalance` abbreviates to `$4k` for axis ticks —
 * a genuinely different job, not a duplicate. Verified at T6.4; do not delete it as a stray.
 */
const EXEMPT = [
  join('utils', 'formatCurrency.ts'),
  join('utils', 'format.ts'),
  join('components', 'payoff', 'TrajectoryChart.tsx'), // compact axis labels ($4k) — a different job
];

/** A currency string being built by hand rather than by a formatter. */
const HAND_ROLLED: { pattern: RegExp; why: string }[] = [
  // `$${...}` inside a template literal — the shape every one of the nine used.
  { pattern: /\$\$\{\s*(Math\.round|Math\.floor|Math\.ceil|Math\.abs)/, why: 'a $-prefixed template around a rounded number' },
  // `'$' + n` concatenation.
  { pattern: /['"]\$['"]\s*\+/, why: "a '$' string concatenated onto a number" },
  // toLocaleString doing currency work outside the two owners.
  { pattern: /toLocaleString\([^)]*currency/i, why: 'an inline Intl currency call' },
  { pattern: /new Intl\.NumberFormat\([^)]*\)[\s\S]{0,120}?style:\s*['"]currency['"]/, why: 'an inline Intl currency formatter' },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}

/**
 * Strip comments — this file's own header quotes `$${Math.round(…)}` to explain what it bans, and so do
 * the fix comments left at the collapsed sites. Over-stripping can only cause a MISS, never a false
 * alarm, and a false alarm is what gets a checker disabled.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

const problems: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (EXEMPT.some((e) => file.includes(e))) continue;
    const rel = relative(REPO_ROOT, file);
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      for (const { pattern, why } of HAND_ROLLED) {
        if (pattern.test(line)) {
          problems.push(`  ${rel}:${i + 1}  ${why}\n      ${line.trim().slice(0, 100)}`);
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error(`\n❌ money-format: ${problems.length} hand-rolled money formatter(s).\n`);
  console.error(problems.join('\n'));
  console.error('\n  Use `formatWhole` (hero/summary figures) or `formatCurrency` (ledger rows).');
  console.error('  The rule is stated once, in `@core/utils/formatCurrency`.');
  console.error('  A genuinely different job (e.g. abbreviated axis ticks) goes in EXEMPT, with a reason.\n');
  process.exit(1);
}
console.log(`✅ money-format: no hand-rolled currency formatters (${HAND_ROLLED.length} shapes checked).`);
