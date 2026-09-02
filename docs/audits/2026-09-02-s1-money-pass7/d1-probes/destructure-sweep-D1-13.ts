// D1 probe: money-printing files that read the entity lists by DESTRUCTURING, which READS_ENTITIES misses.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode.ts';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((r) => r.startsWith('apps/rn/src/') || r.startsWith('packages/'))
  .filter((r) => !/\.test\.tsx?$/.test(r) && !/(^|\/)tests?\//.test(r) && !/(^|\/)testing\//.test(r) && !/(^|\/)test[A-Z][A-Za-z0-9]*\.tsx?$/.test(r));

const PRINTS_MONEY = /\b(formatWhole|formatCurrency|formatDisplayAmount)\s*\(/;
const READS_ENTITIES = /\.(debts|goals|requiredExpenses|livingExpenses)\b/;          // the gate's own
const DESTRUCTURED = /(?:const|let)\s*\{[^}]*\b(debts|goals|requiredExpenses|livingExpenses)\b[^}]*\}\s*=/;
const ASKS_GUARD = /\b(mayClaim|rowFieldUnread|anyRowFieldUnread|describeRepair|repairBlocks|repairsA11yLabel)\s*\(/;

const escapes: string[] = [];
let inPop = 0;
for (const rel of files) {
  const src = stripCommentsOnly(readFileSync(join(ROOT, rel), 'utf8'));
  if (!PRINTS_MONEY.test(src)) continue;
  if (READS_ENTITIES.test(src)) { inPop++; continue; }
  if (DESTRUCTURED.test(src) && !ASKS_GUARD.test(src)) escapes.push(rel);
}
console.log('files considered by the gate (PRINTS_MONEY && READS_ENTITIES):', inPop);
console.log('money-printing + destructured-entity-read + no guard call:', escapes.length);
for (const e of escapes) console.log('   ', e);
