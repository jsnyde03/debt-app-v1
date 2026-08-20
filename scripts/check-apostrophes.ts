/**
 * Apostrophe guard (P6.4.4 / audit L1-22) — user-facing copy uses ONE apostrophe, the typographic `’`.
 *
 * ⛔ **Why this is a baseline and not a sweep.** L1-22 is real: the same contraction is typeset two ways
 * across the app, sometimes in identical sentences, and straight apostrophes read as unpolished developer
 * output next to curly ones on the same scroll — including in App Store screenshots. But measured at
 * P6.4.4 it is **~73 user-facing copy strings**, and every one needs classifying as copy / test-pin /
 * comment before it is touched. 🎯 2026-08-20: normalising lands at **P6.8**, the sweep on the frozen
 * app. This gate exists so the number cannot GROW in between.
 *
 * ⚠️ **73, not the 152 first reported.** That figure came from a line-grep that counted comments — T4's
 * measured failure, *"comments about a word outnumber uses of it"*. The AST pass below is the reason this
 * number is trustworthy, and the reason the first one was not.
 *
 * ⚠️ **The pins move with the copy, always.** In this same step, changing one onboarding label turned two
 * Maestro flows red because they pinned the old string — `01-launch-smoke` and `07-money-add-and-rescue`
 * both `tapOn`'d it. That is why the sweep is not a find-and-replace.
 *
 * ⛔ **It reads the AST, never lines.** A line-based scan cannot tell a contraction in copy from one in a
 * comment or an identifier, and the comments about this class outnumber the class. Only `StringLiteral`,
 * `NoSubstitutionTemplateLiteral`, template *spans* and `JsxText` are considered — so a docblock
 * explaining the rule can never trip it.
 *
 * Usage: tsx scripts/check-apostrophes.ts            # gate
 *        tsx scripts/check-apostrophes.ts --baseline # re-record (only after a deliberate sweep)
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

import ts from 'typescript';

const REPO_ROOT = join(import.meta.dirname, '..');
const BASELINE = join(REPO_ROOT, 'scripts', 'apostrophe-baseline.json');
/** Both live trees. The legacy Next surface at the repo root dies at P6.11 and is out of scope. */
const ROOTS = [join(REPO_ROOT, 'packages', 'core'), join(REPO_ROOT, 'apps', 'rn', 'src')];

/**
 * A straight apostrophe used as one — i.e. inside a word. `'` between two letters.
 *
 * ⚠️ Deliberately NOT every `'`: a possessive-plural ("your debts' balances") and a quoted term are
 * different questions, and a guard that flags them would be argued with rather than obeyed.
 */
const CONTRACTION = /[A-Za-z]'[A-Za-z]/;

/** Test harnesses and colocated suites are not copy — their strings are assertions ABOUT copy. */
const isTest = (f: string) =>
  /(^|[\\/])test[A-Z][^\\/]*\.ts$/.test(f) || f.endsWith('.test.ts') || /[\\/]testing[\\/]/.test(f) || /[\\/]__fixtures__[\\/]/.test(f);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}

/** Every copy-bearing node holding a straight-apostrophe contraction, as stable `path|text` keys. */
function sitesIn(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rel = relative(REPO_ROOT, file).replace(/\\/g, '/');
  const found: string[] = [];
  const take = (text: string) => {
    const t = text.trim();
    if (t && CONTRACTION.test(t)) found.push(`${rel}|${t.replace(/\s+/g, ' ').slice(0, 120)}`);
  };
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) take(node.text);
    else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) take(node.text);
    else if (ts.isJsxText(node)) take(node.text);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

const current = new Set<string>();
for (const root of ROOTS) for (const f of walk(root)) if (!isTest(f)) sitesIn(f).forEach((s) => current.add(s));
const sorted = [...current].sort();

if (process.argv.includes('--baseline')) {
  writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  console.log(`→ wrote apostrophe-baseline.json (${sorted.length} sites)`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('\n❌ apostrophes: no baseline. Run `tsx scripts/check-apostrophes.ts --baseline`.\n');
  process.exit(1);
}

const baseline = new Set<string>(JSON.parse(readFileSync(BASELINE, 'utf8')) as string[]);
const fresh = sorted.filter((s) => !baseline.has(s));

if (fresh.length > 0) {
  console.error(`\n❌ apostrophes: ${fresh.length} NEW straight-apostrophe string(s) in user-facing copy.\n`);
  for (const s of fresh) {
    const [file, text] = s.split('|');
    console.error(`  ${file}\n      ${text}`);
  }
  console.error("\n  Use the typographic apostrophe ’ (U+2019) in copy. L1-22's baselined sites are");
  console.error('  baselined and are swept at P6.8 — this guard only stops the count growing.');
  console.error('  If you just SWEPT some, re-record with `--baseline`.\n');
  process.exit(1);
}

// ⚠️ Stale entries are reported, never red: removing copy is exactly what the P6.8 sweep will do, and a
// gate that reds on progress is a gate that gets reverted. But an unreported drift means the baseline
// silently stops describing the tree — the T8.4 failure, where a baseline 12 too high left a +1 detector
// unable to detect +1.
const stale = [...baseline].filter((s) => !current.has(s)).length;
console.log(
  `✅ apostrophes: no new straight-apostrophe copy (${sorted.length} baselined${stale ? `, ${stale} stale — re-record after a sweep` : ''}).`,
);
