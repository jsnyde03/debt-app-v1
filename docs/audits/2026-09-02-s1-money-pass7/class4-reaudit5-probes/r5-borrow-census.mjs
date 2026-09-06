import { readFileSync } from 'node:fs';
const reg = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
const ids = Object.keys(reg);
console.log('total entries:', ids.length);
const short = (l) => l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '');
let branchEntered = 0;
for (const [id, e] of Object.entries(reg)) {
  if (!e.proof) continue;
  const expect = e.proof.expect;
  if (expect === undefined) continue;
  if (e.token && e.token.includes(expect)) continue;
  branchEntered++;
  const lenders = ids.filter((o) => o !== id && reg[o].token?.includes(expect));
  const note = e.proof.proofNote ?? '';
  const hits = lenders.map((l) => ({ l, full: note.includes(l), shortHit: note.includes(short(l)), short: short(l) }));
  const waived = hits.some((h) => h.full || h.shortHit);
  console.log('---');
  console.log(id, '| lenders:', lenders.length ? lenders.join(',') : '(none)', '| waived:', waived);
  console.log('   expect:', JSON.stringify(expect).slice(0, 120));
  console.log('   note  :', JSON.stringify(note).slice(0, 200));
  for (const h of hits) console.log('   match:', h.l, 'full=', h.full, 'short=', JSON.stringify(h.short), '=>', h.shortHit);
}
console.log('=== entries entering the borrow branch:', branchEntered);
// how many entries carry a proofNote at all
const notes = Object.entries(reg).filter(([, e]) => e.proof?.proofNote?.trim());
console.log('=== entries with a non-empty proofNote:', notes.length, notes.map(([i]) => i).join(','));
