/**
 * SURFACE INVENTORY — the input artifact for the whole-app COHESION gate ( [D31] · T4 ).
 *
 * The cohesion gate asks "does every element work TOGETHER — cross-surface voice, visual, motion,
 * numbers?" That question is only answerable by comparing screens to each other, which is exactly what a
 * per-file read cannot do and what an agent fan-out pays for repeatedly. T1 did this for words; this does
 * it for what each screen is BUILT from.
 *
 * ⛔ Transitive, not direct. A screen renders `Card` through a feature component three imports down, so
 * direct imports describe a file's neighbours rather than a surface's vocabulary. The graph is followed
 * to fixpoint per route; anything less would report Today as using almost nothing.
 *
 * What it looks for, in the gate's own terms:
 *  • **numbers** — three money formatters exist (`formatCurrency`, `formatDisplayAmount`, `formatWhole`).
 *    Which surface uses which is Wave C's C1 ("cents-formatter") stated as data instead of a hunch: the
 *    same amount rendering two ways on two screens is a cohesion defect nobody can see from one file.
 *  • **visual** — a `components/ui` primitive reachable from exactly ONE route is either bespoke work
 *    that should be shared, or a shared thing that should be local. Reachable from NONE is dead (C7).
 *
 * ⚠️ It reports REACHABILITY, not rendering — a conditional branch still counts as reachable. That
 * over-reports rather than under-reports, which is the correct direction for an audit input, and the
 * report says so rather than letting a reader assume precision it does not have.
 *
 * Usage: npm run audit:surfaces   → docs/audits/surface-inventory.md
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, relative, sep } from 'node:path';
import ts from 'typescript';

const REPO_ROOT = join(import.meta.dirname, '..');
const RN_SRC = join(REPO_ROOT, 'apps', 'rn', 'src');
const CORE = join(REPO_ROOT, 'packages', 'core');
const EXTS = ['.tsx', '.ts', '.ios.tsx', '.ios.ts', '.web.tsx', '.web.ts'];

const rel = (p: string) => relative(REPO_ROOT, p).split(sep).join('/');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !p.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

/**
 * `@/x` → rn src · `@core/x` → packages/core · `./x` → relative. Anything else is an npm package.
 *
 * ⛔ RETURNS EVERY PLATFORM VARIANT, not the first match — and the first version of this did not, which
 * made its very first finding a false positive. It reported `ChartSkeleton` as reached by no surface;
 * `ChartSkeleton` is imported by `AllocationBarCanvas.web.tsx`, `TrajectoryCanvas.web.tsx` and
 * `CashRunwayCanvas.web.tsx`. Resolving `./AllocationBarCanvas` to the `.tsx` and stopping meant every
 * module reachable ONLY through a `.web` or `.ios` sibling vanished from the graph.
 *
 * A bundler picks one variant per platform; an audit input must not, because the gate's question spans
 * platforms. Union is the honest answer, and it errs toward over-reporting, which the header promises.
 */
function resolveSpecifier(spec: string, fromFile: string): string[] {
  let base: string | null = null;
  if (spec.startsWith('@/')) base = join(RN_SRC, spec.slice(2));
  else if (spec.startsWith('@core/')) base = join(CORE, spec.slice(6));
  else if (spec.startsWith('.')) base = join(dirname(fromFile), spec);
  if (!base) return [];
  const hits = new Set<string>();
  for (const ext of ['', ...EXTS]) {
    const cand = base + ext;
    if (existsSync(cand) && statSync(cand).isFile()) hits.add(cand);
  }
  for (const ext of EXTS) {
    const cand = join(base, 'index' + ext);
    if (existsSync(cand)) hits.add(cand);
  }
  return [...hits];
}

const files = [...walk(RN_SRC), ...walk(CORE)];
const graph = new Map<string, string[]>();
for (const f of files) {
  const sf = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const deps: string[] = [];
  sf.forEachChild((n) => {
    const spec =
      (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)
        ? n.moduleSpecifier.text
        : null;
    if (!spec) return;
    deps.push(...resolveSpecifier(spec, f));
  });
  graph.set(f, deps);
}

/** Routes are the app's surfaces. `_layout` and `+not-found` are chrome, kept and marked. */
const routes = files.filter((f) => f.startsWith(join(RN_SRC, 'app') + sep)).sort();

