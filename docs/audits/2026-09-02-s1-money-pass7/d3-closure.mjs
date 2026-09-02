// D3 runner: transitive closure of legacy-root files reachable from packages/core.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const LEGACY = ['app/', 'components/', 'lib/', 'tests/'];
const isLegacy = (p) => LEGACY.some((d) => p.startsWith(d));
const rel = (p) => p.slice(ROOT.length + 1).split(sep).join('/');

function resolveSpec(spec, fromFile) {
  let base;
  if (spec.startsWith('@core/')) base = join(ROOT, 'packages', 'core', spec.slice(6));
  else if (spec.startsWith('@/')) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec);
  else return null;
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(base + ext)) return base + ext;
  }
  if (existsSync(base) && /\.tsx?$/.test(base)) return base;
  return null;
}

function walk(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p, out);
    } else if (/\.tsx?$/.test(p)) out.push(p);
  }
}

const seeds = [];
walk(join(ROOT, 'packages', 'core'), seeds);

const IMPORT_RE = /(?:from\s*|import\s*)['"]([^'"]+)['"]/g;
const seen = new Set(seeds);
const legacyHits = new Map();
const queue = seeds.slice();

while (queue.length) {
  const f = queue.shift();
  let src;
  try {
    src = readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const target = resolveSpec(m[1], f);
    if (!target) continue;
    const r = rel(target);
    if (isLegacy(r)) {
      if (!legacyHits.has(r)) legacyHits.set(r, []);
      legacyHits.get(r).push(rel(f));
    }
    if (!seen.has(target)) {
      seen.add(target);
      queue.push(target);
    }
  }
}

const rows = [...legacyHits.entries()].sort();
let edges = 0;
console.log('LEGACY FILES IN THE CLOSURE FROM packages/core: ' + rows.length);
for (const [file, importers] of rows) {
  edges += importers.length;
  console.log('  ' + file);
  for (const i of [...new Set(importers)]) console.log('      <- ' + i);
}
console.log('TOTAL IMPORT EDGES INTO THE LEGACY ROOT: ' + edges);
