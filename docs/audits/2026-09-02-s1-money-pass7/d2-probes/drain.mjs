import { readFileSync, writeFileSync } from 'node:fs';
const [, , src, dst, mode] = process.argv;
const r = JSON.parse(readFileSync(src, 'utf8'));
const withProof = Object.keys(r).filter((i) => r[i].proof);
if (mode === 'drain') {
  // simulate ONE proof being executed: authored 10 -> 9
  const id = withProof.find((i) => !r[i].proof.measured);
  r[id].proof.measured = '2026-09-02';
  r[id].proof.sha = 'deadbee';
  console.log('drained:', id);
} else {
  // opposite direction: un-execute one proof, authored 10 -> 11
  const id = withProof.find((i) => r[i].proof.measured);
  delete r[id].proof.measured;
  delete r[id].proof.sha;
  console.log('un-executed:', id);
}
writeFileSync(dst, `${JSON.stringify(r, null, 2)}\n`, 'utf8');
const a = Object.keys(r).filter((i) => r[i].proof && !r[i].proof.measured).length;
console.log('authored now:', a);
