/** Re-derive MAX_INLINE_ROUNDING = 94 independently, and isolate WHICH change recovered the 94th site. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenContinuations } from '../../../../scripts/lib/logicalLines';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '../../../..');
const OWNER = 'packages/core/utils/money.ts';
const OLD = /Math\.round\([^;]*?\*\s*100\s*\)\s*\/\s*100/g;
const NEW = /Math\.round\([^;]*?\*\s*100\s*,?\s*\)\s*\/\s*100/g;

const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((rel) => rel.startsWith('apps/rn/') || rel.startsWith('packages/'));

type Mode = 'perline' | 'wholefile' | 'flattened';
function count(mode: Mode, re: RegExp): Map<string, number> {
  const per = new Map<string, number>();
  for (const rel of tracked) {
    if (rel === OWNER) continue;
    const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
    let n = 0;
    if (mode === 'perline') {
      for (const line of stripCommentsOnly(src).split('\n')) n += [...line.matchAll(new RegExp(re.source, 'g'))].length;
    } else {
      const text = mode === 'flattened' ? flattenContinuations(src).text : stripCommentsOnly(src);
      n = [...text.matchAll(new RegExp(re.source, 'g'))].length;
    }
    if (n) per.set(rel, n);
  }
  return per;
}
const total = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
const rows: [string, Mode, RegExp][] = [
  ['A per-physical-line / OLD regex (the pre-fix instrument)', 'perline', OLD],
  ['B per-physical-line / NEW regex (`,?` only)            ', 'perline', NEW],
  ['C whole-file NOT flattened / NEW regex                 ', 'wholefile', NEW],
  ['D SHIPPED: flattened / NEW regex                       ', 'flattened', NEW],
];
const maps = rows.map(([, m, r]) => count(m, r));
rows.forEach(([label], i) => console.log(`${label} = ${total(maps[i])}`));
const A = maps[0], D = maps[3], C = maps[2];
console.log('\nper-file A -> D differences:');
for (const k of new Set([...A.keys(), ...D.keys()])) {
  if ((A.get(k) ?? 0) !== (D.get(k) ?? 0)) console.log(`  ${k}: A=${A.get(k) ?? 0} D=${D.get(k) ?? 0}`);
}
console.log('per-file C -> D differences (does FLATTENING add anything?):');
let any = false;
for (const k of new Set([...C.keys(), ...D.keys()])) {
  if ((C.get(k) ?? 0) !== (D.get(k) ?? 0)) { any = true; console.log(`  ${k}: C=${C.get(k) ?? 0} D=${D.get(k) ?? 0}`); }
}
if (!any) console.log('  NONE — flattening changes no count anywhere in the population.');
