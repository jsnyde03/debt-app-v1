import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
import { lineMap } from '../../../../scripts/lib/logicalLines';
const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const ROOTS = [join(ROOT, 'packages', 'core'), join(ROOT, 'apps', 'rn', 'src')];
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) { if (e === 'node_modules' || e.startsWith('.')) continue;
    const full = join(dir, e); if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full); }
  return out;
}
const KINDS: [string, RegExp][] = [['sq', /'[^']*'/g], ['dq', /"[^"]*"/g], ['bt', /`[^`]*`/g], ['jsx', />[^<>{}]{2,}</g]];
const tally: Record<string, { total: number; multi: number; maxSpan: number; sample: string }> = {};
for (const [k] of KINDS) tally[k] = { total: 0, multi: 0, maxSpan: 0, sample: '' };
for (const root of ROOTS) for (const file of walk(root)) {
  const base = basename(file);
  if (base.endsWith('.test.ts') || /^test[A-Z]/.test(base)) continue;
  const code = stripCommentsOnly(readFileSync(file, 'utf8'));
  const map = lineMap(code);
  for (const [k, re] of KINDS) for (const m of code.matchAll(new RegExp(re.source, 'g'))) {
    const span = (m[0].match(/\n/g) ?? []).length;
    tally[k].total++;
    if (span > 0) { tally[k].multi++;
      if (span > tally[k].maxSpan) { tally[k].maxSpan = span; tally[k].sample = `${relative(ROOT, file)}:${map.lineAt(m.index)} ${m[0].replace(/\s+/g,' ').slice(0,90)}`; } }
  }
}
for (const [k, v] of Object.entries(tally)) console.log(`${k}: total=${v.total} multiline=${v.multi} maxSpan=${v.maxSpan}\n    ${v.sample}`);
