/**
 * R4 — the borrow refusal's exemption is tested BEFORE the lenders are computed:
 *   if (expect !== undefined && !e.token.includes(expect) && !e.proof.proofNote?.trim()) { ...lenders... }
 * so ANY non-empty proofNote skips the check entirely, whatever it says.
 * Measure (a) how many entries hold that unconditional waiver today, (b) the fire-count of a
 * tightened exemption — "the proofNote must NAME a lender" — before proposing it.
 */
import { readFileSync } from 'node:fs';
const REG = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
const es = Object.entries(REG);
const lendersOf = (id, x) => es.filter(([o, oe]) => o !== id && oe.token?.includes(x)).map(([o]) => o);
// the short form of an id, as the notes actually spell it (S1-CLASS4-A2-1 -> A2-1)
const shortOf = (id) => id.replace(/^S1(-CLASS4|P\d)?-/, '');

const waived = [], borrowShaped = [];
for (const [id, e] of es) {
  const p = e.proof; if (!p) continue;
  const note = p.proofNote?.trim();
  const x = p.expect;
  const isBorrow = x !== undefined && x !== '' && e.token && !e.token.includes(x) && lendersOf(id, x).length > 0;
  if (note && !isBorrow) waived.push([id, x === undefined ? 'expect ABSENT' : 'not borrow-shaped']);
  if (isBorrow) borrowShaped.push([id, lendersOf(id, x), note ?? '']);
}
console.log(`entries=${es.length}`);
console.log(`(a) entries holding an UNCONDITIONAL waiver of the borrow check today: ${waived.length}`);
for (const w of waived) console.log('    ', w.join(' — '));
console.log(`\n(b) borrow-shaped entries: ${borrowShaped.length}`);
let wouldFire = 0;
for (const [id, lenders, note] of borrowShaped) {
  const names = lenders.some((l) => note.includes(l) || note.includes(shortOf(l)));
  if (!names) wouldFire++;
  console.log(`     ${id}  lenders=[${lenders.join(', ')}]  note names one: ${names ? 'YES' : 'NO'}`);
}
console.log(`\nPROPOSED tightened exemption ("proofNote must name a lender") FIRE-COUNT: ${wouldFire}`);
