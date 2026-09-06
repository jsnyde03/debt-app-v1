// R4 — census the round-3 borrow refusal over the live registry.
import { readFileSync } from 'node:fs';
const REG = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
const es = Object.entries(REG);
let withProof = 0, withExpect = 0, emptyExpect = 0, notInOwn = 0, fires = 0, firesIgnoringNote = 0;
const withNote = [], firing = [], suppressed = [];
for (const [id, e] of es) {
  const p = e.proof;
  if (!p) continue;
  withProof++;
  if (p.proofNote !== undefined) withNote.push(id);
  const x = p.expect;
  if (x === undefined) continue;
  withExpect++;
  if (x === '') { emptyExpect++; continue; }
  if (!e.token) continue;
  if (e.token.includes(x)) continue;
  notInOwn++;
  const lenders = es.filter(([o, oe]) => o !== id && oe.token?.includes(x)).map(([o]) => o);
  if (!lenders.length) continue;
  firesIgnoringNote++;
  if (p.proofNote?.trim()) suppressed.push([id, lenders, p.proofNote]);
  else { fires++; firing.push([id, lenders, x]); }
}
console.log(`entries=${es.length} withProof=${withProof} withExpect=${withExpect} emptyExpect=${emptyExpect}`);
console.log(`expect-not-in-own-token=${notInOwn}  borrow-shaped(has a lender)=${firesIgnoringNote}  FIRES(no proofNote)=${fires}`);
console.log(`\nproofNote carried by ${withNote.length}: ${withNote.join(', ')}`);
console.log('\n--- borrow-shaped, SUPPRESSED by proofNote ---');
for (const [id, lenders, note] of suppressed) {
  const names = lenders.some((l) => note.includes(l));
  console.log(`${id}\n  lenders: ${lenders.join(', ')}\n  proofNote NAMES a lender: ${names ? 'YES' : 'NO'}\n  note: ${JSON.stringify(note).slice(0, 260)}`);
}
console.log('\n--- borrow-shaped, FIRING ---');
for (const r of firing) console.log(JSON.stringify(r));

// proofNote entries that are NOT borrow-shaped: what are they exempting?
console.log('\n--- proofNote entries that the borrow check would never have fired on ---');
for (const id of withNote) {
  if (suppressed.some(([s]) => s === id)) continue;
  const e = REG[id];
  const x = e.proof.expect;
  const why = x === undefined ? 'no expect' : e.token?.includes(x) ? 'expect IS in own token' : 'no lender';
  console.log(`${id} — ${why}`);
}
