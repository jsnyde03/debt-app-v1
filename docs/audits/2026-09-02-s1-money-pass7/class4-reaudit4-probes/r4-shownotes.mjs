import { readFileSync } from 'node:fs';
const REG = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
for (const id of process.argv.slice(2)) {
  const e = REG[id];
  if (!e) { console.log(`${id} — NOT FOUND`); continue; }
  console.log(`\n=== ${id} ===`);
  console.log('what   :', e.what);
  console.log('file   :', e.file);
  console.log('token  :', JSON.stringify(e.token));
  if (e.proof) {
    console.log('expect :', JSON.stringify(e.proof.expect));
    console.log('run    :', e.proof.run, JSON.stringify(e.proof.cmd ?? null));
    console.log('measured:', e.proof.measured, e.proof.sha);
    for (const u of e.proof.unfix) console.log('unfix  :', u.at, '|', JSON.stringify(u.find).slice(0,200), '=>', JSON.stringify(u.replace).slice(0,120));
    if (e.proof.proofNote) console.log('NOTE   :', e.proof.proofNote);
  }
}
