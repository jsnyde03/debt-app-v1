import { readFileSync } from 'node:fs';
const reg = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
const ids = Object.keys(reg);
let withProof = 0, noExpect = 0, noExpectNoToken = 0, notSubstring = 0, notSubNoNote = 0;
const rows = [];
for (const [id, e] of Object.entries(reg)) {
  const p = e.proof;
  if (!p) continue;
  withProof++;
  const tok = e.token;
  if (p.expect === undefined) {
    noExpect++;
    if (!tok) { noExpectNoToken++; rows.push(['NO-EXPECT-NO-TOKEN', id, JSON.stringify(tok)]); }
  } else if (tok && !tok.includes(p.expect)) {
    notSubstring++;
    if (!p.proofNote) { notSubNoNote++; rows.push(['EXPECT-NOT-IN-TOKEN-NO-NOTE', id, `token=${JSON.stringify(tok)} expect=${JSON.stringify(p.expect)}`]); }
    else rows.push(['EXPECT-NOT-IN-TOKEN-noted', id, `token=${JSON.stringify(tok)} expect=${JSON.stringify(p.expect)}`]);
  } else if (!tok) {
    rows.push(['EXPECT-BUT-NO-TOKEN', id, `expect=${JSON.stringify(p.expect)}`]);
  }
}
console.log(`entries=${ids.length} withProof=${withProof} noExpect=${noExpect} noExpectNoToken=${noExpectNoToken} expectNotSubstringOfToken=${notSubstring} ofWhichNoProofNote=${notSubNoNote}`);
const counts = {};
for (const r of rows) counts[r[0]] = (counts[r[0]]||0)+1;
console.log(counts);
for (const r of rows.filter(r=>r[0]!=='EXPECT-NOT-IN-TOKEN-noted')) console.log(r[0], '|', r[1], '|', r[2]);
console.log('--- noted (sample 10) ---');
for (const r of rows.filter(r=>r[0]==='EXPECT-NOT-IN-TOKEN-noted').slice(0,10)) console.log(r[1], '|', r[2]);
