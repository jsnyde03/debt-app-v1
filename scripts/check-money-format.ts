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
import { stripCommentsOnly } from './lib/stripCode';
import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';

/** GAP-8 — this gate's key in scripts/gate-scan-floors.json. */
const SCAN_GATE = 'money-format';
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
  /**
   * ⛔ **S1.12.5.8 [pass-5 `C5-6`] — AN APP STORE PRICE IS NOT THE APP'S OWN MONEY VOICE.**
   *
   * `formatCurrency` is USD-shaped by design and states the user's money in the app's own convention.
   * This figure is a **store price**: its placement, separator and minor-unit count must follow the
   * STORE's locale, or it contradicts the localized `priceString` printed three lines above it — which
   * is the defect `C5-6` measured (`29,99 €` on the card, `€2.50` beneath it; `₩3250.00` on a won store,
   * where KRW has no minor units at all).
   *
   * ⚠️ Exempt with a reason, per this list's own rule, and the reason is checkable: the module takes an
   * ISO currency code and **drops the anchor entirely when it has none**, rather than falling back to a
   * shape it cannot justify.
   */
  join('premium', 'perMonthAnchor.ts'),
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
/**
 * ⛔ **`wholeFile` EXISTS BECAUSE THE SCAN IS PER LINE AND THE DEFECT IS NOT.** [S1.10.6.5 · pass-3 B1]
 *
 * ⚡ **B1 named TWO independent reasons the Intl patterns could not fire, and repairing only the regex
 * left the gate green over both live sites.** Measured: with the pattern fixed and the scan still
 * line-by-line, `projectForecast.ts` and `buildSmartInsights.ts` — each a real `new Intl.NumberFormat`
 * with `style: "currency"` on the FOLLOWING line — stayed GREEN. ⚠️ *"Both facts must be fixed, not one"*
 * is the finding's own sentence, and fixing one of them is what a green run would have called done.
 *
 * A `wholeFile` pattern is matched against the stripped source with the line number derived from the
 * match offset, so it reads across newlines and still reports where.
 */
const HAND_ROLLED: { pattern: RegExp; why: string; wholeFile?: true }[] = [
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
  // Intl doing currency work outside the two owners.
  //
  // ⛔ **S1.10.6.5 [pass-3 B1] — THE PAREN-COUNTED PATTERN WAS DEAD, AND MEASURING IT CORRECTED THE
  // FINDING THAT REPORTED IT.** The auditor said *both* Intl patterns were unsatisfiable. Measured
  // against seven real shapes: `new Intl\.NumberFormat\([^)]*\)…style:` matched **nothing** — `[^)]*\)`
  // runs to the call's own closing paren, so the pattern demanded `style: 'currency'` AFTER the call had
  // closed — while the `toLocaleString` one worked on the ordinary forms. ⚡ **And it had a hole the
  // finding did not name:** one nested call inside the options (`minimumFractionDigits: Math.min(2, 2)`)
  // puts a `)` before `currency`, and `[^)]*` cannot cross it, so the gate went quiet on a real site.
  //
  // ⚠️ **So neither pattern counts parens any more.** Anchored on the ENTRY POINT, a bounded window that
  // crosses parens and newlines, and a real option KEY as the terminator rather than the bare word
  // *"currency"* — a window alone would fire on an unrelated `const currency` sixty lines below.
  // ⛔ `new` is gone from the anchor because `Intl.NumberFormat(…)` is valid without it, which the old
  // pattern required and would have missed on its own terms.
  //
  // Measured both directions: 7 of 7 real currency shapes caught, and 0 of 5 controls — a date format, a
  // plain number format, a percent formatter, a far-away `currency` identifier, and a prose mention.
  {
    pattern: /\b(?:toLocaleString|Intl\.NumberFormat)\s*\([\s\S]{0,200}?(?:style\s*:\s*['"]currency['"]|currency\s*:\s*['"])/,
    why: 'an inline Intl currency formatter',
    wholeFile: true,
  },
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
    const lines = stripped.split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const { pattern, why, wholeFile } of HAND_ROLLED) {
        if (!wholeFile && pattern.test(line)) {
          problems.push(`  ${rel}:${i + 1}  ${why}\n      ${line.trim().slice(0, 100)}`);
        }
      }
    });
    // The cross-line half — see `wholeFile` above. `g` so EVERY occurrence in a file is reported: a file
    // holding two hand-rolled formatters would otherwise hide the second behind the first.
    for (const { pattern, why, wholeFile } of HAND_ROLLED) {
      if (!wholeFile) continue;
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      for (const m of stripped.matchAll(re)) {
        const line = stripped.slice(0, m.index).split(/\r?\n/).length;
        problems.push(`  ${rel}:${line}  ${why}\n      ${(lines[line - 1] ?? '').trim().slice(0, 100)}`);
      }
    }
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
// ⛔ GAP-8 — assert the gate actually READ something before it is allowed to report a pass.
const observedScan = assertScanFloor(SCAN_GATE);
console.log(`✅ money-format: no hand-rolled currency formatters (${HAND_ROLLED.length} shapes checked).${scanNote(SCAN_GATE, observedScan)}`);
