// R4 — how much headroom do round 3's ratchets leave? Computed from the registry JSON alone so it
// does not read the working tree (a concurrent prove:guards run plants source files).
import { readFileSync } from 'node:fs';
const REG = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
const es = Object.entries(REG);
let proven = 0, authored = 0, guardOnly = 0, unguarded = 0, none = 0;
const authoredIds = [];
for (const [id, e] of es) {
  if (e.unguarded) { unguarded++; continue; }
  if (e.proof) { if (e.proof.measured) proven++; else { authored++; authoredIds.push(id); } continue; }
  if (e.guardOnly) { guardOnly++; continue; }
  none++;
}
const gate = readFileSync('scripts/check-finding-guards.ts', 'utf8');
const cap = (n) => gate.match(new RegExp(`const ${n} = (\d+)`))?.[1];
console.log(`entries=${es.length}  proven=${proven}  authored=${authored}  guardOnly=${guardOnly}  unguarded=${unguarded}  neither=${none}`);
console.log(`MIN_ENTRIES=${cap('MIN_ENTRIES')}  MAX_UNGUARDED=${cap('MAX_UNGUARDED')}  MAX_AUTHORED=${cap('MAX_AUTHORED')}  MAX_GUARD_ONLY=${cap('MAX_GUARD_ONLY')}`);
console.log(`AUTHORED HEADROOM = ${Number(cap('MAX_AUTHORED')) - authored}`);
console.log('authored ids:', authoredIds.join(', '));
