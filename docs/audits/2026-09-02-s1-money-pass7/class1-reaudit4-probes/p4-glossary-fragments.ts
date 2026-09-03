import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
import { lineMap } from '../../../../scripts/lib/logicalLines';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const ROOTS = [join(ROOT, 'packages', 'core'), join(ROOT, 'apps', 'rn', 'src')];
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}
function copyFragments(text: string) {
  const out: { text: string; index: number; kind: string }[] = [];
  for (const [kind, re] of [['sq', /'[^']*'/g], ['dq', /"[^"]*"/g], ['bt', /`[^`]*`/g], ['jsx', />[^<>{}]{2,}</g]] as [string, RegExp][])
    for (const m of text.matchAll(re)) out.push({ text: m[0], index: m.index, kind });
  return out;
}
let multi = 0, total = 0;
const worst: { file: string; ln: number; span: number; kind: string; head: string }[] = [];
for (const root of ROOTS) for (const file of walk(root)) {
  const base = basename(file);
  if (base.endsWith('.test.ts') || /^test[A-Z]/.test(base)) continue;
  const code = stripCommentsOnly(readFileSync(file, 'utf8'));
  const map = lineMap(code);
  for (const f of copyFragments(code)) {
    total++;
    const span = (f.text.match(/\n/g) ?? []).length;
    if (span > 0) {
      multi++;
      worst.push({ file: relative(ROOT, file), ln: map.lineAt(f.index), span, kind: f.kind, head: f.text.replace(/\s+/g, ' ').slice(0, 110) });
    }
  }
}
worst.sort((a, b) => b.span - a.span);
console.log(`fragments total = ${total}; spanning >1 physical line = ${multi}`);
for (const w of worst.slice(0, 25)) console.log(`  ${w.kind} ${w.file}:${w.ln} span=${w.span}  ${w.head}`);
