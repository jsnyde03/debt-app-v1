// R4 — fire-count of the PROPOSED remedy before it is written down (round 2's rule fired on 90,
// round 3's first two candidates on 84 and 30).
import { readFileSync } from 'node:fs';
const REG = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
let proofs = 0, blankExpect = 0, bothAbsent = 0, blankToken = 0;
const fires = [];
for (const [id, e] of Object.entries(REG)) {
  const p = e.proof; if (!p) continue; proofs++;
  if (p.expect !== undefined && !String(p.expect).trim()) { blankExpect++; fires.push([id, 'blank expect']); }
  if (p.expect === undefined && !e.token) { bothAbsent++; fires.push([id, 'neither expect nor token']); }
  if (e.token !== undefined && !String(e.token).trim()) { blankToken++; fires.push([id, 'blank token']); }
}
console.log(`proofs=${proofs}`);
console.log(`PROPOSED RULE — refuse a proof whose effective expectation is blank`);
console.log(`  blank/whitespace-only expect : ${blankExpect}`);
console.log(`  neither expect nor token     : ${bothAbsent}   (already refused today)`);
console.log(`  blank/whitespace-only token  : ${blankToken}`);
console.log(`  TOTAL FIRE-COUNT on the live registry: ${fires.length}`);
for (const f of fires) console.log('   ', f.join(' — '));
