/** Re-auditor probe: did the PRE-FIX matcher see a defect inside a template interpolation? */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
import { logicalLines } from '../../../../scripts/lib/logicalLines';
const ROOT = join(import.meta.dirname, '../../../..');
const f = process.argv[2] ?? 'apps/rn/src/utils/format.ts';
const src = readFileSync(join(ROOT, f), 'utf8');
const COLLAPSE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/;
const ROUNDING = /Math\.round\([^;]*?\*\s*100\s*,?\s*\)\s*\/\s*100/g;
let oldC = 0, oldR = 0;
for (const line of stripCommentsOnly(src).split('\n')) {
  if (COLLAPSE.test(line)) oldC++;
  ROUNDING.lastIndex = 0; if (ROUNDING.test(line)) oldR++;
}
let newC = 0, newR = 0;
for (const ll of logicalLines(src, { blankStrings: true })) {
  if (COLLAPSE.test(ll.text)) newC++;
  for (const _ of ll.text.matchAll(ROUNDING)) newR++;
}
console.log(`${f}\n  PRE-FIX  (stripCommentsOnly, per physical line): collapse=${oldC} rounding=${oldR}`);
console.log(`  SHIPPED  (logicalLines blankStrings:true)       : collapse=${newC} rounding=${newR}`);
