import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
import { lineMap } from '../../../../scripts/lib/logicalLines';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const SRC = join(ROOT, 'apps', 'rn', 'src');
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}
const IMPORT = /^\s*import\s*(?:\{[^}]*\bappStore\b[^}]*\}|\*\s*as\s+\w+)\s*from\s*['"][^'"]*appStore['"]/gm;
let matches = 0;
const wrong: string[] = [];
for (const f of walk(SRC)) {
  const rel = relative(ROOT, f).split(sep).join('/');
  if (rel === 'apps/rn/src/store/appStore.ts') continue;
  const raw = readFileSync(f, 'utf8');
  const code = stripCommentsOnly(raw);
  const map = lineMap(code);
  const srcLines = raw.split(/\r?\n/);
  for (const m of code.matchAll(IMPORT)) {
    matches++;
    const ln = map.lineAt(m.index);
    if (!/import/.test(srcLines[ln - 1] ?? '')) wrong.push(`${rel}:${ln}  «${(srcLines[ln - 1] ?? '').trim()}»`);
  }
}
console.log(`check-sandbox-writes IMPORT: ${matches} live matches; reported at a line NOT containing "import": ${wrong.length}`);
for (const w of wrong) console.log('   ', w);
