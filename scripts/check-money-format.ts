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

import ts from 'typescript';

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

/**
 * ⛔ **Test harnesses are not a rendered surface.** The `testXxx.ts` files under `packages/core` build
 * assertion messages like "expected $100, got $90" by hand. They are never shown to a user, and reding
 * on them would get this checker disabled — the failure mode the header warns about.
 *
 * ⚠️ Do NOT write a glob with a double-star followed by a slash in this docblock: that sequence closes
 * the comment early, and the rest of the line is then parsed as code. Cost one run to find.
 */
const isTestHarness = (file: string) =>
  /(^|[\\/])test[A-Z][^\\/]*\.ts$/.test(file) ||
  file.endsWith('.test.ts') ||
  /[\\/]testing[\\/]/.test(file);

/** A currency string being built by hand rather than by a formatter. */
const HAND_ROLLED: { pattern: RegExp; why: string }[] = [
  // `$${...}` inside a template literal — the shape every one of the nine used.
  //
  // ⚠️ **P6.4.2 — this was ANCHORED ON A LIST OF FOUR ROUNDING CALLS and that is why it was green over
  // two live sites.** `buildGuardianBrief:141` wrote `$${Math.max(1, Math.round(v))…}`, so the first
  // identifier was `Math.max` and the pattern never fired; `Slider:97` wrote `$${value}` — a bare
  // identifier — and rendered `$1200` with no separator TO VOICEOVER, byte-for-byte the defect this
  // gate was created to catch. **A `$`-prefixed interpolation is hand-rolled money whatever is inside it.**
  { pattern: /\$\$\{/, why: 'a $-prefixed template interpolation (hand-rolled money)' },
  // Stripping a formatter's own symbol to re-add a literal one. It renders correctly TODAY and is exactly
  // what a currency change would miss, because the `$` is no longer the formatter's to control.
  { pattern: /\.replace\(\s*['"]\$['"]/, why: "a formatter's currency symbol stripped and re-added by hand" },
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

/**
 * ⛔ **JSX `$` + `{expr}` needs the AST — a regex physically cannot see it.**
 *
 * In JSX text, `$` is a literal character and `{` opens an expression, so `<Text>${value}</Text>` renders
 * `$1200`. In a template literal, `${` IS the interpolation syntax. **The two are byte-identical in
 * source**, which is why the line-based patterns above were green over `CushionFloorSheet:65`,
 * `index.tsx:573` and `CashRunwayChart:183` — three live hand-rolled money renders. The parser knows
 * which is which; a pattern never can. (Found at P6.4.2, after my own enumeration of this class went
 * 3 → 4 → 5 sites in one sitting.)
 */
function jsxDollarSites(file: string, src: string): { line: number; text: string }[] {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: { line: number; text: string }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const kids = node.children;
      kids.forEach((kid, i) => {
        // A JSX text run ending in `$`, immediately followed by an expression container.
        if (!ts.isJsxText(kid) || !/\$$/.test(kid.text)) return;
        const next = kids[i + 1];
        if (!next || !ts.isJsxExpression(next)) return;
        const { line } = sf.getLineAndCharacterOfPosition(next.getStart(sf));
        hits.push({ line: line + 1, text: next.getText(sf).slice(0, 90) });
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

const problems: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (EXEMPT.some((e) => file.includes(e))) continue;
    if (isTestHarness(file)) continue;
    const rel = relative(REPO_ROOT, file);
    const stripped = stripComments(readFileSync(file, 'utf8'));
    stripped.split(/\r?\n/).forEach((line, i) => {
      for (const { pattern, why } of HAND_ROLLED) {
        if (pattern.test(line)) {
          problems.push(`  ${rel}:${i + 1}  ${why}\n      ${line.trim().slice(0, 100)}`);
        }
      }
    });
    if (extname(file) === '.tsx') {
      for (const hit of jsxDollarSites(file, stripped)) {
        problems.push(`  ${rel}:${hit.line}  a literal $ in JSX text before an expression\n      \${${hit.text}`);
      }
    }
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
