/** Independent re-measurement of the MAX_INLINE_ROUNDING 93 -> 94 raise. Written by the re-auditor. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { logicalLines } from '../../../../scripts/lib/logicalLines';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '../../../..');
const OWNER = 'packages/core/utils/money.ts';
const OLD_RE = /Math\.round\([^;]*?\*\s*100\s*\)\s*\/\s*100/g;
const NEW_RE = /Math\.round\([^;]*?\*\s*100\s*,?\s*\)\s*\/\s*100/g;

const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((rel) => rel.startsWith('apps/rn/') || rel.startsWith('packages/'))
  .filter((rel) => rel !== OWNER);

type Bag = Map<string, number>;
const bump = (m: Bag, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
const A: Bag = new Map(); // old scan, old regex  (the pre-fix instrument)
const B: Bag = new Map(); // old scan, new regex  (regex change only)
const C: Bag = new Map(); // logical lines, old regex (scan change only)
const D: Bag = new Map(); // logical lines, new regex (the shipped instrument)

for (const rel of tracked) {
  const source = readFileSync(join(ROOT, rel), 'utf8');
  for (const line of stripCommentsOnly(source).split('\n')) {
    OLD_RE.lastIndex = 0; if (OLD_RE.test(line)) bump(A, rel);
    NEW_RE.lastIndex = 0; if (NEW_RE.test(line)) bump(B, rel);
  }
  for (const ll of logicalLines(source, { blankStrings: true })) {
    for (const _ of ll.text.matchAll(OLD_RE)) bump(C, rel);
    for (const _ of ll.text.matchAll(NEW_RE)) bump(D, rel);
  }
}
const tot = (m: Bag) => [...m.values()].reduce((a, b) => a + b, 0);
console.log(`A old-scan/old-regex (pre-fix instrument) = ${tot(A)}`);
console.log(`B old-scan/new-regex (regex only)        = ${tot(B)}`);
console.log(`C logical/old-regex  (scan only)         = ${tot(C)}`);
console.log(`D logical/new-regex  (SHIPPED)           = ${tot(D)}`);
console.log('\nper-file A -> D differences:');
for (const f of new Set([...A.keys(), ...D.keys()])) {
  const a = A.get(f) ?? 0, d = D.get(f) ?? 0;
  if (a !== d) console.log(`  ${f}: A=${a} D=${d} (${d - a > 0 ? '+' : ''}${d - a})`);
}