function reachable(start: string): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const d of graph.get(cur) ?? []) if (!seen.has(d)) { seen.add(d); stack.push(d); }
  }
  return seen;
}

const UI_DIR = join(RN_SRC, 'components', 'ui') + sep;
const FORMATTERS: Record<string, string> = {
  [join(CORE, 'utils', 'formatCurrency.ts')]: 'formatCurrency',
  [join(CORE, 'utils', 'formatDisplayAmount.ts')]: 'formatDisplayAmount',
  [join(RN_SRC, 'utils', 'format.ts')]: 'formatWhole',
};

const perRoute = routes.map((r) => {
  const reach = reachable(r);
  return {
    route: rel(r),
    primitives: [...reach].filter((f) => f.startsWith(UI_DIR)).map((f) => f.slice(UI_DIR.length).replace(/\.(tsx?|ios\.tsx)$/, '')).sort(),
    formatters: [...reach].filter((f) => FORMATTERS[f]).map((f) => FORMATTERS[f]).sort(),
  };
});

const primitiveUse = new Map<string, string[]>();
for (const r of perRoute) for (const p of r.primitives) primitiveUse.set(p, [...(primitiveUse.get(p) ?? []), r.route]);
const allPrimitives = walk(join(RN_SRC, 'components', 'ui'))
  .map((f) => f.slice(UI_DIR.length).replace(/\.(tsx?|ios\.tsx)$/, ''))
  .filter((n) => !n.endsWith('.types'));
const unreached = [...new Set(allPrimitives)].filter((p) => !primitiveUse.has(p)).sort();
const singleUse = [...primitiveUse.entries()].filter(([, rs]) => rs.length === 1).sort();
const mixedFormatters = perRoute.filter((r) => r.formatters.length > 1);

const md: string[] = [];
md.push('# Surfaces — what each screen is built from');
md.push('');
md.push('> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:surfaces`.');
md.push('> Input to the whole-app **cohesion** gate, not its output.');
md.push('>');
md.push('> ⚠️ **Reachability, not rendering.** A conditional branch counts as reachable. This over-reports');
md.push('> rather than under-reports — the right direction for an audit input, but do not read a row as');
md.push('> "this screen shows all of these".');
md.push('');
md.push('## Numbers — which money formatter each surface reaches');
md.push('');
md.push('Three exist. The cohesion question is whether the same amount renders the same way everywhere;');
md.push('a surface reaching more than one is where it can stop doing so. *(Wave C · C1.)*');
md.push('');
md.push('| surface | formatters |');
md.push('|---|---|');
for (const r of perRoute) md.push(`| \`${r.route}\` | ${r.formatters.length ? r.formatters.join(' · ') : '—'} |`);
md.push('');
md.push(`**${mixedFormatters.length}** surfaces reach more than one formatter.`);
md.push('');
md.push('## Visual — shared primitives, and the ones that are not shared');
md.push('');
md.push('A `components/ui` primitive reachable from exactly ONE route is either bespoke work that wants');
md.push('sharing, or shared code that wants localising. Reachable from none is dead *(Wave C · C7)*.');
md.push('');
md.push('**Reached by exactly one surface:**');
md.push('');
md.push(singleUse.length ? singleUse.map(([p, rs]) => `- \`${p}\` — only \`${rs[0]}\``).join('\n') : '_None._');
md.push('');
md.push('**Reached by no surface:**');
md.push('');
md.push(unreached.length ? unreached.map((p) => `- \`${p}\``).join('\n') : '_None._');
md.push('');
md.push('## Every surface, and its vocabulary');
md.push('');
for (const r of perRoute) {
  md.push(`### \`${r.route}\``);
  md.push('');
  md.push(r.primitives.length ? r.primitives.map((p) => `\`${p}\``).join(' · ') : '_no shared primitives_');
  md.push('');
}

const OUT = join(REPO_ROOT, 'docs', 'audits');
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'surface-inventory.md'), md.join('\n') + '\n');
console.log(`surface-inventory: ${perRoute.length} surfaces · ${mixedFormatters.length} reach >1 money formatter · ${singleUse.length} single-use primitives · ${unreached.length} unreached`);
console.log('→ docs/audits/surface-inventory.md');
