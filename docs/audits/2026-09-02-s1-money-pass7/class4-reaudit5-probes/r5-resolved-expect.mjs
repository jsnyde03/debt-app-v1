import { readFileSync } from 'node:fs';
const reg = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
let withProof = 0, oldRefused = [], newRefused = [], emptyExpect = [], nonString = [];
for (const [id, e] of Object.entries(reg)) {
  if (!e.proof) continue;
  withProof++;
  const expect = e.proof.expect;
  if (expect !== undefined && typeof expect !== 'string') nonString.push([id, typeof expect]);
  if (expect === '') emptyExpect.push(id);
  // OLD (pre-R4-2) selection refusal
  if (!expect && !e.token) oldRefused.push(id);
  // NEW (R4-2) selection refusal
  const resolved = expect ?? e.token ?? '';
  if (typeof resolved !== 'string' || !resolved.trim()) newRefused.push(id);
}
console.log('entries carrying a proof:', withProof);
console.log('OLD rule would refuse:', oldRefused.length, oldRefused.join(','));
console.log('NEW rule refuses     :', newRefused.length, newRefused.join(','));
console.log('entries with expect === "":', emptyExpect.length, emptyExpect.join(','));
console.log('entries with a non-string expect:', nonString.length, JSON.stringify(nonString));
// whitespace-only tokens / expects that .trim() would now catch but truthiness would not
const wsOnly = Object.entries(reg).filter(([, e]) => {
  if (!e.proof) return false;
  const r = e.proof.expect ?? e.token ?? '';
  return typeof r === 'string' && r !== '' && !r.trim();
});
console.log('resolved expectation is whitespace-only (new rule catches, old did not):', wsOnly.length, wsOnly.map(([i]) => i).join(','));
